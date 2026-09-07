"""
Django settings for the Chiang Mai AI browser-voice demo.

Deliberately minimal: the Channels consumer never touches the ORM and nothing
here needs migrations, so there are no contrib apps and the SQLite database is
declared but never connected. Run with Daphne (see manage.py / README).
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-demo-insecure-secret')

DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = []
MIDDLEWARE = []

# Only the Channels WebSocket path is served; HTTP requests are answered by a
# tiny text probe in config/asgi.py, so no URLconf is required.
ROOT_URLCONF = None

ASGI_APPLICATION = 'config.asgi.application'

# Single-process dev only — one in-memory channel layer is enough for one
# browser session talking straight to the consumer.
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Declared so the settings loader is happy; never migrated, never connected.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Restaurant / voice-agent config (mirrors the production repo) ---
RESTAURANT_NAME = os.getenv('RESTAURANT_NAME', 'Chiang Mai')

DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY', '')

# STT: nova-3-general supports keyterm biasing (needed for Thai dish names).
DEEPGRAM_VOICE_AGENT_STT_MODEL = os.getenv(
    'DEEPGRAM_VOICE_AGENT_STT_MODEL', 'nova-3-general'
)
DEEPGRAM_VOICE_AGENT_LLM_MODEL = os.getenv(
    'DEEPGRAM_VOICE_AGENT_LLM_MODEL', 'gpt-4o-mini'
)
DEEPGRAM_VOICE_AGENT_TTS_MODEL = os.getenv(
    'DEEPGRAM_VOICE_AGENT_TTS_MODEL', 'aura-asteria-en'
)
DEEPGRAM_VOICE_AGENT_TEMPERATURE = float(
    os.getenv('DEEPGRAM_VOICE_AGENT_TEMPERATURE', '0')
)

# Logging — the relay is the whole app, so keep its output on the console.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {'format': '%(levelname)s %(name)s %(message)s'},
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'relay': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'agent': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'daphne': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
    },
}
