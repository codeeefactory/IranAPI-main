from __future__ import annotations

import json
import logging
from xml.etree.ElementTree import Element, SubElement, tostring

from django.http import HttpRequest, HttpResponse
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils import timezone

from api.repositories import MongoRepository
from api.serializers import (
    serialize_api_detail,
    serialize_category,
    serialize_documentation,
    serialize_pricing_plan,
)
from api.views import enrich_api_list


logger = logging.getLogger(__name__)

NAV_LINKS: tuple[tuple[str, str], ...] = (
    ("/", "خانه"),
    ("/browse", "مرور APIها"),
    ("/documentation", "مستندات"),
    ("/pricing", "قیمت‌گذاری"),
)

STATIC_SITEMAP_ENTRIES: tuple[tuple[str, str, str], ...] = (
    ("/", "daily", "1.0"),
    ("/browse", "daily", "0.95"),
    ("/documentation", "weekly", "0.8"),
    ("/pricing", "daily", "0.82"),
    ("/terms", "monthly", "0.35"),
    ("/privacy", "monthly", "0.35"),
)


def _site_origin(request: HttpRequest) -> str:
    return f"{'https' if request.is_secure() else 'http'}://{request.get_host()}"


def _coerce_lastmod(value) -> str | None:
    if value is None:
        return None
    if hasattr(value, "date"):
        return value.date().isoformat()
    return str(value)


def _page_payload(items: list[dict], *, page_size: int) -> dict[str, object]:
    total = len(items)
    return {
        "count": total,
        "next": None,
        "previous": None,
        "results": items[:page_size],
    }


def _home_bootstrap(repository: MongoRepository) -> dict[str, object]:
    categories = [serialize_category(category) for category in repository.list_categories(ordering="name")]
    featured = enrich_api_list(repository.list_apis(featured=True, ordering="-rating"), repository)
    ranked = enrich_api_list(repository.list_apis(ordering="-rating"), repository)
    return {
        "categories": _page_payload(categories, page_size=100),
        "featuredApis": _page_payload(featured, page_size=12),
        "apis": _page_payload(ranked, page_size=12),
    }


def _browse_bootstrap(repository: MongoRepository) -> dict[str, object]:
    categories = [serialize_category(category) for category in repository.list_categories(ordering="name")]
    featured = enrich_api_list(repository.list_apis(featured=True, ordering="-rating"), repository)
    ranked = enrich_api_list(repository.list_apis(ordering="-rating"), repository)
    return {
        "categories": _page_payload(categories, page_size=100),
        "recommendedApis": _page_payload(featured, page_size=12),
        "apis": _page_payload(ranked, page_size=12),
    }


def _pricing_bootstrap(repository: MongoRepository) -> dict[str, object]:
    plans = [serialize_pricing_plan(plan) for plan in repository.list_pricing_plans()]
    apis = enrich_api_list(repository.list_apis(ordering="name"), repository)
    return {
        "pricingPlans": _page_payload(plans, page_size=100),
        "apis": _page_payload(apis, page_size=100),
    }


def _documentation_bootstrap(repository: MongoRepository) -> dict[str, object]:
    apis = enrich_api_list(repository.list_apis(ordering="name"), repository)
    docs = [serialize_documentation(document) for document in repository.list_documentations()]
    return {
        "apis": _page_payload(apis, page_size=100),
        "documentations": _page_payload(docs, page_size=100),
    }


def _api_detail_bootstrap(repository: MongoRepository, slug: str) -> dict[str, object] | None:
    api_doc = repository.get_api_by_slug(slug)
    if not api_doc:
        return None

    api_doc = repository.increment_api_views(int(api_doc["_id"])) or api_doc
    category = None
    if api_doc.get("category_id") is not None:
        category = repository.get_categories_by_ids([int(api_doc["category_id"])]).get(int(api_doc["category_id"]))

    pricing_plans = repository.get_pricing_plans_by_api_ids([int(api_doc["_id"])]).get(int(api_doc["_id"]), [])
    documentations = repository.get_documentations_by_api_ids([int(api_doc["_id"])]).get(int(api_doc["_id"]), [])
    _, similar_docs = repository.list_similar_apis(slug)

    return {
        "api": serialize_api_detail(
            api_doc,
            category=category,
            pricing_plans=pricing_plans,
            documentations=documentations,
        ),
        "similarApis": enrich_api_list(similar_docs, repository),
    }


def _serialize_bootstrap(payload: dict[str, object] | None) -> str:
    if not payload:
        return ""
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"), default=str).replace("</", "<\\/")


def _frontend_bootstrap(request: HttpRequest) -> str:
    normalized_path = request.path.rstrip("/") or "/"

    try:
        repository = MongoRepository()

        if normalized_path == "/":
            return _serialize_bootstrap({"path": normalized_path, "home": _home_bootstrap(repository)})
        if normalized_path == "/browse":
            return _serialize_bootstrap({"path": normalized_path, "browse": _browse_bootstrap(repository)})
        if normalized_path == "/pricing":
            return _serialize_bootstrap({"path": normalized_path, "pricing": _pricing_bootstrap(repository)})
        if normalized_path == "/documentation":
            return _serialize_bootstrap({"path": normalized_path, "documentation": _documentation_bootstrap(repository)})
        if normalized_path.startswith("/api/"):
            slug = normalized_path.split("/", 2)[-1]
            api_detail = _api_detail_bootstrap(repository, slug)
            if api_detail:
                return _serialize_bootstrap({"path": normalized_path, "apiDetail": api_detail})
    except Exception:
        logger.exception("Failed to build frontend bootstrap payload for %s.", request.path)

    return ""


def _compact_text(value: str, fallback: str) -> str:
    cleaned = " ".join((value or "").split())
    return cleaned or fallback


def _format_count(value: int | None) -> str:
    return f"{int(value or 0):,}"


def _frontend_shell(request: HttpRequest) -> dict[str, object]:
    normalized_path = request.path.rstrip("/") or "/"
    shell: dict[str, object] = {
        "nav_links": [{"href": href, "label": label} for href, label in NAV_LINKS],
        "brand_title": "IranAPI",
        "brand_copy": "پرتال مستقل و خزانه امن API",
        "footer_copy": "نمایی سریع از محتوای صفحه تا پیش از راه‌اندازی کامل برنامه.",
    }

    static_shells: dict[str, dict[str, object]] = {
        "/terms": {
            "eyebrow": "Legal",
            "title": "شرایط استفاده از خدمات",
            "description": "قواعد استفاده از پرتال، مسئولیت‌ها و محدودیت‌های سرویس را در این صفحه مرور کنید.",
            "stats": [
                {"label": "وضعیت ایندکس", "value": "عمومی"},
                {"label": "نوع محتوا", "value": "صفحه حقوقی"},
                {"label": "به‌روزرسانی", "value": "دوره‌ای"},
            ],
            "cards": [
                {"title": "پذیرش شرایط", "body": "استفاده از پرتال به معنی پذیرش نسخه جاری شرایط استفاده است."},
                {"title": "استفاده مجاز", "body": "کاربری قانونی، بدون سوءاستفاده، دور زدن محدودیت یا ایجاد اختلال."},
                {"title": "محدودیت مسئولیت", "body": "خدمات بر اساس شرایط و زیرساخت جاری ارائه می‌شوند و تضمین مطلق ندارند."},
            ],
            "primary_link": {"href": "/privacy", "label": "مطالعه حریم خصوصی"},
            "secondary_link": {"href": "/browse", "label": "مرور APIها"},
        },
        "/privacy": {
            "eyebrow": "Privacy",
            "title": "حریم خصوصی",
            "description": "نحوه جمع‌آوری، استفاده، نگه‌داری و محافظت از داده‌های کاربران در پرتال IranAPI.",
            "stats": [
                {"label": "نوع داده", "value": "حساب و مصرف"},
                {"label": "هدف", "value": "پرتال و پشتیبانی"},
                {"label": "اشتراک‌گذاری", "value": "در حد لازم"},
            ],
            "cards": [
                {"title": "اطلاعات پایه", "body": "نام کاربری، ایمیل، داده‌های پروفایل و نشانه‌های فنی مرتبط با استفاده از پرتال."},
                {"title": "هدف استفاده", "body": "بهبود تجربه، مدیریت حساب، پشتیبانی و پایش سلامت فنی سرویس."},
                {"title": "حقوق کاربر", "body": "درخواست مشاهده، اصلاح یا حذف اطلاعات در چارچوب محدودیت‌های فنی و قانونی."},
            ],
            "primary_link": {"href": "/terms", "label": "مطالعه شرایط استفاده"},
            "secondary_link": {"href": "/documentation", "label": "مرکز راهنما"},
        },
        "/signin": {
            "eyebrow": "Portal Access",
            "title": "ورود به پرتال IranAPI",
            "description": "برای مشاهده داشبورد، پروفایل و داده‌های مصرف از حساب توسعه‌دهنده خود استفاده کنید.",
            "stats": [
                {"label": "نوع حساب", "value": "پرتال داخلی"},
                {"label": "مسیر دسترسی API", "value": "IranAPI"},
                {"label": "نشست", "value": "امن"},
            ],
            "cards": [
                {"title": "دسترسی به داشبورد", "body": "بعد از ورود، حساب، دسترسی‌ها و گزارش مصرف در داشبورد در دسترس هستند."},
                {"title": "تفکیک نقش‌ها", "body": "ورود به پرتال، مدیریت کلیدها و فعال‌سازی مصرفی API در مسیر مستقل IranAPI انجام می‌شود."},
            ],
            "primary_link": {"href": "/signup", "label": "ساخت حساب"},
            "secondary_link": {"href": "/browse", "label": "مرور APIها"},
        },
        "/signup": {
            "eyebrow": "Developer Account",
            "title": "ساخت حساب پرتال IranAPI",
            "description": "برای دسترسی به داشبورد، پروفایل توسعه‌دهنده و گزارش‌های مصرف حساب بسازید.",
            "stats": [
                {"label": "حداقل رمز", "value": "۸ کاراکتر"},
                {"label": "پذیرش", "value": "شرایط و حریم خصوصی"},
                {"label": "نوع دسترسی", "value": "پرتال"},
            ],
            "cards": [
                {"title": "فعال‌سازی داشبورد", "body": "با ساخت حساب، مدیریت اطلاعات کاربری و گزارش‌های مصرف فعال می‌شود."},
                {"title": "مرز روشن دسترسی API", "body": "دسترسی مصرفی APIها از مسیر مدیریت‌شده IranAPI فعال می‌شود تا مصرف و کلیدها شفاف بمانند."},
            ],
            "primary_link": {"href": "/signin", "label": "ورود"},
            "secondary_link": {"href": "/terms", "label": "شرایط استفاده"},
        },
        "/payment": {
            "eyebrow": "Access Route",
            "title": "راهنمای فعال‌سازی دسترسی",
            "description": "این مسیر برای هدایت شفاف به فعال‌سازی امن داخل IranAPI و جلوگیری از پرداخت گمراه‌کننده نگه داشته شده است.",
            "stats": [
                {"label": "نوع صفحه", "value": "راهنمای مسیر"},
                {"label": "درگاه محلی", "value": "غیرفعال"},
                {"label": "فعال‌سازی", "value": "داخل IranAPI"},
            ],
            "cards": [
                {"title": "بررسی سرویس", "body": "دسترسی فقط از مسیر IranAPI انجام می‌شود تا وضعیت مصرف، سقف‌ها و کلیدها همگام بمانند."},
                {"title": "بازگشت به داشبورد", "body": "پس از فعال‌سازی، وضعیت دسترسی و مصرف از داشبورد پرتال پیگیری می‌شود."},
            ],
            "primary_link": {"href": "/pricing", "label": "بازگشت به قیمت‌گذاری"},
            "secondary_link": {"href": "/dashboard", "label": "رفتن به داشبورد"},
        },
        "/dashboard": {
            "eyebrow": "Developer Portal",
            "title": "داشبورد توسعه‌دهنده",
            "description": "مرکز مدیریت حساب، دسترسی‌ها و داده‌های مصرف در پرتال IranAPI.",
            "stats": [
                {"label": "نوع صفحه", "value": "محافظت‌شده"},
                {"label": "حساب", "value": "لازم"},
                {"label": "نمایش", "value": "پس از احراز هویت"},
            ],
            "cards": [
                {"title": "دسترسی‌های فعال", "body": "وضعیت سرویس‌ها، پلن‌ها و سقف مصرف از همین ناحیه پیگیری می‌شود."},
                {"title": "ویرایش پروفایل", "body": "اطلاعات حساب و پروفایل توسعه‌دهنده از داشبورد قابل مدیریت است."},
            ],
            "primary_link": {"href": "/signin", "label": "ورود به حساب"},
            "secondary_link": {"href": "/browse", "label": "مرور APIها"},
        },
    }

    if normalized_path in static_shells:
        shell.update(static_shells[normalized_path])
        return shell

    try:
        repository = MongoRepository()

        if normalized_path == "/":
            home = _home_bootstrap(repository)
            featured = home["featuredApis"]["results"][:3]
            shell.update(
                {
                    "eyebrow": "بازار مدرن API",
                    "title": "کشف، ارزیابی و مدیریت APIها در یک تجربه سریع و فارسی",
                    "description": "IranAPI فهرست زنده سرویس‌ها، مستندات و پلن‌های قیمت‌گذاری را در یک مسیر واضح برای تیم‌های فنی جمع می‌کند.",
                    "stats": [
                        {"label": "API فعال", "value": _format_count(home["apis"]["count"])},
                        {"label": "دسته‌بندی", "value": _format_count(home["categories"]["count"])},
                        {"label": "انتشار", "value": "شفاف و یکپارچه"},
                    ],
                    "cards": [
                        {
                            "title": api["name"],
                            "body": _compact_text(
                                api.get("short_description", ""),
                                "جزئیات این سرویس در صفحه اختصاصی آن قابل بررسی است.",
                            ),
                            "href": f"/api/{api['slug']}",
                            "cta": "مشاهده جزئیات",
                        }
                        for api in featured
                    ],
                    "primary_link": {"href": "/browse", "label": "شروع مرور APIها"},
                    "secondary_link": {"href": "/documentation", "label": "مطالعه مستندات"},
                }
            )
            return shell

        if normalized_path == "/browse":
            browse = _browse_bootstrap(repository)
            apis = browse["apis"]["results"][:3]
            shell.update(
                {
                    "eyebrow": "مرور و انتخاب",
                    "title": "نتایج قابل‌اقدام برای انتخاب سریع‌تر API",
                    "description": "فهرست APIها با دسته‌بندی و مرتب‌سازی روشن آماده مرور است تا انتخاب سرویس برای تیم‌های فنی کوتاه‌تر شود.",
                    "stats": [
                        {"label": "نتیجه فعال", "value": _format_count(browse["apis"]["count"])},
                        {"label": "دسته موجود", "value": _format_count(browse["categories"]["count"])},
                        {"label": "پیشنهاد ویژه", "value": _format_count(browse["recommendedApis"]["count"])},
                    ],
                    "cards": [
                        {
                            "title": api["name"],
                            "body": _compact_text(
                                api.get("short_description", ""),
                                "برای این سرویس توضیح کوتاهی ثبت نشده است.",
                            ),
                            "href": f"/api/{api['slug']}",
                            "cta": "بررسی سرویس",
                        }
                        for api in apis
                    ],
                    "primary_link": {"href": "/pricing", "label": "بررسی قیمت‌گذاری"},
                    "secondary_link": {"href": "/documentation", "label": "مرکز راهنما"},
                }
            )
            return shell

        if normalized_path == "/pricing":
            pricing = _pricing_bootstrap(repository)
            plans = pricing["pricingPlans"]["results"][:3]
            unique_services = len({plan.get("api_slug") for plan in pricing["pricingPlans"]["results"]})
            shell.update(
                {
                    "eyebrow": "پلن‌های زنده",
                    "title": "مقایسه قیمت، سقف مصرف و وضعیت انتشار",
                    "description": "پلن‌های فعال و آماده انتشار در این صفحه برای ارزیابی سریع‌تر و تصمیم‌گیری شفاف‌تر گردآوری شده‌اند.",
                    "stats": [
                        {"label": "پلن ثبت‌شده", "value": _format_count(pricing["pricingPlans"]["count"])},
                        {"label": "سرویس دارای پلن", "value": _format_count(unique_services)},
                        {
                            "label": "پلن محبوب",
                            "value": _format_count(
                                sum(1 for plan in pricing["pricingPlans"]["results"] if plan.get("is_popular"))
                            ),
                        },
                    ],
                    "cards": [
                        {
                            "title": plan["name"],
                            "body": f"{plan['plan_type']} • {plan['price']} {plan['currency']}",
                            "href": f"/api/{plan['api_slug']}",
                            "cta": "جزئیات API",
                        }
                        for plan in plans
                    ],
                    "primary_link": {"href": "/browse", "label": "مرور APIها"},
                    "secondary_link": {"href": "/payment", "label": "راهنمای فعال‌سازی"},
                }
            )
            return shell

        if normalized_path == "/documentation":
            docs = _documentation_bootstrap(repository)
            top_docs = docs["documentations"]["results"][:3]
            shell.update(
                {
                    "eyebrow": "مرکز راهنما",
                    "title": "مستندات و مسیرهای راه‌اندازی سرویس‌ها",
                    "description": "راهنماهای داخلی و مستندات ثبت‌شده برای APIها در یک صفحه متمرکز در دسترس هستند.",
                    "stats": [
                        {"label": "سند ثبت‌شده", "value": _format_count(docs["documentations"]["count"])},
                        {"label": "API مستند", "value": _format_count(docs["apis"]["count"])},
                        {"label": "نوع محتوا", "value": "راهنمای داخلی"},
                    ],
                    "cards": [
                        {
                            "title": document["title"],
                            "body": _compact_text(document.get("content", ""), "این سند در صفحه کامل مستندات قابل مطالعه است."),
                            "href": "/documentation",
                            "cta": "مطالعه ادامه",
                        }
                        for document in top_docs
                    ],
                    "primary_link": {"href": "/browse", "label": "رفتن به فهرست APIها"},
                    "secondary_link": {"href": "/pricing", "label": "مرور قیمت‌گذاری"},
                }
            )
            return shell

        if normalized_path.startswith("/api/"):
            slug = normalized_path.split("/", 2)[-1]
            detail = _api_detail_bootstrap(repository, slug)
            if detail:
                api = detail["api"]
                similar = detail["similarApis"][:3]
                plan_count = len(api.get("pricing_plans", []))
                doc_count = len(api.get("documentations", []))
                shell.update(
                    {
                        "eyebrow": "API Detail",
                        "title": api["name"],
                        "description": _compact_text(
                            api.get("description") or api.get("short_description", ""),
                            "جزئیات این سرویس در برنامه اصلی نمایش داده می‌شود.",
                        ),
                        "stats": [
                            {"label": "دسته", "value": (api.get("category") or {}).get("name", "عمومی")},
                            {"label": "پلن فعال", "value": _format_count(plan_count)},
                            {"label": "سند داخلی", "value": _format_count(doc_count)},
                        ],
                        "cards": [
                            {
                                "title": item["name"],
                                "body": _compact_text(
                                    item.get("short_description", ""),
                                    "سرویس مشابه برای ارزیابی جایگزین در دسترس است.",
                                ),
                                "href": f"/api/{item['slug']}",
                                "cta": "مشاهده سرویس",
                            }
                            for item in similar
                        ]
                        or [
                            {
                                "title": "روش دسترسی",
                                "body": api.get("rapidapi", {}).get("public_auth_scheme", "api_key"),
                            },
                            {
                                "title": "شروع قیمت",
                                "body": api.get("pricing_from") or "رایگان / نامشخص",
                            },
                        ],
                        "primary_link": {"href": "/browse", "label": "بازگشت به مرور"},
                        "secondary_link": {"href": "/pricing", "label": "بررسی پلن‌ها"},
                    }
                )
                return shell
    except Exception:
        logger.exception("Failed to build frontend shell context for %s.", request.path)

    shell.update(
        {
            "eyebrow": "IranAPI",
            "title": "پرتال توسعه‌دهندگان و بازار API",
            "description": "نمای اولیه صفحه در حال آماده‌سازی است.",
            "primary_link": {"href": "/", "label": "بازگشت به خانه"},
            "secondary_link": {"href": "/browse", "label": "مرور APIها"},
        }
    )
    return shell


def robots_txt(request: HttpRequest) -> HttpResponse:
    origin = _site_origin(request)
    sitemap_url = f"{origin}{reverse('sitemap-xml')}"
    body = "\n".join(
        [
            "User-agent: *",
            "Allow: /",
            "Disallow: /api/v1/account/",
            "Disallow: /signin",
            "Disallow: /signup",
            "Disallow: /dashboard",
            "Disallow: /payment",
            f"Sitemap: {sitemap_url}",
        ]
    )
    return HttpResponse(body, content_type="text/plain; charset=utf-8")


def sitemap_xml(request: HttpRequest) -> HttpResponse:
    origin = _site_origin(request)
    lastmod = timezone.now().date().isoformat()

    urlset = Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

    def add_url(path: str, *, changefreq: str, priority: str, page_lastmod: str | None = None) -> None:
        url = SubElement(urlset, "url")
        SubElement(url, "loc").text = f"{origin}{path}"
        SubElement(url, "changefreq").text = changefreq
        SubElement(url, "priority").text = priority
        if page_lastmod:
            SubElement(url, "lastmod").text = page_lastmod

    for path, changefreq, priority in STATIC_SITEMAP_ENTRIES:
        add_url(path, changefreq=changefreq, priority=priority, page_lastmod=lastmod)

    try:
        repository = MongoRepository()
        for api_doc in repository.list_apis(ordering="-updated_at"):
            slug = api_doc.get("slug")
            if not slug:
                continue
            add_url(
                f"/api/{slug}",
                changefreq="weekly",
                priority="0.72",
                page_lastmod=_coerce_lastmod(api_doc.get("updated_at") or api_doc.get("created_at")),
            )
    except Exception:
        logger.exception("Failed to build dynamic sitemap entries from the repository.")

    xml_bytes = tostring(urlset, encoding="utf-8", xml_declaration=True)
    return HttpResponse(xml_bytes, content_type="application/xml; charset=utf-8")


def frontend_app(request: HttpRequest, slug: str | None = None) -> TemplateResponse:
    return TemplateResponse(
        request,
        "index.html",
        {
            "frontend_bootstrap_json": _frontend_bootstrap(request),
            "frontend_shell": _frontend_shell(request),
        },
    )
