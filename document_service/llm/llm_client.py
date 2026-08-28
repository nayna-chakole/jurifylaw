"""
ai/llm/llm_client.py

Strict-priority LLM provider chain with automatic fallback:
  1. Groq (primary)
  2. OpenRouter (secondary)
  3. Gemini (fallback)

The priority ORDER itself is configurable via LLM_PROVIDER_PRIORITY in
.env (default "groq,openrouter,gemini") — no code change needed to
reorder, drop, or add a provider to the chain.

Falls through to the next provider on rate limits, quota exhaustion,
timeouts, and other transient failures. Non-transient errors (bad
prompt, invalid config) raise immediately rather than burning fallback
attempts. Every successful request logs which provider handled it —
never a raw key or token value.
"""

import os
import re
import time

from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types

# ---------------------------------------------------------------------
# Provider configuration — every value below is overridable via .env.
# Listed in default priority order: Groq, OpenRouter, Gemini.
# ---------------------------------------------------------------------

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")


REQUEST_TIMEOUT_SECONDS = float(os.environ.get("LLM_REQUEST_TIMEOUT", "30"))

_KNOWN_PROVIDERS = {"groq", "openrouter", "gemini"}
_raw_priority = os.environ.get("LLM_PROVIDER_PRIORITY", "groq,openrouter,gemini")
PROVIDER_PRIORITY = [p.strip().lower() for p in _raw_priority.split(",") if p.strip()]
_unknown = [p for p in PROVIDER_PRIORITY if p not in _KNOWN_PROVIDERS]
if _unknown:
    print(f"  Warning: LLM_PROVIDER_PRIORITY has unrecognized entries {_unknown} — ignoring them.")
    PROVIDER_PRIORITY = [p for p in PROVIDER_PRIORITY if p in _KNOWN_PROVIDERS]
if not PROVIDER_PRIORITY:
    PROVIDER_PRIORITY = ["groq", "openrouter", "gemini"]

DEFAULT_MODEL = GROQ_MODEL  # Groq is primary, so this is kept for any code that imports DEFAULT_MODEL directly

# ---- Lazy client init: a provider with no key is simply skipped, never
#      crashes at import time ----
_groq_client = None
if GROQ_API_KEY:
    from groq import Groq
    _groq_client = Groq(api_key=GROQ_API_KEY, timeout=REQUEST_TIMEOUT_SECONDS)

_openrouter_client = None
if OPENROUTER_API_KEY:
    from openai import OpenAI
    _openrouter_client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
        timeout=REQUEST_TIMEOUT_SECONDS,
    )

_gemini_client = None
if GEMINI_API_KEY:
    _gemini_client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(timeout=int(REQUEST_TIMEOUT_SECONDS * 1000)),
    )


def _redact(text: str) -> str:
    """Strip anything resembling a leaked key/token before it's ever printed."""
    return re.sub(r"(key|token|authorization)[\"'=:]+[\w\-\.]{10,}", r"\1=[REDACTED]", text, flags=re.IGNORECASE)


def _is_transient_error(e: Exception) -> bool:
    msg = str(e).lower()
    markers = [
        "resource_exhausted", "429", "rate limit", "rate_limit",
        "timeout", "timed out", "503", "unavailable", "overloaded",
        "500", "502", "504", "connection", "quota",
    ]
    return any(m in msg for m in markers)


def _raw_generate_groq(prompt, max_tokens, temperature):
    resp = _groq_client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=max_tokens,
        temperature=temperature,
        reasoning_effort="low",
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.choices[0].message.content


def _raw_generate_openrouter(prompt, max_tokens, temperature):
    resp = _openrouter_client.chat.completions.create(
        model=OPENROUTER_MODEL,
        max_tokens=max_tokens,
        temperature=temperature,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.choices[0].message.content


def _raw_generate_gemini(prompt, max_tokens, temperature, model):
    response = _gemini_client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=max_tokens,
            temperature=temperature,
            thinking_config=types.ThinkingConfig(thinking_level="MINIMAL"),
        ),
    )
    return response.text


def _try_groq(prompt, max_tokens, temperature):
    if _groq_client is None:
        return None, "GROQ_API_KEY not set"
    try:
        return _raw_generate_groq(prompt, max_tokens, temperature), GROQ_MODEL
    except Exception as e:
        if not _is_transient_error(e):
            raise
        return None, _redact(str(e))


def _try_openrouter(prompt, max_tokens, temperature):
    if _openrouter_client is None:
        return None, "OPENROUTER_API_KEY not set"
    try:
        return _raw_generate_openrouter(prompt, max_tokens, temperature), OPENROUTER_MODEL
    except Exception as e:
        if not _is_transient_error(e):
            raise
        return None, _redact(str(e))


def _try_gemini(prompt, max_tokens, temperature, model, max_retries):
    """Returns (text, model_used) on success, or (None, error_str) on failure."""
    if _gemini_client is None:
        return None, "GEMINI_API_KEY not set"
    gemini_model = model or GEMINI_MODEL
    attempt = 0
    while True:
        try:
            text = _raw_generate_gemini(prompt, max_tokens, temperature, gemini_model)
            return text, gemini_model
        except Exception as e:
            if not _is_transient_error(e):
                raise
            if attempt < max_retries:
                wait_match = re.search(r"retry in ([\d.]+)s", str(e))
                wait_seconds = float(wait_match.group(1)) + 2 if wait_match else 20
                print(f"  [gemini] transient error — waiting {wait_seconds:.0f}s "
                      f"before retry ({attempt + 1}/{max_retries})...")
                time.sleep(wait_seconds)
                attempt += 1
                continue
            return None, _redact(str(e))


# Handler signatures are normalized to (prompt, max_tokens, temperature, model, max_retries)
# so generate() can dispatch uniformly. Only Gemini's model/model overrides and
# retry-with-backoff actually use the extra `model`/`max_retries` args.
_PROVIDER_HANDLERS = {
    "groq": lambda prompt, max_tokens, temperature, model, max_retries:
        _try_groq(prompt, max_tokens, temperature),
    "openrouter": lambda prompt, max_tokens, temperature, model, max_retries:
        _try_openrouter(prompt, max_tokens, temperature),
    "gemini": lambda prompt, max_tokens, temperature, model, max_retries:
        _try_gemini(prompt, max_tokens, temperature, model, max_retries),
}


def generate(prompt: str, max_tokens: int = 500, temperature: float = 0.3,
             model: str = None, max_retries: int = 2) -> str:
    """
    Generates text by walking PROVIDER_PRIORITY in order (default:
    groq -> openrouter -> gemini, configurable via LLM_PROVIDER_PRIORITY
    in .env). Moves to the next provider only on rate limits, quota
    exhaustion, timeouts, or other transient failures. `model` (if
    given) only overrides the Gemini model — Groq and OpenRouter always
    use their own configured model. Logs which provider handled the
    request on success; never logs key/token values.
    """
    last_errors = []

    for provider_name in PROVIDER_PRIORITY:
        handler = _PROVIDER_HANDLERS[provider_name]
        text, info = handler(prompt, max_tokens, temperature, model, max_retries)

        if text is not None:
            print(f"[LLM] Request handled by: {provider_name} (model={info})")
            return text

        # info is an error/skip reason here, not a model name
        print(f"  [{provider_name}] unavailable ({info}) — trying next provider.")
        last_errors.append(f"{provider_name}: {info}")

    raise RuntimeError(
        "All configured LLM providers failed or are unconfigured. "
        f"Priority chain tried: {PROVIDER_PRIORITY}. Details: {'; '.join(last_errors)}. "
        "Set at least one of GROQ_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY in .env."
    )


if __name__ == "__main__":
    print(f"Provider priority: {PROVIDER_PRIORITY}")
    test_prompt = "In one sentence, what is a security deposit?"
    print(f"Prompt: {test_prompt}")
    print(f"Response: {generate(test_prompt, max_tokens=200)}")