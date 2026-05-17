import sys

from django.apps import AppConfig
from django.conf import settings


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"

    @staticmethod
    def _should_seed_sample_data_on_startup() -> bool:
        command = sys.argv[1] if len(sys.argv) > 1 else ""
        return command == "runserver" or "gunicorn" in sys.argv[0]

    def ready(self):
        from .seed import seed_sample_data

        if settings.AUTO_SEED_SAMPLE_DATA and self._should_seed_sample_data_on_startup():
            seed_sample_data()
