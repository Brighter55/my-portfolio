"""Deepgram Voice Agent Settings for the browser demo.

Mirrors the production repo's orders/agent.py build_agent_settings() with one
change: audio is linear16 @ 16 kHz mono on both directions (the browser), not
Twilio-compatible mulaw @ 8 kHz.
"""

from django.conf import settings

from deepgram.agent.v1 import (
    AgentV1Settings,
    AgentV1SettingsAgent,
    AgentV1SettingsAgentListen,
    AgentV1SettingsAgentListenProvider_V1,
    AgentV1SettingsAudio,
    AgentV1SettingsAudioInput,
    AgentV1SettingsAudioOutput,
)
from deepgram.types.speak_settings_v1 import SpeakSettingsV1
from deepgram.types.speak_settings_v1provider import SpeakSettingsV1Provider_Deepgram
from deepgram.types.think_settings_v1 import ThinkSettingsV1
from deepgram.types.think_settings_v1provider import ThinkSettingsV1Provider_OpenAi

from .functions import build_functions
from .loader import build_keyterms, build_prompt

# Browser audio codec — must match what the frontend sends and expects back.
_AUDIO_ENCODING = 'linear16'
_AUDIO_SAMPLE_RATE = 16000


def build_greeting() -> str:
    """Opening line the agent speaks (also surfaced to the transcript UI)."""
    return (
        f"Thank you for calling {settings.RESTAURANT_NAME}. All our staff are "
        "currently busy assisting other customers, but I can take your order "
        "right away. What can I get for you today?"
    )


def build_agent_settings():
    """Build the AgentV1Settings payload sent once per conversation.

    STT: nova-3-general (the only model tier supporting keyterm biasing for
    Thai dish names). LLM: gpt-4o-mini at temperature 0 (deterministic order
    taking). TTS: Deepgram Aura. The greeting is spoken by the agent.
    """
    return AgentV1Settings(
        type='Settings',
        audio=AgentV1SettingsAudio(
            input=AgentV1SettingsAudioInput(
                encoding=_AUDIO_ENCODING, sample_rate=_AUDIO_SAMPLE_RATE
            ),
            output=AgentV1SettingsAudioOutput(
                encoding=_AUDIO_ENCODING,
                sample_rate=_AUDIO_SAMPLE_RATE,
                container='none',
            ),
        ),
        agent=AgentV1SettingsAgent(
            listen=AgentV1SettingsAgentListen(
                # v1 provider for Nova models (v2 is Flux-only).
                provider=AgentV1SettingsAgentListenProvider_V1(
                    version='v1',
                    type='deepgram',
                    model=settings.DEEPGRAM_VOICE_AGENT_STT_MODEL,
                    keyterms=build_keyterms(),
                ),
            ),
            think=ThinkSettingsV1(
                provider=ThinkSettingsV1Provider_OpenAi(
                    type='open_ai',
                    model=settings.DEEPGRAM_VOICE_AGENT_LLM_MODEL,
                    temperature=settings.DEEPGRAM_VOICE_AGENT_TEMPERATURE,
                ),
                prompt=build_prompt(),
                functions=build_functions(),
            ),
            speak=SpeakSettingsV1(
                provider=SpeakSettingsV1Provider_Deepgram(
                    type='deepgram',
                    model=settings.DEEPGRAM_VOICE_AGENT_TTS_MODEL,
                ),
            ),
            greeting=build_greeting(),
        ),
    )
