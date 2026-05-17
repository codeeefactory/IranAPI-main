from __future__ import annotations

from django.core.management.base import BaseCommand

from api.seed import seed_sample_data


class Command(BaseCommand):
    help = "Seed deterministic sample data for local QA, demos, and browser validation."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Insert any missing sample records even if catalog data already exists.",
        )

    def handle(self, *args, **options):
        summary = seed_sample_data(force=bool(options["force"]))
        self.stdout.write(self.style.SUCCESS(f"Sample data ready: {summary}"))
