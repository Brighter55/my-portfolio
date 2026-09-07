"""Load the vendored demo system prompt and STT keyterms.

The files in agent/assets/ are trimmed copies of the production repo's
_dg_va_prompt.txt and _dg_keyterms.txt (limited to the three demo menu items).
The menu is already inline, so no DB regex-replacement is needed.
"""

from pathlib import Path

_ASSETS = Path(__file__).resolve().parent / 'assets'
PROMPT_PATH = _ASSETS / '_dg_va_prompt.txt'
KEYTERMS_PATH = _ASSETS / '_dg_keyterms.txt'


def build_prompt() -> str:
    """Return the full demo system prompt (one-keyterm-per-line semantics not
    applied here — this is plain prose the LLM reads)."""
    return PROMPT_PATH.read_text(encoding='utf-8')


def build_keyterms() -> list:
    """Return deduped, lowercased STT keyterms for the three menu items.

    Mirrors the production load_keyterms(): one per line, blank lines and
    #-comments skipped. A 3-item list is far under Deepgram's 500-token cap.
    """
    seen = set()
    keyterms = []
    for line in KEYTERMS_PATH.read_text(encoding='utf-8').splitlines():
        term = line.strip().lower()
        if term and not term.startswith('#') and term not in seen:
            seen.add(term)
            keyterms.append(term)
    return keyterms
