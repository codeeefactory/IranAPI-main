from __future__ import annotations

from functools import lru_cache
from threading import Lock

from django.conf import settings
from django.utils import timezone
from pymongo import ASCENDING, DESCENDING, MongoClient, ReturnDocument
from pymongo.database import Database


try:
    import mongomock
except ImportError:  # pragma: no cover - optional at runtime
    mongomock = None


_client_lock = Lock()
_indexes_ready = False


def _build_client() -> MongoClient:
    if settings.MONGODB_USE_MOCK:
        if mongomock is None:  # pragma: no cover - protected by dependency install
            raise RuntimeError("MONGODB_USE_MOCK is enabled but mongomock is not installed.")
        return mongomock.MongoClient(tz_aware=True)

    return MongoClient(
        settings.MONGODB_URI,
        tz_aware=True,
        serverSelectionTimeoutMS=5000,
        uuidRepresentation="standard",
    )


@lru_cache(maxsize=1)
def get_client() -> MongoClient:
    return _build_client()


def get_database() -> Database:
    database = get_client()[settings.MONGODB_DATABASE]
    ensure_indexes(database)
    return database


def ensure_indexes(database: Database | None = None) -> None:
    global _indexes_ready

    if _indexes_ready:
        return

    with _client_lock:
        if _indexes_ready:
            return

        db = database if database is not None else get_client()[settings.MONGODB_DATABASE]

        db["counters"].create_index([("_id", ASCENDING)], unique=True)

        db["users"].create_index([("_id", ASCENDING)], unique=True)
        db["users"].create_index([("username_normalized", ASCENDING)], unique=True)
        db["users"].create_index([("email_normalized", ASCENDING)], unique=True, sparse=True)
        db["users"].create_index([("profile.api_key", ASCENDING)], unique=True, sparse=True)

        db["categories"].create_index([("_id", ASCENDING)], unique=True)
        db["categories"].create_index([("slug", ASCENDING)], unique=True)
        db["categories"].create_index([("name", ASCENDING)])

        db["apis"].create_index([("_id", ASCENDING)], unique=True)
        db["apis"].create_index([("slug", ASCENDING)], unique=True)
        db["apis"].create_index([("status", ASCENDING), ("is_featured", DESCENDING), ("is_popular", DESCENDING)])
        db["apis"].create_index([("category_id", ASCENDING), ("status", ASCENDING)])
        db["apis"].create_index([("publication_status", ASCENDING), ("canonical_version", ASCENDING)])
        db["apis"].create_index([("tags", ASCENDING)])
        db["apis"].create_index([("tags_normalized", ASCENDING)])
        db["apis"].create_index([("status", ASCENDING), ("rating", DESCENDING), ("views_count", DESCENDING)])
        db["apis"].create_index(
            [("name", "text"), ("name_en", "text"), ("description", "text"), ("short_description", "text")],
            default_language="none",
            name="api_text_search",
        )

        db["pricing_plans"].create_index([("_id", ASCENDING)], unique=True)
        db["pricing_plans"].create_index([("api_id", ASCENDING), ("is_active", ASCENDING)])
        db["pricing_plans"].create_index([("rapidapi_plan_slug", ASCENDING)], sparse=True)

        db["documentations"].create_index([("_id", ASCENDING)], unique=True)
        db["documentations"].create_index([("slug", ASCENDING)], unique=True)
        db["documentations"].create_index([("api_id", ASCENDING), ("is_active", ASCENDING)])

        db["access_grants"].create_index([("_id", ASCENDING)], unique=True)
        db["access_grants"].create_index([("user_id", ASCENDING), ("status", ASCENDING)])
        db["access_grants"].create_index([("api_id", ASCENDING), ("status", ASCENDING)])
        db["access_grants"].create_index([("source", ASCENDING), ("status", ASCENDING)])
        db["access_grants"].create_index([("external_subscription_id", ASCENDING)], sparse=True)

        db["api_ratings"].create_index([("_id", ASCENDING)], unique=True)
        db["api_ratings"].create_index([("user_id", ASCENDING), ("api_id", ASCENDING)], unique=True)
        db["api_ratings"].create_index([("api_id", ASCENDING)])

        db["api_usage"].create_index([("_id", ASCENDING)], unique=True)
        db["api_usage"].create_index([("user_id", ASCENDING), ("api_id", ASCENDING)], unique=True)
        db["api_usage"].create_index([("user_id", ASCENDING), ("last_used", DESCENDING)])
        db["api_usage"].create_index([("api_id", ASCENDING)])

        db["sessions"].create_index([("_id", ASCENDING)], unique=True)
        db["sessions"].create_index([("user_id", ASCENDING)])
        db["sessions"].create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)

        db["legacy_tokens"].create_index([("_id", ASCENDING)], unique=True)
        db["legacy_tokens"].create_index([("user_id", ASCENDING)], unique=True)

        _indexes_ready = True


def ping_database() -> bool:
    get_client().admin.command("ping")
    return True


def next_id(sequence_name: str) -> int:
    document = get_database()["counters"].find_one_and_update(
        {"_id": sequence_name},
        {
            "$inc": {"seq": 1},
            "$setOnInsert": {"created_at": timezone.now()},
            "$set": {"updated_at": timezone.now()},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return int(document["seq"])


def set_counter(sequence_name: str, value: int) -> None:
    get_database()["counters"].update_one(
        {"_id": sequence_name},
        {"$set": {"seq": int(value), "updated_at": timezone.now()}},
        upsert=True,
    )


def reset_database() -> None:
    global _indexes_ready
    database_name = settings.MONGODB_DATABASE
    get_client().drop_database(database_name)
    _indexes_ready = False
    ensure_indexes(get_client()[database_name])
