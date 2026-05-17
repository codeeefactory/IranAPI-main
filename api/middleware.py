from __future__ import annotations

import re
from uuid import uuid4

from django.middleware.gzip import GZipMiddleware


LEGACY_ROUTE_MAPPINGS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"^/api/health/$"), "/api/v1/system/health/"),
    (re.compile(r"^/api/auth/register/$"), "/api/v1/auth/register/"),
    (re.compile(r"^/api/auth/login/$"), "/api/v1/auth/login/"),
    (re.compile(r"^/api/auth/logout/$"), "/api/v1/auth/logout/"),
    (re.compile(r"^/api/auth/me/$"), "/api/v1/account/user/"),
    (re.compile(r"^/api/profile/me/$"), "/api/v1/account/profile/"),
    (re.compile(r"^/api/profile/me/generate-api-key/$"), "/api/v1/account/legacy-api-key/"),
    (re.compile(r"^/api/usage/$"), "/api/v1/account/usage/"),
    (re.compile(r"^/api/usage/stats/$"), "/api/v1/account/usage/stats/"),
    (re.compile(r"^/api/categories/$"), "/api/v1/catalog/categories/"),
    (re.compile(r"^/api/categories/(?P<slug>[^/]+)/$"), "/api/v1/catalog/categories/{slug}/"),
    (re.compile(r"^/api/categories/(?P<slug>[^/]+)/apis/$"), "/api/v1/catalog/categories/{slug}/apis/"),
    (re.compile(r"^/api/apis/$"), "/api/v1/catalog/apis/"),
    (re.compile(r"^/api/apis/(?P<slug>[^/]+)/$"), "/api/v1/catalog/apis/{slug}/"),
    (re.compile(r"^/api/apis/(?P<slug>[^/]+)/similar/$"), "/api/v1/catalog/apis/{slug}/similar/"),
    (re.compile(r"^/api/apis/(?P<slug>[^/]+)/rate/$"), "/api/v1/catalog/apis/{slug}/ratings/"),
    (re.compile(r"^/api/pricing-plans/$"), "/api/v1/catalog/pricing-plans/"),
    (re.compile(r"^/api/documentations/$"), "/api/v1/catalog/documentations/"),
]


def build_legacy_notice(path: str) -> dict[str, str] | None:
    for pattern, target in LEGACY_ROUTE_MAPPINGS:
        match = pattern.match(path)
        if not match:
            continue

        return {
            "message": "This endpoint is deprecated. Move to the versioned API route.",
            "canonical_path": target.format(**match.groupdict()),
        }
    return None


class RequestContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = request.headers.get("X-Request-ID") or uuid4().hex
        request.legacy_notice = build_legacy_notice(request.path)

        response = self.get_response(request)
        response["X-Request-ID"] = request.request_id
        response["X-API-Version"] = "v1"
        response["X-Portal-Surface"] = "IranAPI Developer Console"
        response.setdefault("Referrer-Policy", "same-origin")
        response.setdefault("X-Content-Type-Options", "nosniff")
        response.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.setdefault("Cross-Origin-Opener-Policy", "same-origin")

        if self._is_private_api_surface(request.path):
            response["Cache-Control"] = "no-store, max-age=0"
            response["Pragma"] = "no-cache"
            response["Expires"] = "0"

        if request.legacy_notice:
            response["Warning"] = '299 IranAPI "Deprecated API route. Use the versioned API route instead."'
            response["X-API-Deprecated"] = "true"
            response["X-API-Canonical-Path"] = request.legacy_notice["canonical_path"]

            if hasattr(response, "data") and isinstance(response.data, dict):
                meta = response.data.setdefault("meta", {})
                meta["deprecated"] = request.legacy_notice

        return response

    @staticmethod
    def _is_private_api_surface(path: str) -> bool:
        private_prefixes = (
            "/api/v1/account/",
            "/api/v1/auth/",
            "/api/auth/",
            "/api/profile/",
            "/api/usage/",
        )
        return path.startswith(private_prefixes)


class PublicFrontendGZipMiddleware(GZipMiddleware):
    """Compress public shell HTML while leaving API/auth responses untouched."""

    api_prefixes = ("/api/", "/api-auth/", "/admin/", "/media/")

    def process_response(self, request, response):
        if request.path.startswith(self.api_prefixes):
            return response
        return super().process_response(request, response)
