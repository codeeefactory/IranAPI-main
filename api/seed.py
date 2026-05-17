from __future__ import annotations

import logging
from typing import Any

from django.utils import timezone

from .repositories import MongoRepository


logger = logging.getLogger("api")

QA_DEMO_PASSWORD = "StrongPass123!"


def _ensure_document(collection, query: dict[str, Any], document: dict[str, Any]) -> tuple[dict[str, Any], bool]:
    existing = collection.find_one(query)
    if existing:
        return existing, False

    collection.insert_one(document)
    return document, True


def _ensure_user(
    repository: MongoRepository,
    *,
    username: str,
    email: str,
    first_name: str,
    last_name: str,
    profile: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], bool]:
    existing = repository.get_user_by_username(username)
    if existing:
        if profile:
            repository.update_profile(int(existing["_id"]), profile)
        return repository.get_user_by_username(username) or existing, False

    user_doc = repository.create_user(
        username=username,
        password=QA_DEMO_PASSWORD,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )
    if profile:
        repository.update_profile(int(user_doc["_id"]), profile)
    return repository.get_user_by_username(username) or user_doc, True


def seed_sample_data(*, force: bool = False) -> dict[str, int | bool]:
    repository = MongoRepository()

    has_seed_records = bool(repository.get_user_by_username("demo-dev")) and bool(
        repository.apis.find_one({"slug": "speech-gateway"})
    )

    if not force and has_seed_records:
        return {
            "seeded": False,
            "users": repository.users.count_documents({}),
            "categories": repository.categories.count_documents({}),
            "apis": repository.apis.count_documents({}),
            "plans": repository.pricing_plans.count_documents({}),
            "documentations": repository.documentations.count_documents({}),
            "access_grants": repository.access_grants.count_documents({}),
            "usage_items": repository.api_usage.count_documents({}),
        }

    now = timezone.now()

    demo_user, _ = _ensure_user(
        repository,
        username="demo-dev",
        email="demo-dev@iranapi.local",
        first_name="توسعه‌دهنده",
        last_name="نمونه",
        profile={
            "phone": "09120000000",
            "company": "IranAPI Lab",
            "bio": "حساب نمایشی برای اعتبارسنجی محلی، تست رابط کاربری و سنجش قراردادهای API.",
            "avatar": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=300&q=80",
        },
    )
    reviewer_user, _ = _ensure_user(
        repository,
        username="demo-reviewer",
        email="demo-reviewer@iranapi.local",
        first_name="ارزیاب",
        last_name="کیفی",
        profile={
            "company": "IranAPI QA",
            "bio": "حساب دوم برای تست رتبه‌دهی و داده‌های مشابه.",
        },
    )

    ai_category, _ = _ensure_document(
        repository.categories,
        {"slug": "ai-services"},
        repository.build_category_document(
            {
                "slug": "ai-services",
                "name": "هوش مصنوعی",
                "name_en": "AI Services",
                "description": "سرویس‌های پردازش متن، صوت و بینایی ماشین برای تیم‌های محصول و داده.",
                "icon": "sparkles",
                "color": "#2563eb",
                "created_at": now,
                "updated_at": now,
            }
        ),
    )
    fintech_category, _ = _ensure_document(
        repository.categories,
        {"slug": "fintech"},
        repository.build_category_document(
            {
                "slug": "fintech",
                "name": "فین‌تک",
                "name_en": "Fintech",
                "description": "سرویس‌های پرداخت، اعتبارسنجی و گزارش‌های تراکنشی برای تجربه‌های مالی.",
                "icon": "wallet",
                "color": "#0f766e",
                "created_at": now,
                "updated_at": now,
            }
        ),
    )
    location_category, _ = _ensure_document(
        repository.categories,
        {"slug": "location"},
        repository.build_category_document(
            {
                "slug": "location",
                "name": "نقشه و مکان",
                "name_en": "Location",
                "description": "مسیر‌یابی، ژئوکدینگ و تحلیل مکان برای محصولات مبتنی بر موقعیت.",
                "icon": "map",
                "color": "#7c3aed",
                "created_at": now,
                "updated_at": now,
            }
        ),
    )

    speech_api, _ = _ensure_document(
        repository.apis,
        {"slug": "speech-gateway"},
        repository.build_api_document(
            {
                "slug": "speech-gateway",
                "name": "درگاه گفتار",
                "name_en": "speech-gateway",
                "description": "تبدیل گفتار به متن و متن به گفتار با پشتیبانی از فارسی و گزارش‌های مصرف.",
                "short_description": "پردازش گفتار، متن و زیرنویس با تاخیر پایین.",
                "category_id": int(ai_category["_id"]),
                "base_url": "https://speech.example.dev/v1",
                "documentation_url": "https://docs.example.dev/speech",
                "logo": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=240&q=80",
                "banner": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
                "status": "active",
                "is_featured": True,
                "is_popular": True,
                "views_count": 1842,
                "tags": ["speech", "voice", "subtitle"],
                "canonical_version": "v1",
                "rapidapi_listing_url": "",
                "rapidapi_package_slug": "speech-gateway",
                "public_auth_scheme": "api_key",
                "support_url": "https://support.example.dev/speech",
                "publication_status": "published",
                "created_by_user_id": int(demo_user["_id"]),
                "created_by_username": demo_user["username"],
                "created_at": now,
                "updated_at": now,
            }
        ),
    )
    payments_api, _ = _ensure_document(
        repository.apis,
        {"slug": "payments-hub"},
        repository.build_api_document(
            {
                "slug": "payments-hub",
                "name": "هاب پرداخت",
                "name_en": "payments-hub",
                "description": "اعتبارسنجی پرداخت، استعلام تراکنش و وب‌هوک‌های تطبیق برای سرویس‌های مالی.",
                "short_description": "پرداخت و گزارش‌گیری مالی برای تیم‌های فین‌تک.",
                "category_id": int(fintech_category["_id"]),
                "base_url": "https://payments.example.dev/v1",
                "documentation_url": "https://docs.example.dev/payments",
                "logo": "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=240&q=80",
                "status": "active",
                "is_featured": True,
                "is_popular": False,
                "views_count": 977,
                "tags": ["payments", "billing", "reporting"],
                "canonical_version": "v1",
                "rapidapi_listing_url": "",
                "rapidapi_package_slug": "payments-hub",
                "public_auth_scheme": "api_key",
                "support_url": "https://support.example.dev/payments",
                "publication_status": "ready",
                "created_by_user_id": int(demo_user["_id"]),
                "created_by_username": demo_user["username"],
                "created_at": now,
                "updated_at": now,
            }
        ),
    )
    geo_api, _ = _ensure_document(
        repository.apis,
        {"slug": "geo-routes"},
        repository.build_api_document(
            {
                "slug": "geo-routes",
                "name": "مسیریاب ژئو",
                "name_en": "geo-routes",
                "description": "ژئوکدینگ، محاسبه مسیر و تحلیل محدوده‌های جغرافیایی برای تیم‌های عملیات.",
                "short_description": "مکان‌محور، سریع و مناسب پنل‌های عملیاتی.",
                "category_id": int(location_category["_id"]),
                "base_url": "https://geo.example.dev/v1",
                "documentation_url": "https://docs.example.dev/geo",
                "logo": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=240&q=80",
                "status": "active",
                "is_featured": False,
                "is_popular": True,
                "views_count": 1331,
                "tags": ["maps", "routing", "geocoding", "reporting"],
                "canonical_version": "v1",
                "rapidapi_listing_url": "",
                "rapidapi_package_slug": "geo-routes",
                "public_auth_scheme": "api_key",
                "support_url": "https://support.example.dev/geo",
                "publication_status": "published",
                "created_by_user_id": int(demo_user["_id"]),
                "created_by_username": demo_user["username"],
                "created_at": now,
                "updated_at": now,
            }
        ),
    )

    speech_plan, _ = _ensure_document(
        repository.pricing_plans,
        {"api_slug": speech_api["slug"], "rapidapi_plan_slug": "pro"},
        repository.build_pricing_plan_document(
            {
                "api_id": int(speech_api["_id"]),
                "api_slug": speech_api["slug"],
                "api_rapidapi_listing_url": speech_api["rapidapi_listing_url"],
                "name": "Pro Voice",
                "plan_type": "pro",
                "price": 790000,
                "currency": "IRR",
                "requests_per_month": 50000,
                "requests_per_day": 2500,
                "features": ["پشتیبانی اولویت‌دار", "نمونه درخواست‌های آماده", "تحلیل مصرف"],
                "is_popular": True,
                "is_active": True,
                "rapidapi_plan_slug": "pro",
                "is_listed_on_rapidapi": True,
                "created_at": now,
                "updated_at": now,
            }
        ),
    )
    _ensure_document(
        repository.pricing_plans,
        {"api_slug": payments_api["slug"], "rapidapi_plan_slug": "starter"},
        repository.build_pricing_plan_document(
            {
                "api_id": int(payments_api["_id"]),
                "api_slug": payments_api["slug"],
                "api_rapidapi_listing_url": payments_api["rapidapi_listing_url"],
                "name": "Starter Billing",
                "plan_type": "basic",
                "price": 590000,
                "currency": "IRR",
                "requests_per_month": 20000,
                "requests_per_day": 1200,
                "features": ["گزارش تراکنش", "وب‌هوک پرداخت", "داشبورد پایه"],
                "is_popular": False,
                "is_active": True,
                "rapidapi_plan_slug": "starter",
                "is_listed_on_rapidapi": True,
                "created_at": now,
                "updated_at": now,
            }
        ),
    )
    _ensure_document(
        repository.pricing_plans,
        {"api_slug": geo_api["slug"], "rapidapi_plan_slug": "team"},
        repository.build_pricing_plan_document(
            {
                "api_id": int(geo_api["_id"]),
                "api_slug": geo_api["slug"],
                "api_rapidapi_listing_url": geo_api["rapidapi_listing_url"],
                "name": "Team Routing",
                "plan_type": "enterprise",
                "price": 1290000,
                "currency": "IRR",
                "requests_per_month": 100000,
                "requests_per_day": 5000,
                "features": ["مسیر چندایستگاهی", "وب‌هوک رخداد", "گزارش کیفیت"],
                "is_popular": True,
                "is_active": True,
                "rapidapi_plan_slug": "team",
                "is_listed_on_rapidapi": True,
                "created_at": now,
                "updated_at": now,
            }
        ),
    )

    _ensure_document(
        repository.documentations,
        {"api_slug": speech_api["slug"], "slug": "speech-quick-start"},
        repository.build_documentation_document(
            {
                "api_id": int(speech_api["_id"]),
                "api_slug": speech_api["slug"],
                "slug": "speech-quick-start",
                "title": "شروع سریع گفتار",
                "content": "برای شروع، کلید IranAPI خود را از مسیر امن پرتال آماده کنید و نخستین درخواست تبدیل گفتار را با نمونه curl اجرا کنید.",
                "order": 1,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
        ),
    )
    _ensure_document(
        repository.documentations,
        {"api_slug": payments_api["slug"], "slug": "payments-webhooks"},
        repository.build_documentation_document(
            {
                "api_id": int(payments_api["_id"]),
                "api_slug": payments_api["slug"],
                "slug": "payments-webhooks",
                "title": "وب‌هوک‌های پرداخت",
                "content": "نمونه payload رخدادها، امضای درخواست و الگوی retry در این راهنما توضیح داده شده است.",
                "order": 1,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
        ),
    )
    _ensure_document(
        repository.documentations,
        {"api_slug": geo_api["slug"], "slug": "geo-route-planning"},
        repository.build_documentation_document(
            {
                "api_id": int(geo_api["_id"]),
                "api_slug": geo_api["slug"],
                "slug": "geo-route-planning",
                "title": "طراحی مسیرهای بهینه",
                "content": "الگوهای جستجوی مسیر، محدودیت‌های منطقه‌ای و نمونه درخواست‌های بهینه‌سازی در این بخش آمده است.",
                "order": 1,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
        ),
    )

    repository.rate_api(user_id=int(demo_user["_id"]), api_id=int(speech_api["_id"]), value=5)
    repository.rate_api(user_id=int(reviewer_user["_id"]), api_id=int(speech_api["_id"]), value=4)
    repository.rate_api(user_id=int(reviewer_user["_id"]), api_id=int(geo_api["_id"]), value=4)

    _ensure_document(
        repository.access_grants,
        {"user_id": int(demo_user["_id"]), "api_id": int(speech_api["_id"])},
        repository.build_access_grant_document(
            {
                "user_id": int(demo_user["_id"]),
                "api_id": int(speech_api["_id"]),
                "pricing_plan_id": int(speech_plan["_id"]),
                "source": "iranapi",
                "status": "active",
                "external_subscription_id": "qa-sub-speech-pro",
                "external_customer_id": "qa-customer-demo-dev",
                "starts_at": now,
                "requests_per_day": 2500,
                "requests_per_month": 50000,
                "metadata": {"tier": "pro", "seeded": True},
                "created_at": now,
                "updated_at": now,
            }
        ),
    )
    geo_grant, _ = _ensure_document(
        repository.access_grants,
        {"user_id": int(demo_user["_id"]), "api_id": int(geo_api["_id"])},
        repository.build_access_grant_document(
            {
                "user_id": int(demo_user["_id"]),
                "api_id": int(geo_api["_id"]),
                "pricing_plan_id": None,
                "source": "manual",
                "status": "active",
                "external_subscription_id": "",
                "requests_per_day": 300,
                "requests_per_month": 9000,
                "metadata": {"tier": "internal-review", "seeded": True},
                "created_at": now,
                "updated_at": now,
            }
        ),
    )

    _ensure_document(
        repository.api_usage,
        {"user_id": int(demo_user["_id"]), "api_id": int(speech_api["_id"])},
        repository.build_usage_document(
            {
                "user_id": int(demo_user["_id"]),
                "api_id": int(speech_api["_id"]),
                "access_grant_id": repository.access_grants.find_one(
                    {"user_id": int(demo_user["_id"]), "api_id": int(speech_api["_id"])}
                )["_id"],
                "source": "iranapi_sync",
                "requests_count": 14280,
                "last_used": now,
                "external_event_id": "qa-usage-speech",
                "window_started_at": now,
                "window_ended_at": now,
                "created_at": now,
            }
        ),
    )
    _ensure_document(
        repository.api_usage,
        {"user_id": int(demo_user["_id"]), "api_id": int(geo_api["_id"])},
        repository.build_usage_document(
            {
                "user_id": int(demo_user["_id"]),
                "api_id": int(geo_api["_id"]),
                "access_grant_id": int(geo_grant["_id"]),
                "source": "manual",
                "requests_count": 630,
                "last_used": now,
                "external_event_id": "qa-usage-geo",
                "window_started_at": now,
                "window_ended_at": now,
                "created_at": now,
            }
        ),
    )

    logger.info("Sample QA data is ready for local validation.")
    return {
        "seeded": True,
        "users": repository.users.count_documents({}),
        "categories": repository.categories.count_documents({}),
        "apis": repository.apis.count_documents({}),
        "plans": repository.pricing_plans.count_documents({}),
        "documentations": repository.documentations.count_documents({}),
        "access_grants": repository.access_grants.count_documents({}),
        "usage_items": repository.api_usage.count_documents({}),
    }
