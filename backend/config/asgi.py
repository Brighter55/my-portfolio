"""
ASGI config — one WebSocket path for the voice demo relay.

The browser connects here (via the Vite dev-server proxy at /ws) and this
consumer relays linear16 PCM between the browser and the Deepgram Voice Agent.
A tiny HTTP probe answers stray GETs so a misdirected browser tab gets a hint
instead of a hard socket close.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from django.urls import path  # noqa: E402

from relay.consumers import VoiceDemoConsumer  # noqa: E402


async def http_probe(scope, receive, send):
    body = (
        b'Chiang Mai AI ordering-agent demo backend.\n'
        b'Connect the frontend (Vite dev server) to ws://127.0.0.1:8000/ws/demo/chiang-mai-ai\n'
    )
    await send(
        {
            'type': 'http.response.start',
            'status': 200,
            'headers': [(b'content-type', b'text/plain; charset=utf-8')],
        }
    )
    await send({'type': 'http.response.body', 'body': body})


application = ProtocolTypeRouter(
    {
        'http': http_probe,
        'websocket': URLRouter(
            [
                path('ws/demo/chiang-mai-ai', VoiceDemoConsumer.as_asgi()),
            ]
        ),
    }
)
