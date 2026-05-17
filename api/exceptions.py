import logging
from typing import Any

from rest_framework import exceptions, status
from rest_framework.views import exception_handler

from .security import redact_secrets


logger = logging.getLogger("api")


def _extract_message(detail: Any) -> str:
    if isinstance(detail, dict):
        if "detail" in detail:
            return _extract_message(detail["detail"])
        first_value = next(iter(detail.values()), None)
        return _extract_message(first_value) if first_value is not None else "درخواست نامعتبر بود."

    if isinstance(detail, list):
        return _extract_message(detail[0]) if detail else "درخواست نامعتبر بود."

    if detail in (None, ""):
        return "خطایی رخ داد."

    return str(detail)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled API exception", exc_info=exc)
        return response

    request = context.get("request")
    payload = response.data
    if isinstance(payload, dict) and "error" in payload:
        return response

    if isinstance(exc, exceptions.ValidationError):
        code = "validation_error"
    elif isinstance(exc, exceptions.NotAuthenticated):
        code = "not_authenticated"
    elif isinstance(exc, exceptions.AuthenticationFailed):
        code = "authentication_failed"
    elif isinstance(exc, exceptions.PermissionDenied):
        code = "permission_denied"
    elif isinstance(exc, exceptions.NotFound):
        code = "not_found"
    elif isinstance(exc, exceptions.MethodNotAllowed):
        code = "method_not_allowed"
    elif isinstance(exc, exceptions.Throttled):
        code = "throttled"
        if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS and isinstance(payload, dict):
            payload.setdefault("retry_after", getattr(exc, "wait", None))
    else:
        code = "api_error"

    response.data = {
        "error": {
            "code": code,
            "message": redact_secrets(_extract_message(payload)),
            "details": redact_secrets(payload),
            "request_id": getattr(request, "request_id", None),
        }
    }
    return response
