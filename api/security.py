from __future__ import annotations

import logging
import re
from collections.abc import Mapping, Sequence
from typing import Any


SENSITIVE_KEYS = {
    "api_key",
    "api_key_preview",
    "authorization",
    "password",
    "password_confirm",
    "password_hash",
    "secret",
    "session",
    "sessionid",
    "token",
}

SECRET_VALUE_RE = re.compile(
    r"(?i)(iapi_[a-f0-9]{24,}|bearer\s+[a-z0-9._~+/=-]{12,}|token\s+[a-z0-9._~+/=-]{12,}|sessionid=[^;\s]+)"
)


def mask_secret_value(value: Any) -> str:
    text = str(value)
    if len(text) <= 10:
        return "********"
    return f"{text[:4]}********{text[-4:]}"


def redact_secrets(value: Any) -> Any:
    if isinstance(value, Mapping):
        redacted: dict[Any, Any] = {}
        for key, item in value.items():
            key_text = str(key).lower()
            if any(secret_key in key_text for secret_key in SENSITIVE_KEYS):
                redacted[key] = mask_secret_value(item)
            else:
                redacted[key] = redact_secrets(item)
        return redacted

    if isinstance(value, str):
        return SECRET_VALUE_RE.sub(lambda match: mask_secret_value(match.group(0)), value)

    if isinstance(value, Sequence) and not isinstance(value, (bytes, bytearray)):
        return [redact_secrets(item) for item in value]

    return value


class SecretRedactionFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.msg = redact_secrets(record.getMessage())
        record.args = ()
        return True
