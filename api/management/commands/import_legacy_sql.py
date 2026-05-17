from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import unquote, urlparse

import psycopg
from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_datetime

from api.mongo import ensure_indexes, get_database, reset_database, set_counter
from api.repositories import MongoRepository, normalize_email, normalize_username


def parse_json(value, fallback):
    if value in (None, ""):
        return fallback
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return fallback


def parse_dt(value):
    if value in (None, ""):
        return None
    if hasattr(value, "tzinfo"):
        return value
    return parse_datetime(str(value).replace("Z", "+00:00")) or value


@contextmanager
def sql_connection(source_url: str):
    parsed = urlparse(source_url)
    scheme = parsed.scheme.lower()

    if scheme == "sqlite":
        database_name = parsed.path.lstrip("/") or ":memory:"
        connection = sqlite3.connect(str(Path(database_name)))
        connection.row_factory = sqlite3.Row
        try:
            yield connection, scheme
        finally:
            connection.close()
        return

    if scheme in {"postgres", "postgresql", "psql"}:
        connection = psycopg.connect(source_url, row_factory=psycopg.rows.dict_row)
        try:
            yield connection, scheme
        finally:
            connection.close()
        return

    raise CommandError(f"Unsupported source database scheme: {parsed.scheme}")


def fetch_all(connection, query: str):
    cursor = connection.cursor()
    try:
        cursor.execute(query)
        rows = cursor.fetchall()
    finally:
        cursor.close()
    if rows and isinstance(rows[0], sqlite3.Row):
        return [dict(row) for row in rows]
    return [dict(row) for row in rows]


def table_exists(connection, table_name: str) -> bool:
    cursor = connection.cursor()
    try:
        if isinstance(connection, sqlite3.Connection):
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", (table_name,))
        else:
            cursor.execute("SELECT to_regclass(%s) AS name", (table_name,))
        row = cursor.fetchone()
    finally:
        cursor.close()

    if not row:
        return False

    if isinstance(row, sqlite3.Row):
        return bool(row["name"])

    if isinstance(row, dict):
        return bool(row.get("name"))

    return bool(row[0])


class Command(BaseCommand):
    help = "Import legacy SQLite/PostgreSQL IranAPI data into MongoDB."

    def add_arguments(self, parser):
        parser.add_argument("--source-url", help="Legacy relational database URL.")
        parser.add_argument(
            "--drop-target",
            action="store_true",
            help="Drop MongoDB target collections before importing.",
        )

    def handle(self, *args, **options):
        source_url = options.get("source_url") or os.getenv("LEGACY_DATABASE_URL")
        if not source_url:
            raise CommandError("Provide --source-url or set LEGACY_DATABASE_URL.")

        if options.get("drop_target"):
            reset_database()

        repository = MongoRepository()
        database = get_database()
        ensure_indexes(database)

        with sql_connection(source_url) as (connection, _scheme):
            users = fetch_all(
                connection,
                """
                SELECT id, password, last_login, is_superuser, username, first_name, last_name,
                       email, is_staff, is_active, date_joined
                FROM auth_user
                """,
            )
            profiles = (
                {row["user_id"]: row for row in fetch_all(connection, "SELECT * FROM api_userprofile")}
                if table_exists(connection, "api_userprofile")
                else {}
            )
            categories = fetch_all(connection, "SELECT * FROM api_category") if table_exists(connection, "api_category") else []
            apis = fetch_all(connection, "SELECT * FROM api_api") if table_exists(connection, "api_api") else []
            pricing_plans = (
                fetch_all(connection, "SELECT * FROM api_pricingplan") if table_exists(connection, "api_pricingplan") else []
            )
            documentations = (
                fetch_all(connection, "SELECT * FROM api_documentation")
                if table_exists(connection, "api_documentation")
                else []
            )
            access_grants = (
                fetch_all(connection, "SELECT * FROM api_accessgrant") if table_exists(connection, "api_accessgrant") else []
            )
            ratings = fetch_all(connection, "SELECT * FROM api_apirating") if table_exists(connection, "api_apirating") else []
            usage_records = fetch_all(connection, "SELECT * FROM api_apiusage") if table_exists(connection, "api_apiusage") else []
            tokens = (
                fetch_all(connection, "SELECT key, user_id, created FROM authtoken_token")
                if table_exists(connection, "authtoken_token")
                else []
            )

        user_max = 0
        for row in users:
            profile = profiles.get(row["id"], {})
            document = {
                "_id": int(row["id"]),
                "username": row["username"],
                "username_normalized": normalize_username(row["username"]),
                "email": row.get("email") or "",
                "first_name": row.get("first_name") or "",
                "last_name": row.get("last_name") or "",
                "password_hash": row["password"],
                "is_active": bool(row.get("is_active", True)),
                "is_staff": bool(row.get("is_staff", False)),
                "is_superuser": bool(row.get("is_superuser", False)),
                "date_joined": parse_dt(row.get("date_joined")),
                "last_login": parse_dt(row.get("last_login")),
                "created_at": parse_dt(row.get("date_joined")),
                "updated_at": parse_dt(profile.get("updated_at")) or parse_dt(row.get("date_joined")),
                "profile": {
                    "phone": profile.get("phone", ""),
                    "company": profile.get("company", ""),
                    "bio": profile.get("bio", ""),
                    "avatar": profile.get("avatar"),
                    "api_key": profile.get("api_key"),
                    "created_at": parse_dt(profile.get("created_at")) or parse_dt(row.get("date_joined")),
                    "updated_at": parse_dt(profile.get("updated_at")) or parse_dt(row.get("date_joined")),
                },
            }
            normalized_email = normalize_email(document["email"])
            if normalized_email:
                document["email_normalized"] = normalized_email
            repository.users.replace_one({"_id": document["_id"]}, document, upsert=True)
            user_max = max(user_max, int(document["_id"]))
        set_counter("users", user_max)

        user_lookup = {int(row["id"]): row["username"] for row in users}

        category_max = 0
        for row in categories:
            document = repository.build_category_document(
                {
                    "name": row.get("name", ""),
                    "name_en": row.get("name_en", ""),
                    "slug": row.get("slug"),
                    "description": row.get("description", ""),
                    "icon": row.get("icon", ""),
                    "color": row.get("color", "#2563eb"),
                    "created_at": parse_dt(row.get("created_at")),
                    "updated_at": parse_dt(row.get("updated_at")),
                },
                current_id=int(row["id"]),
            )
            repository.categories.replace_one({"_id": document["_id"]}, document, upsert=True)
            category_max = max(category_max, int(document["_id"]))
        set_counter("categories", category_max)

        api_max = 0
        for row in apis:
            document = repository.build_api_document(
                {
                    "name": row.get("name", ""),
                    "name_en": row.get("name_en", ""),
                    "slug": row.get("slug"),
                    "description": row.get("description", ""),
                    "short_description": row.get("short_description", ""),
                    "category_id": row.get("category_id"),
                    "base_url": row.get("base_url", ""),
                    "documentation_url": row.get("documentation_url", ""),
                    "logo": row.get("logo", ""),
                    "banner": row.get("banner", ""),
                    "status": row.get("status", "active"),
                    "is_featured": row.get("is_featured", False),
                    "is_popular": row.get("is_popular", False),
                    "views_count": row.get("views_count", 0),
                    "rating": row.get("rating", 0),
                    "rating_count": row.get("rating_count", 0),
                    "tags": parse_json(row.get("tags"), []),
                    "canonical_version": row.get("canonical_version", "v1"),
                    "rapidapi_listing_url": row.get("rapidapi_listing_url", ""),
                    "rapidapi_package_slug": row.get("rapidapi_package_slug", ""),
                    "public_auth_scheme": row.get("public_auth_scheme", "api_key"),
                    "support_url": row.get("support_url", ""),
                    "publication_status": row.get("publication_status", "draft"),
                    "created_by_user_id": row.get("created_by_id"),
                    "created_by_username": user_lookup.get(row.get("created_by_id")),
                    "created_at": parse_dt(row.get("created_at")),
                    "updated_at": parse_dt(row.get("updated_at")),
                },
                current_id=int(row["id"]),
            )
            repository.apis.replace_one({"_id": document["_id"]}, document, upsert=True)
            api_max = max(api_max, int(document["_id"]))
        set_counter("apis", api_max)

        pricing_max = 0
        for row in pricing_plans:
            api_doc = repository.apis.find_one({"_id": int(row["api_id"])})
            document = repository.build_pricing_plan_document(
                {
                    "api_id": row.get("api_id"),
                    "api_slug": api_doc.get("slug", "") if api_doc else "",
                    "api_rapidapi_listing_url": api_doc.get("rapidapi_listing_url", "") if api_doc else "",
                    "name": row.get("name", ""),
                    "plan_type": row.get("plan_type", "basic"),
                    "price": row.get("price", 0),
                    "currency": row.get("currency", "IRR"),
                    "requests_per_month": row.get("requests_per_month"),
                    "requests_per_day": row.get("requests_per_day"),
                    "features": parse_json(row.get("features"), []),
                    "is_popular": row.get("is_popular", False),
                    "is_active": row.get("is_active", True),
                    "rapidapi_plan_slug": row.get("rapidapi_plan_slug", ""),
                    "is_listed_on_rapidapi": row.get("is_listed_on_rapidapi", False),
                    "created_at": parse_dt(row.get("created_at")),
                    "updated_at": parse_dt(row.get("updated_at")),
                },
                current_id=int(row["id"]),
            )
            repository.pricing_plans.replace_one({"_id": document["_id"]}, document, upsert=True)
            pricing_max = max(pricing_max, int(document["_id"]))
        set_counter("pricing_plans", pricing_max)

        documentation_max = 0
        for row in documentations:
            api_doc = repository.apis.find_one({"_id": int(row["api_id"])})
            document = repository.build_documentation_document(
                {
                    "api_id": row.get("api_id"),
                    "api_slug": api_doc.get("slug", "") if api_doc else "",
                    "title": row.get("title", ""),
                    "slug": row.get("slug"),
                    "content": row.get("content", ""),
                    "order": row.get("order", 0),
                    "is_active": row.get("is_active", True),
                    "created_at": parse_dt(row.get("created_at")),
                    "updated_at": parse_dt(row.get("updated_at")),
                },
                current_id=int(row["id"]),
            )
            repository.documentations.replace_one({"_id": document["_id"]}, document, upsert=True)
            documentation_max = max(documentation_max, int(document["_id"]))
        set_counter("documentations", documentation_max)

        access_max = 0
        for row in access_grants:
            document = repository.build_access_grant_document(
                {
                    "user_id": row.get("user_id"),
                    "api_id": row.get("api_id"),
                    "pricing_plan_id": row.get("pricing_plan_id"),
                    "source": row.get("source", "manual"),
                    "status": row.get("status", "pending"),
                    "external_subscription_id": row.get("external_subscription_id", ""),
                    "external_customer_id": row.get("external_customer_id", ""),
                    "starts_at": parse_dt(row.get("starts_at")),
                    "ends_at": parse_dt(row.get("ends_at")),
                    "requests_per_day": row.get("requests_per_day"),
                    "requests_per_month": row.get("requests_per_month"),
                    "metadata": parse_json(row.get("metadata"), {}),
                    "created_at": parse_dt(row.get("created_at")),
                    "updated_at": parse_dt(row.get("updated_at")),
                },
                current_id=int(row["id"]),
            )
            repository.access_grants.replace_one({"_id": document["_id"]}, document, upsert=True)
            access_max = max(access_max, int(document["_id"]))
        set_counter("access_grants", access_max)

        ratings_max = 0
        for row in ratings:
            document = repository.build_rating_document(
                {
                    "user_id": row.get("user_id"),
                    "api_id": row.get("api_id"),
                    "value": row.get("value", 0),
                    "created_at": parse_dt(row.get("created_at")),
                    "updated_at": parse_dt(row.get("updated_at")),
                },
                current_id=int(row["id"]),
            )
            repository.api_ratings.replace_one({"_id": document["_id"]}, document, upsert=True)
            ratings_max = max(ratings_max, int(document["_id"]))
        set_counter("api_ratings", ratings_max)

        usage_max = 0
        for row in usage_records:
            document = repository.build_usage_document(
                {
                    "user_id": row.get("user_id"),
                    "api_id": row.get("api_id"),
                    "access_grant_id": row.get("access_grant_id"),
                    "source": row.get("source", "manual"),
                    "requests_count": row.get("requests_count", 0),
                    "last_used": parse_dt(row.get("last_used")),
                    "created_at": parse_dt(row.get("created_at")),
                    "external_event_id": row.get("external_event_id", ""),
                    "window_started_at": parse_dt(row.get("window_started_at")),
                    "window_ended_at": parse_dt(row.get("window_ended_at")),
                },
                current_id=int(row["id"]),
            )
            repository.api_usage.replace_one({"_id": document["_id"]}, document, upsert=True)
            usage_max = max(usage_max, int(document["_id"]))
        set_counter("api_usage", usage_max)

        for token in tokens:
            repository.legacy_tokens.replace_one(
                {"_id": token["key"]},
                {
                    "_id": token["key"],
                    "user_id": int(token["user_id"]),
                    "created_at": parse_dt(token.get("created")),
                },
                upsert=True,
            )

        self.stdout.write(self.style.SUCCESS("Legacy SQL data imported into MongoDB."))
        self.stdout.write(
            f"users={repository.users.count_documents({})}, "
            f"categories={repository.categories.count_documents({})}, "
            f"apis={repository.apis.count_documents({})}, "
            f"pricing_plans={repository.pricing_plans.count_documents({})}, "
            f"documentations={repository.documentations.count_documents({})}, "
            f"access_grants={repository.access_grants.count_documents({})}, "
            f"ratings={repository.api_ratings.count_documents({})}, "
            f"usage={repository.api_usage.count_documents({})}"
        )
