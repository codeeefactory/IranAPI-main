import importlib
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APISimpleTestCase

from .apps import ApiConfig
from . import mongo
from .mongo import reset_database
from .repositories import MongoRepository
from .security import redact_secrets
from .seed import seed_sample_data


class _FakeCollection:
    def __init__(self):
        self.index_calls = []

    def create_index(self, *args, **kwargs):
        self.index_calls.append((args, kwargs))


class _NonBooleanDatabase:
    def __init__(self):
        self.collections = {}

    def __bool__(self):
        raise NotImplementedError("Database objects do not implement truth value testing.")

    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = _FakeCollection()
        return self.collections[name]


class MongoIndexTests(SimpleTestCase):
    def test_ensure_indexes_accepts_explicit_database_object(self):
        fake_database = _NonBooleanDatabase()

        with patch.object(mongo, "_indexes_ready", False):
            with patch("api.mongo.get_client") as mock_get_client:
                mongo.ensure_indexes(fake_database)

        mock_get_client.assert_not_called()
        self.assertTrue(fake_database["users"].index_calls)


class AppConfigTests(SimpleTestCase):
    @override_settings(AUTO_SEED_SAMPLE_DATA=True)
    def test_ready_skips_sample_seed_during_management_checks(self):
        config = ApiConfig("api", importlib.import_module("api"))

        with patch("api.apps.sys.argv", ["manage.py", "check"]):
            with patch("api.seed.seed_sample_data") as mock_seed_sample_data:
                config.ready()

        mock_seed_sample_data.assert_not_called()


class SecurityRedactionTests(SimpleTestCase):
    def test_redacts_sensitive_keys_and_inline_tokens(self):
        payload = {
            "password": "StrongPass123!",
            "nested": {"api_key": "iapi_0123456789abcdef0123456789abcdef01234567"},
            "message": "Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456",
        }

        redacted = redact_secrets(payload)

        self.assertNotIn("StrongPass123!", str(redacted))
        self.assertNotIn("iapi_0123456789abcdef0123456789abcdef01234567", str(redacted))
        self.assertNotIn("abcdefghijklmnopqrstuvwxyz123456", str(redacted))


class MongoApiTests(APISimpleTestCase):
    def setUp(self):
        reset_database()
        self.repository = MongoRepository()

        self.user = self.repository.create_user(
            username="ali",
            password="StrongPass123!",
            email="ali@example.com",
            first_name="Ali",
            last_name="Rezaei",
        )
        self.other_user = self.repository.create_user(
            username="mina",
            password="StrongPass123!",
            email="mina@example.com",
            first_name="Mina",
            last_name="Karimi",
        )

        self.category = self.repository.build_category_document(
            {
                "name": "هوش مصنوعی",
                "name_en": "ai",
                "description": "AI APIs",
            }
        )
        self.repository.categories.insert_one(self.category)

        self.api = self.repository.build_api_document(
            {
                "name": "سرویس گفتار",
                "name_en": "speech-api",
                "description": "Speech service",
                "short_description": "Real-time speech APIs",
                "category_id": int(self.category["_id"]),
                "base_url": "https://example.com/speech",
                "documentation_url": "https://example.com/speech/docs",
                "logo": "https://example.com/speech.png",
                "status": "active",
                "is_featured": True,
                "is_popular": True,
                "tags": ["voice", "speech"],
                "created_by_user_id": int(self.user["_id"]),
                "created_by_username": self.user["username"],
                "publication_status": "published",
                "rapidapi_listing_url": "https://rapidapi.com/example/speech",
                "rapidapi_package_slug": "speech",
                "support_url": "https://example.com/support",
            }
        )
        self.repository.apis.insert_one(self.api)

        self.other_api = self.repository.build_api_document(
            {
                "name": "سرویس تبدیل متن",
                "name_en": "text-api",
                "description": "Text APIs",
                "short_description": "Text utilities",
                "category_id": int(self.category["_id"]),
                "base_url": "https://example.com/text",
                "logo": "https://example.com/text.png",
                "status": "active",
                "is_popular": True,
                "tags": ["speech", "text"],
            }
        )
        self.repository.apis.insert_one(self.other_api)

        self.hidden_api = self.repository.build_api_document(
            {
                "name": "پنهان",
                "name_en": "hidden-api",
                "description": "Hidden API",
                "short_description": "Hidden",
                "base_url": "https://example.com/hidden",
                "logo": "https://example.com/hidden.png",
                "status": "inactive",
            }
        )
        self.repository.apis.insert_one(self.hidden_api)

        self.plan = self.repository.build_pricing_plan_document(
            {
                "api_id": int(self.api["_id"]),
                "api_slug": self.api["slug"],
                "api_rapidapi_listing_url": self.api["rapidapi_listing_url"],
                "name": "Pro",
                "plan_type": "pro",
                "price": 490000,
                "currency": "IRR",
                "requests_per_month": 10000,
                "requests_per_day": 500,
                "features": ["Priority support"],
                "is_popular": True,
                "is_active": True,
                "rapidapi_plan_slug": "pro",
                "is_listed_on_rapidapi": True,
            }
        )
        self.repository.pricing_plans.insert_one(self.plan)

        self.documentation = self.repository.build_documentation_document(
            {
                "api_id": int(self.api["_id"]),
                "api_slug": self.api["slug"],
                "title": "شروع سریع",
                "content": "Run this API first",
                "order": 1,
                "is_active": True,
            }
        )
        self.repository.documentations.insert_one(self.documentation)

        self.grant = self.repository.build_access_grant_document(
            {
                "user_id": int(self.user["_id"]),
                "api_id": int(self.api["_id"]),
                "pricing_plan_id": int(self.plan["_id"]),
                "source": "rapidapi",
                "status": "active",
                "external_subscription_id": "sub_123",
                "requests_per_day": 500,
                "requests_per_month": 10000,
                "metadata": {"tier": "pro"},
            }
        )
        self.repository.access_grants.insert_one(self.grant)

        self.usage = self.repository.build_usage_document(
            {
                "user_id": int(self.user["_id"]),
                "api_id": int(self.api["_id"]),
                "access_grant_id": int(self.grant["_id"]),
                "source": "rapidapi_sync",
                "requests_count": 240,
                "window_started_at": timezone.now(),
                "window_ended_at": timezone.now(),
            }
        )
        self.repository.api_usage.insert_one(self.usage)

        self.other_usage = self.repository.build_usage_document(
            {
                "user_id": int(self.user["_id"]),
                "api_id": int(self.other_api["_id"]),
                "source": "manual",
                "requests_count": 32,
                "window_started_at": timezone.now(),
                "window_ended_at": timezone.now(),
            }
        )
        self.repository.api_usage.insert_one(self.other_usage)

    def authenticate_with_token(self, user_document):
        token = self.repository.create_or_get_legacy_token(int(user_document["_id"]))
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_register_creates_session_and_profile(self):
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "username": "sara",
                "email": "sara@example.com",
                "password": "StrongPass123!",
                "password_confirm": "StrongPass123!",
                "first_name": "Sara",
                "last_name": "Ahmadi",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["authenticated"])
        self.assertIsNotNone(response.data["profile"])
        self.assertIn("sessionid", response.cookies)
        self.assertIsNotNone(self.repository.get_user_by_username("sara"))

    def test_session_login_and_current_user(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "ali", "password": "StrongPass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["authenticated"])
        self.assertIn("sessionid", response.cookies)

        current = self.client.get("/api/v1/account/user/")
        self.assertEqual(current.status_code, 200)
        self.assertEqual(current.data["username"], "ali")

    def test_social_auth_providers_are_discoverable(self):
        response = self.client.get("/api/v1/auth/social/providers/")

        self.assertEqual(response.status_code, 200)
        provider_slugs = {provider["slug"] for provider in response.data["providers"]}
        self.assertIn("google", provider_slugs)
        self.assertIn("github", provider_slugs)

    def test_legacy_login_returns_token(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "ali", "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["username"], "ali")

    def test_public_catalog_routes_include_legacy_notice(self):
        response = self.client.get("/api/apis/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["X-API-Deprecated"], "true")
        self.assertEqual(response.data["meta"]["deprecated"]["canonical_path"], "/api/v1/catalog/apis/")

    def test_api_detail_increments_views(self):
        response = self.client.get(f"/api/v1/catalog/apis/{self.api['slug']}/")
        self.assertEqual(response.status_code, 200)

        refreshed = self.repository.get_api_by_slug(self.api["slug"], include_inactive=True)
        self.assertEqual(refreshed["views_count"], 1)
        self.assertEqual(len(response.data["pricing_plans"]), 1)
        self.assertEqual(len(response.data["documentations"]), 1)

    def test_rate_api_creates_then_updates_single_rating(self):
        self.authenticate_with_token(self.user)

        first = self.client.post(
            f"/api/v1/catalog/apis/{self.api['slug']}/ratings/",
            {"rating": 5},
            format="json",
        )
        second = self.client.post(
            f"/api/v1/catalog/apis/{self.api['slug']}/ratings/",
            {"rating": 3},
            format="json",
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertTrue(first.data["created"])
        self.assertFalse(second.data["created"])
        self.assertEqual(self.repository.api_ratings.count_documents({"api_id": int(self.api["_id"])}), 1)

        refreshed = self.repository.get_api_by_slug(self.api["slug"], include_inactive=True)
        self.assertEqual(refreshed["rating_count"], 1)
        self.assertEqual(f"{refreshed['rating']:.2f}", "3.00")

    def test_bearer_token_auth_and_private_cache_headers(self):
        token = self.repository.create_or_get_legacy_token(int(self.user["_id"]))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        response = self.client.get("/api/v1/account/user/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "ali")
        self.assertEqual(response["Cache-Control"], "no-store, max-age=0")
        self.assertEqual(response["Pragma"], "no-cache")

    def test_usage_stats_and_list(self):
        self.authenticate_with_token(self.user)

        usage_response = self.client.get("/api/v1/account/usage/")
        stats_response = self.client.get("/api/v1/account/usage/stats/")

        self.assertEqual(usage_response.status_code, 200)
        self.assertEqual(usage_response.data["count"], 2)
        self.assertEqual(stats_response.status_code, 200)
        self.assertEqual(stats_response.data["total_requests"], 272)
        self.assertEqual(stats_response.data["active_apis"], 2)
        self.assertEqual(stats_response.data["top_apis"][0]["slug"], self.api["slug"])

    def test_access_grants_list(self):
        self.authenticate_with_token(self.user)

        response = self.client.get("/api/v1/account/access/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["api"]["slug"], self.api["slug"])
        self.assertEqual(response.data["results"][0]["pricing_plan"]["rapidapi_plan_slug"], "pro")

    def test_generate_api_key_disabled(self):
        self.authenticate_with_token(self.user)

        response = self.client.post("/api/profile/me/generate-api-key/", format="json")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["error"]["code"], "permission_denied")

    def test_profile_masks_stored_api_key(self):
        user_doc = self.repository.rotate_api_key(int(self.user["_id"]))
        raw_key = user_doc["profile"]["api_key"]
        self.authenticate_with_token(user_doc)

        response = self.client.get("/api/v1/account/profile/")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["has_api_key"])
        self.assertNotEqual(response.data["api_key"], raw_key)
        self.assertNotIn(raw_key, str(response.data))

    def test_schema_endpoint(self):
        response = self.client.get("/api/v1/schema/openapi.json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["info"]["title"], "IranAPI")
        self.assertIn("/api/v1/catalog/apis/", response.data["paths"])

    def test_site_metadata_routes(self):
        robots = self.client.get("/robots.txt")
        sitemap = self.client.get("/sitemap.xml")

        self.assertEqual(robots.status_code, 200)
        self.assertIn("Sitemap:", robots.content.decode("utf-8"))
        self.assertEqual(sitemap.status_code, 200)
        self.assertIn('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"', sitemap.content.decode("utf-8"))
        self.assertIn(f"/api/{self.api['slug']}", sitemap.content.decode("utf-8"))

    def test_frontend_routes_render_bootstrap_shell(self):
        home = self.client.get("/")
        detail = self.client.get(f"/api/{self.api['slug']}")

        self.assertEqual(home.status_code, 200)
        self.assertIn('id="iranapi-bootstrap-data"', home.content.decode("utf-8"))
        self.assertEqual(detail.status_code, 200)
        detail_html = detail.content.decode("utf-8")
        self.assertIn('id="iranapi-bootstrap-data"', detail_html)
        self.assertIn(self.api["slug"], detail_html)

    def test_tag_filter_excludes_inactive(self):
        response = self.client.get("/api/v1/catalog/apis/?tag=speech")
        self.assertEqual(response.status_code, 200)
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertIn(self.api["slug"], slugs)
        self.assertIn(self.other_api["slug"], slugs)
        self.assertNotIn(self.hidden_api["slug"], slugs)

    def test_sample_seed_is_idempotent_and_populates_dashboard_data(self):
        reset_database()
        seed_sample_data()
        second_run = seed_sample_data()
        repository = MongoRepository()

        self.assertFalse(second_run["seeded"])
        self.assertGreaterEqual(repository.categories.count_documents({}), 3)
        self.assertGreaterEqual(repository.apis.count_documents({"status": "active"}), 3)
        self.assertIsNotNone(repository.get_user_by_username("demo-dev"))
        self.assertGreaterEqual(repository.access_grants.count_documents({}), 2)
        self.assertGreaterEqual(repository.api_usage.count_documents({}), 2)
