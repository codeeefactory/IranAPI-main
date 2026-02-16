import os
import sys
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured


BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_STATIC_DIR = BASE_DIR / "frontend_static"


def env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None:
        return default
    value = value.strip()
    return value if value else default


def env_bool(name: str, default: bool = False) -> bool:
    value = env(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: list[str] | None = None) -> list[str]:
    value = env(name)
    if value is None:
        return default[:] if default else []
    return [item.strip() for item in value.split(",") if item.strip()]


def running_tests() -> bool:
    return any(argument in {"test", "pytest"} for argument in sys.argv[1:])


SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env_bool("DJANGO_DEBUG", True)

if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = "iranapi-dev-only-secret-key-change-me"
    else:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is false.")


ALLOWED_HOSTS = env_list(
    "DJANGO_ALLOWED_HOSTS",
    ["localhost", "127.0.0.1", "::1", "0.0.0.0", "backend", ".runflare.run"],
)
CSRF_TRUSTED_ORIGINS = env_list(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    ["http://localhost:5173", "http://127.0.0.1:5173", "https://*.runflare.run"],
)
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    ["http://localhost:5173", "http://127.0.0.1:5173"],
)
CORS_ALLOW_CREDENTIALS = True


MONGODB_URI = env("MONGODB_URI")
MONGODB_DATABASE = env("MONGODB_DATABASE", "iranapi")
MONGODB_USE_MOCK = env_bool("MONGODB_USE_MOCK", running_tests() or not MONGODB_URI)
ENABLE_LEGACY_API_KEYS = env_bool("IRANAPI_ENABLE_LEGACY_API_KEYS", False)
AUTO_SEED_SAMPLE_DATA = env_bool("IRANAPI_AUTO_SEED_SAMPLE_DATA", not MONGODB_URI and not running_tests())


SOCIAL_AUTH_PROVIDERS = {
    "google": {
        "label": "Google",
        "auth_url": env("IRANAPI_SOCIAL_GOOGLE_AUTH_URL", ""),
        "enabled": env_bool("IRANAPI_SOCIAL_GOOGLE_ENABLED", bool(env("IRANAPI_SOCIAL_GOOGLE_AUTH_URL", ""))),
    },
    "github": {
        "label": "GitHub",
        "auth_url": env("IRANAPI_SOCIAL_GITHUB_AUTH_URL", ""),
        "enabled": env_bool("IRANAPI_SOCIAL_GITHUB_ENABLED", bool(env("IRANAPI_SOCIAL_GITHUB_AUTH_URL", ""))),
    },
    "microsoft": {
        "label": "Microsoft",
        "auth_url": env("IRANAPI_SOCIAL_MICROSOFT_AUTH_URL", ""),
        "enabled": env_bool("IRANAPI_SOCIAL_MICROSOFT_ENABLED", bool(env("IRANAPI_SOCIAL_MICROSOFT_AUTH_URL", ""))),
    },
    "linkedin": {
        "label": "LinkedIn",
        "auth_url": env("IRANAPI_SOCIAL_LINKEDIN_AUTH_URL", ""),
        "enabled": env_bool("IRANAPI_SOCIAL_LINKEDIN_ENABLED", bool(env("IRANAPI_SOCIAL_LINKEDIN_AUTH_URL", ""))),
    },
}


INSTALLED_APPS = [
    "whitenoise.runserver_nostatic",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "api",
]


MIDDLEWARE = [
    "api.middleware.RequestContextMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "api.middleware.PublicFrontendGZipMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "IranAPIBackend.urls"
PROJECT_TEMPLATE_DIR = BASE_DIR / "templates"
TEMPLATE_DIRS = [PROJECT_TEMPLATE_DIR]
if FRONTEND_STATIC_DIR.exists():
    TEMPLATE_DIRS.append(FRONTEND_STATIC_DIR)


TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": TEMPLATE_DIRS,
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "IranAPIBackend.wsgi.application"
ASGI_APPLICATION = "IranAPIBackend.asgi.application"


# Active persistence is handled by MongoDB repositories. SQLite is kept only as
# a lightweight Django management/check backend so standard commands like
# showmigrations and migration checks can obtain a cursor.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": env("DJANGO_MANAGEMENT_SQLITE_PATH", str(BASE_DIR / ".django-management.sqlite3")),
    }
}

# Active persistence is Mongo-backed. Historical relational migrations are kept
# in the repository for import/reference only and are intentionally disabled at
# runtime so Django management commands do not require django.contrib.auth.
MIGRATION_MODULES = {
    "api": None,
}


AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


LANGUAGE_CODE = "fa-ir"
TIME_ZONE = "Asia/Tehran"
USE_I18N = True
USE_TZ = True


STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [FRONTEND_STATIC_DIR] if FRONTEND_STATIC_DIR.exists() else []
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
WHITENOISE_MAX_AGE = int(env("WHITENOISE_MAX_AGE", "31536000") or "31536000")
WHITENOISE_IMMUTABLE_FILE_TEST = r"^.+-[0-9A-Za-z_-]{8,}\..+$"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SESSION_COOKIE_NAME = env("DJANGO_SESSION_COOKIE_NAME", "sessionid")
SESSION_COOKIE_AGE = int(env("DJANGO_SESSION_COOKIE_AGE", "1209600") or "1209600")
SESSION_COOKIE_SAMESITE = env("DJANGO_SESSION_COOKIE_SAMESITE", "Lax")
CSRF_COOKIE_SAMESITE = env("DJANGO_CSRF_COOKIE_SAMESITE", "Lax")
SESSION_COOKIE_HTTPONLY = True


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "api.authentication.MongoSessionAuthentication",
        "api.authentication.MongoTokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_PAGINATION_CLASS": "api.pagination.StandardResultsSetPagination",
    "DEFAULT_SCHEMA_CLASS": "rest_framework.schemas.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "api.exceptions.api_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": env("API_ANON_THROTTLE_RATE", "600/minute"),
        "user": env("API_USER_THROTTLE_RATE", "1200/minute"),
    },
    "UNAUTHENTICATED_USER": None,
    "UNAUTHENTICATED_TOKEN": None,
}


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s %(levelname)s [%(name)s] %(message)s",
        },
    },
    "filters": {
        "redact_secrets": {
            "()": "api.security.SecretRedactionFilter",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
            "filters": ["redact_secrets"],
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": env("DJANGO_LOG_LEVEL", "INFO") or "INFO",
            "propagate": False,
        },
        "api": {
            "handlers": ["console"],
            "level": env("API_LOG_LEVEL", "INFO") or "INFO",
            "propagate": False,
        },
        "pymongo": {
            "handlers": ["console"],
            "level": env("PYMONGO_LOG_LEVEL", "WARNING") or "WARNING",
            "propagate": False,
        },
    },
}


if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = int(env("DJANGO_SECURE_HSTS_SECONDS", "3600") or "3600")
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_REFERRER_POLICY = "same-origin"
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", True)
    X_FRAME_OPTIONS = "DENY"
else:
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
