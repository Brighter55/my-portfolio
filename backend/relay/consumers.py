"""
Django Channels WebSocket consumer — thin relay between the browser and the
Deepgram Voice Agent API for the /demos/chiang-mai-ai demo.

One consumer instance per browser session. The browser is the "phone": it
streams linear16 PCM @16 kHz up as binary frames; the consumer relays raw bytes
to the Deepgram agent socket and streams agent audio bytes back down. Agent JSON
events are mapped to small control frames that drive the frontend UI (orb
phase, live transcript, developer console, order recap).

Adapted from the production repo's orders/consumers.py (Twilio Media Streams →
Deepgram) with Twilio removed and the audio codec switched to browser linear16.

Browser <-> server frame protocol (all text frames are JSON):
  up:    {type:'inject', text}            inject a phrase as if the user said it
         {type:'end'}                     user ended the conversation (hang up)
         binary frames                    mic PCM16 @16kHz mono
  down:  {type:'phase',  phase}           connecting|listening|speaking|processing
         {type:'transcript', role, text}  role 'user' | 'assistant'
         {type:'order', order}            place_order handled (demo ack)
         {type:'console', level, text}    developer console line
         {type:'ended', reason}           agent socket closed the conversation
         {type:'error'|'fatal', message}  recoverable / fatal error
         binary frames                    agent audio PCM16 @16kHz mono
"""

import asyncio
import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from deepgram import AsyncDeepgramClient
from deepgram.agent.v1 import (
    AgentV1AgentAudioDone,
    AgentV1AgentStartedSpeaking,
    AgentV1ConversationText,
    AgentV1Error,
    AgentV1FunctionCallRequest,
    AgentV1SendFunctionCallResponse,
    AgentV1SettingsApplied,
    AgentV1UserStartedSpeaking,
    AgentV1Warning,
)
from deepgram.agent.v1.socket_client import V1SocketClientResponse
from deepgram.core.pydantic_utilities import parse_obj_as

from agent.agent_settings import build_agent_settings, build_greeting

logger = logging.getLogger(__name__)

SETTINGS_TIMEOUT = 10.0  # seconds to wait for SettingsApplied before giving up


class VoiceDemoConsumer(AsyncWebsocketConsumer):
    """One browser voice session: browser <-> Deepgram Voice Agent."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.dg_client = None   # AsyncDeepgramClient
        self.dg_ctx = None      # agent.v1.connect() async context manager
        self.dg_socket = None   # AsyncV1SocketClient
        self.pump_task = None   # Deepgram -> browser loop
        self._settings_applied = asyncio.Event()
        self._closed = False

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect(self):
        await self.accept()

        if not settings.DEEPGRAM_API_KEY:
            await self._send(
                {
                    'type': 'fatal',
                    'message': (
                        'DEEPGRAM_API_KEY is not set. Copy backend/.env.example '
                        'to backend/.env and add your Deepgram key '
                        '(https://console.deepgram.com), then restart the backend.'
                    ),
                }
            )
            await self._close(code=4403)
            return

        try:
            self.dg_client = AsyncDeepgramClient(api_key=settings.DEEPGRAM_API_KEY)
            self.dg_ctx = self.dg_client.agent.v1.connect()
            self.dg_socket = await self.dg_ctx.__aenter__()
            await self.dg_socket.send_settings(build_agent_settings())
        except Exception as exc:  # noqa: BLE001
            logger.error('Voice agent startup failed: %s', exc)
            await self._send(
                {
                    'type': 'fatal',
                    'message': f'Could not reach the Deepgram voice agent: {exc}',
                }
            )
            await self._close(code=1011)
            return

        self.pump_task = asyncio.create_task(self._pump())

        # Wait for the agent to accept the settings before streaming mic audio;
        # audio sent before SettingsApplied is dropped by Deepgram.
        try:
            await asyncio.wait_for(
                self._settings_applied.wait(), timeout=SETTINGS_TIMEOUT
            )
        except asyncio.TimeoutError:
            logger.error('Settings never applied within %.0fs', SETTINGS_TIMEOUT)
            await self._send(
                {
                    'type': 'fatal',
                    'message': 'Timed out waiting for the voice agent to be ready. Try again.',
                }
            )
            await self._close(code=1011)
            return

        # Greeting will stream right after settings; surface its text so the
        # transcript bubble matches what the visitor hears.
        await self._send(
            {'type': 'transcript', 'role': 'assistant', 'text': build_greeting(), 'seed': True}
        )
        await self._send({'type': 'console', 'level': 'ok', 'text': 'Voice agent connected (settings applied)'})
        logger.info('Browser voice session ready')

    async def disconnect(self, close_code):
        logger.info('Browser disconnected (code: %s)', close_code)
        await self._teardown()

    async def receive(self, text_data=None, bytes_data=None):
        if bytes_data and self.dg_socket is not None and self._settings_applied.is_set():
            # Browser mic PCM -> Deepgram (best-effort; socket can close mid-turn).
            try:
                await self.dg_socket.send_media(bytes_data)
            except Exception as exc:  # noqa: BLE001
                logger.debug('send_media failed: %s', exc)
            return

        if text_data:
            try:
                msg = json.loads(text_data)
            except json.JSONDecodeError:
                return
            kind = msg.get('type')
            if kind == 'inject':
                text = (msg.get('text') or '').strip()
                if text and self._settings_applied.is_set():
                    await self._inject_user_text(text)
            elif kind == 'end':
                logger.info('User ended the conversation')
                await self._teardown()
                await self._close(code=1000)

    # ------------------------------------------------------------------
    # Deepgram -> browser
    # ------------------------------------------------------------------

    async def _pump(self):
        """Read agent frames until the socket closes (raw websocket, not the
        SDK's start_listening, which raises on unknown message types)."""
        try:
            async for raw in self.dg_socket._websocket:
                if isinstance(raw, bytes):
                    await self._send_bytes(raw)
                else:
                    try:
                        message = parse_obj_as(V1SocketClientResponse, json.loads(raw))
                    except Exception:  # noqa: BLE001
                        logger.debug('Skipping unrecognized agent message')
                        continue
                    await self._handle_agent_message(message)
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.error('Agent listen loop error: %s', exc)
            await self._send({'type': 'error', 'message': str(exc)})
        finally:
            # Agent socket closed — normally server-side end_conversation after
            # place_order. Tell the browser the conversation is over.
            if not self._closed:
                await self._send({'type': 'ended', 'reason': 'agent_closed'})
            await self._teardown()
            await self._close(code=1000)

    async def _handle_agent_message(self, message):
        if isinstance(message, AgentV1SettingsApplied):
            self._settings_applied.set()

        elif isinstance(message, AgentV1ConversationText):
            text = (message.content or '').strip()
            if text:
                await self._send(
                    {'type': 'transcript', 'role': message.role, 'text': text}
                )
                # A completed user utterance means the agent is now thinking.
                if message.role == 'user':
                    await self._send({'type': 'phase', 'phase': 'processing'})

        elif isinstance(message, AgentV1UserStartedSpeaking):
            # Barge-in (visitor talks over the agent). No buffered audio to clear
            # on the browser side — just surface the state.
            await self._send({'type': 'phase', 'phase': 'listening'})
            await self._send({'type': 'console', 'level': 'info', 'text': 'You started speaking (barge-in)'})

        elif isinstance(message, AgentV1AgentStartedSpeaking):
            await self._send({'type': 'phase', 'phase': 'speaking'})

        elif isinstance(message, AgentV1AgentAudioDone):
            await self._send({'type': 'phase', 'phase': 'listening'})
            await self._send({'type': 'console', 'level': 'info', 'text': 'Agent finished speaking'})

        elif isinstance(message, AgentV1FunctionCallRequest):
            await self._handle_function_call(message)

        elif isinstance(message, AgentV1Error):
            logger.error('Agent error: %s (%s)', message.description, message.code)
            await self._send({'type': 'error', 'message': message.description})
            await self._send({'type': 'console', 'level': 'err', 'text': f'Agent error: {message.description}'})

        elif isinstance(message, AgentV1Warning):
            logger.warning('Agent warning: %s (%s)', message.description, message.code)
            await self._send({'type': 'console', 'level': 'warn', 'text': f'Agent warning: {message.description}'})

    # ------------------------------------------------------------------
    # Function calls
    # ------------------------------------------------------------------

    async def _handle_function_call(self, event: AgentV1FunctionCallRequest):
        """Execute a function call from the agent and return the result.

        Wire form: functions:[{id, name, arguments:<json str>}] — the shape the
        current API sends (matches the production consumer).
        """
        if not event.functions:
            return
        func = event.functions[0]
        name, call_id = func.name, func.id
        try:
            args = json.loads(func.arguments) if func.arguments else {}
        except json.JSONDecodeError:
            args = {}

        if name == 'place_order':
            result = {'status': 'confirmed', 'total': args.get('total', 0)}
        elif name == 'end_conversation':
            result = {'status': 'call_ended', 'reason': args.get('reason', '')}
        else:
            logger.warning('Unknown function call: %s', name)
            result = {'status': 'error', 'message': f'Unknown function: {name}'}

        logger.info('Function call: %s -> %s', name, result)
        try:
            await self.dg_socket.send_function_call_response(
                AgentV1SendFunctionCallResponse(
                    type='FunctionCallResponse',
                    name=name,
                    id=call_id,
                    content=json.dumps(result),
                )
            )
        except Exception as exc:  # noqa: BLE001
            logger.debug('Function response send failed for %s: %s', name, exc)

        if name == 'place_order':
            # Conversation-only demo: nothing is persisted, charged, or sent.
            # Surface the parsed order so the UI can show a recap.
            await self._send(
                {
                    'type': 'order',
                    'order': args,
                    'note': 'Demo only — nothing was charged or sent to a POS.',
                }
            )
            await self._send(
                {
                    'type': 'console',
                    'level': 'ok',
                    'text': 'place_order handled — demo ack (no Clover/SMS in this demo)',
                }
            )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _inject_user_text(self, text: str):
        """Inject a phrase into the conversation as if the visitor said it."""
        socket = self.dg_socket
        if socket is None:
            return
        try:
            method = getattr(socket, 'send_inject_user_message', None)
            if method is not None:
                try:
                    from deepgram.agent.v1 import AgentV1InjectUserMessage

                    await method(AgentV1InjectUserMessage(content=text))
                    await self._send({'type': 'console', 'level': 'info', 'text': f'Injected as you: "{text}"'})
                    return
                except ImportError:
                    pass  # model name differs in this SDK build — fall through to raw
            # Fallback: documented agent-protocol JSON text frame.
            await socket._websocket.send(
                json.dumps({'type': 'InjectUserMessage', 'payload': {'content': text}})
            )
            await self._send({'type': 'console', 'level': 'info', 'text': f'Injected as you: "{text}"'})
        except Exception as exc:  # noqa: BLE001
            logger.warning('Text injection failed: %s', exc)
            await self._send({'type': 'error', 'message': 'Could not inject that phrase right now — the agent may be speaking. Try again in a moment.'})
            await self._send({'type': 'console', 'level': 'warn', 'text': 'Text injection refused (agent not idle)'})

    async def _send(self, payload: dict):
        try:
            await self.send(text_data=json.dumps(payload))
        except Exception:  # noqa: BLE001
            pass  # browser already gone

    async def _send_bytes(self, data: bytes):
        try:
            await self.send(bytes_data=data)
        except Exception:  # noqa: BLE001
            pass

    async def _close(self, code: int = 1000):
        try:
            await self.close(code=code)
        except Exception:  # noqa: BLE001
            pass  # connection already gone

    async def _teardown(self):
        """Idempotent teardown of the agent socket and pump task."""
        if self._closed:
            return
        self._closed = True

        if self.pump_task is not None:
            self.pump_task.cancel()
            try:
                await self.pump_task
            except (asyncio.CancelledError, Exception):  # noqa: BLE001
                pass
            self.pump_task = None

        if self.dg_ctx is not None:
            try:
                await self.dg_ctx.__aexit__(None, None, None)
            except Exception as exc:  # noqa: BLE001
                logger.debug('Agent socket close error: %s', exc)
            self.dg_ctx = None
            self.dg_socket = None
        logger.info('Deepgram agent connection closed')
