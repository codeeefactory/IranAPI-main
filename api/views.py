from __future__ import annotations

from django.conf import settings
from django.shortcuts import redirect
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .mongo import ping_database
from .pagination import StandardResultsSetPagination
from .repositories import MongoRepository
from .schema import build_openapi_schema
from .serializers import (
    LoginSerializer,
    RatingSerializer,
    RegistrationSerializer,
    UserProfileUpdateSerializer,
    UserUpdateSerializer,
    build_session_payload,
    serialize_access_grant,
    serialize_api_detail,
    serialize_api_list,
    serialize_category,
    serialize_documentation,
    serialize_pricing_plan,
    serialize_profile,
    serialize_usage_item,
    serialize_user,
)


def parse_bool(value: str | None) -> bool | None:
    if value is None:
        return None
    lowered = value.strip().lower()
    if lowered in {"1", "true", "yes", "on"}:
        return True
    if lowered in {"0", "false", "no", "off"}:
        return False
    return None


def get_repository() -> MongoRepository:
    return MongoRepository()


def current_user_document(request):
    if not request.user or not getattr(request.user, "is_authenticated", False):
        return None
    return get_repository().get_user_by_id(request.user.id)


def set_session_cookie(response: Response, session_id: str) -> None:
    response.set_cookie(
        settings.SESSION_COOKIE_NAME,
        session_id,
        max_age=settings.SESSION_COOKIE_AGE,
        httponly=settings.SESSION_COOKIE_HTTPONLY,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        secure=settings.SESSION_COOKIE_SECURE,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        settings.SESSION_COOKIE_NAME,
        path="/",
        samesite=settings.SESSION_COOKIE_SAMESITE,
    )


def paginate(request, items: list[dict]):
    paginator = StandardResultsSetPagination()
    return paginator.paginate(request, items)


def category_map_for(api_docs: list[dict], repository: MongoRepository):
    category_ids = [int(api_doc["category_id"]) for api_doc in api_docs if api_doc.get("category_id") is not None]
    return repository.get_categories_by_ids(category_ids)


def enrich_api_list(api_docs: list[dict], repository: MongoRepository) -> list[dict]:
    categories = category_map_for(api_docs, repository)
    pricing_map = repository.pricing_min_map([int(api_doc["_id"]) for api_doc in api_docs])
    return [
        serialize_api_list(
            api_doc,
            category=categories.get(int(api_doc["category_id"])) if api_doc.get("category_id") is not None else None,
            pricing_from=pricing_map.get(int(api_doc["_id"])),
        )
        for api_doc in api_docs
    ]


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ping_database()
        return Response({"status": "ok", "timestamp": timezone.now()})


@method_decorator(ensure_csrf_cookie, name="dispatch")
class SessionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(build_session_payload(current_user_document(request)))


class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        repository = get_repository()
        categories = repository.list_categories(
            search=request.query_params.get("search"),
            ordering=request.query_params.get("ordering"),
        )
        payload = [serialize_category(category) for category in categories]
        return Response(paginate(request, payload))


class CategoryDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        repository = get_repository()
        category = repository.get_category_by_slug(slug)
        if not category:
            raise NotFound("دسته‌بندی پیدا نشد.")
        return Response(serialize_category(category))


class CategoryApisView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        repository = get_repository()
        category = repository.get_category_by_slug(slug)
        if not category:
            raise NotFound("دسته‌بندی پیدا نشد.")

        api_docs = repository.list_apis(
            category_slug=slug,
            search=request.query_params.get("search"),
            ordering=request.query_params.get("ordering"),
            include_inactive=False,
        )
        return Response(paginate(request, enrich_api_list(api_docs, repository)))


class APIListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        repository = get_repository()
        include_inactive = bool(
            request.user
            and getattr(request.user, "is_authenticated", False)
            and getattr(request.user, "is_staff", False)
            and parse_bool(request.query_params.get("include_inactive")) is True
        )
        api_docs = repository.list_apis(
            category_slug=request.query_params.get("category"),
            featured=parse_bool(request.query_params.get("featured")),
            popular=parse_bool(request.query_params.get("popular")),
            tag=request.query_params.get("tag"),
            search=request.query_params.get("search"),
            ordering=request.query_params.get("ordering"),
            include_inactive=include_inactive,
        )
        return Response(paginate(request, enrich_api_list(api_docs, repository)))


class APIDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        repository = get_repository()
        include_inactive = bool(
            request.user and getattr(request.user, "is_authenticated", False) and getattr(request.user, "is_staff", False)
        )
        api_doc = repository.get_api_by_slug(slug, include_inactive=include_inactive)
        if not api_doc:
            raise NotFound("API پیدا نشد.")

        api_doc = repository.increment_api_views(int(api_doc["_id"])) or api_doc
        category = None
        if api_doc.get("category_id") is not None:
            category = repository.get_categories_by_ids([int(api_doc["category_id"])]).get(int(api_doc["category_id"]))
        pricing_plans = repository.get_pricing_plans_by_api_ids([int(api_doc["_id"])]).get(int(api_doc["_id"]), [])
        documentations = repository.get_documentations_by_api_ids([int(api_doc["_id"])]).get(int(api_doc["_id"]), [])
        return Response(
            serialize_api_detail(
                api_doc,
                category=category,
                pricing_plans=pricing_plans,
                documentations=documentations,
            )
        )


class APISimilarView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        repository = get_repository()
        _, api_docs = repository.list_similar_apis(slug)
        return Response(enrich_api_list(api_docs, repository))


class APIRatingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug: str):
        repository = get_repository()
        serializer = RatingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        api_doc = repository.get_api_by_slug(slug)
        if not api_doc:
            raise NotFound("API پیدا نشد.")

        rating_doc, created = repository.rate_api(
            user_id=request.user.id,
            api_id=int(api_doc["_id"]),
            value=serializer.validated_data["rating"],
        )
        refreshed = repository.get_api_by_slug(slug, include_inactive=True) or api_doc
        return Response(
            {
                "message": "امتیاز شما با موفقیت ثبت شد.",
                "created": created,
                "rating": f"{float(refreshed.get('rating', 0)):.2f}",
                "rating_count": int(refreshed.get("rating_count", 0)),
                "your_rating": int(rating_doc.get("value", serializer.validated_data["rating"])),
            }
        )


class PricingPlanListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        repository = get_repository()
        plans = repository.list_pricing_plans(api_slug=request.query_params.get("api"))
        return Response(paginate(request, [serialize_pricing_plan(plan) for plan in plans]))


class APIPlanListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        repository = get_repository()
        plans = repository.list_pricing_plans(api_slug=slug)
        return Response(paginate(request, [serialize_pricing_plan(plan) for plan in plans]))


class DocumentationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        repository = get_repository()
        documentations = repository.list_documentations(api_slug=request.query_params.get("api"))
        return Response(paginate(request, [serialize_documentation(document) for document in documentations]))


class APIDocumentationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        repository = get_repository()
        documentations = repository.list_documentations(api_slug=slug)
        return Response(paginate(request, [serialize_documentation(document) for document in documentations]))


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        repository = get_repository()
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            repository.validate_unique_user_fields(
                username=serializer.validated_data["username"],
                email=serializer.validated_data.get("email", ""),
            )
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        user_doc = repository.create_user(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
            email=serializer.validated_data.get("email", ""),
            first_name=serializer.validated_data.get("first_name", ""),
            last_name=serializer.validated_data.get("last_name", ""),
        )
        token = repository.create_or_get_legacy_token(int(user_doc["_id"]))
        session_id = repository.create_session(int(user_doc["_id"]))
        response = Response(
            {
                "message": "ثبت‌نام با موفقیت انجام شد.",
                "token": token,
                "user": serialize_user(user_doc),
                "profile": serialize_profile(user_doc),
            },
            status=status.HTTP_201_CREATED,
        )
        set_session_cookie(response, session_id)
        return response


class SessionRegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        repository = get_repository()
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            repository.validate_unique_user_fields(
                username=serializer.validated_data["username"],
                email=serializer.validated_data.get("email", ""),
            )
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        user_doc = repository.create_user(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
            email=serializer.validated_data.get("email", ""),
            first_name=serializer.validated_data.get("first_name", ""),
            last_name=serializer.validated_data.get("last_name", ""),
        )
        session_id = repository.create_session(int(user_doc["_id"]))
        response = Response(
            {
                "message": "Registration completed successfully.",
                **build_session_payload(user_doc),
            },
            status=status.HTTP_201_CREATED,
        )
        set_session_cookie(response, session_id)
        return response


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        repository = get_repository()
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_doc = repository.authenticate_user(
            serializer.validated_data["username"],
            serializer.validated_data["password"],
        )
        if not user_doc:
            raise ValidationError("نام کاربری یا رمز عبور اشتباه است.")

        token = repository.create_or_get_legacy_token(int(user_doc["_id"]))
        session_id = repository.create_session(int(user_doc["_id"]))
        response = Response(
            {
                "message": "ورود با موفقیت انجام شد.",
                "token": token,
                "user": serialize_user(user_doc),
                "profile": serialize_profile(user_doc),
            }
        )
        set_session_cookie(response, session_id)
        return response


class SessionLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        repository = get_repository()
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_doc = repository.authenticate_user(
            serializer.validated_data["username"],
            serializer.validated_data["password"],
        )
        if not user_doc:
            raise ValidationError("نام کاربری یا رمز عبور اشتباه است.")

        session_id = repository.create_session(int(user_doc["_id"]))
        response = Response(
            {
                "message": "Signed in successfully.",
                **build_session_payload(user_doc),
            }
        )
        set_session_cookie(response, session_id)
        return response


def serialize_social_provider(slug: str, provider: dict[str, object]) -> dict[str, object]:
    return {
        "slug": slug,
        "label": str(provider.get("label") or slug.title()),
        "enabled": bool(provider.get("enabled") and provider.get("auth_url")),
        "start_url": f"/api/v1/auth/social/{slug}/start/",
    }


class SocialAuthProviderListView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        providers = [
            serialize_social_provider(slug, provider)
            for slug, provider in settings.SOCIAL_AUTH_PROVIDERS.items()
        ]
        return Response({"providers": providers})


class SocialAuthStartView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, provider: str):
        social_provider = settings.SOCIAL_AUTH_PROVIDERS.get(provider)
        if not social_provider:
            raise NotFound("Social login provider was not found.")

        auth_url = str(social_provider.get("auth_url") or "")
        if not social_provider.get("enabled") or not auth_url:
            return Response(
                {
                    "detail": (
                        "This social login provider is not configured yet. "
                        "Set the provider OAuth URL in environment settings first."
                    ),
                    "provider": serialize_social_provider(provider, social_provider),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return redirect(auth_url)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        repository = get_repository()
        repository.delete_legacy_tokens_for_user(request.user.id)
        repository.delete_session(request.COOKIES.get(settings.SESSION_COOKIE_NAME, ""))
        response = Response({"message": "با موفقیت خارج شدید."})
        clear_session_cookie(response)
        return response


class SessionLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        repository = get_repository()
        repository.delete_session(request.COOKIES.get(settings.SESSION_COOKIE_NAME, ""))
        response = Response({"message": "Signed out successfully.", "authenticated": False})
        clear_session_cookie(response)
        return response


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_doc = current_user_document(request)
        if not user_doc:
            raise NotFound("کاربر پیدا نشد.")
        return Response(serialize_user(user_doc))

    def patch(self, request):
        repository = get_repository()
        serializer = UserUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            user_doc = repository.update_user(request.user.id, serializer.validated_data)
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        return Response(
            {
                "message": "اطلاعات کاربری به‌روزرسانی شد.",
                "user": serialize_user(user_doc),
            }
        )


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_doc = current_user_document(request)
        if not user_doc:
            raise NotFound("کاربر پیدا نشد.")
        return Response(serialize_profile(user_doc))

    def patch(self, request):
        repository = get_repository()
        serializer = UserProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user_doc = repository.update_profile(request.user.id, serializer.validated_data)
        return Response(
            {
                "message": "پروفایل به‌روزرسانی شد.",
                "profile": serialize_profile(user_doc),
            }
        )


class GenerateApiKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not settings.ENABLE_LEGACY_API_KEYS:
            raise PermissionDenied(
                "Legacy API keys are disabled. Use the IranAPI access workflow for managed API credentials."
            )

        repository = get_repository()
        user_doc = repository.rotate_api_key(request.user.id)
        return Response(
            {
                "message": "کلید API جدید ساخته شد.",
                "api_key": user_doc.get("profile", {}).get("api_key"),
                "profile": serialize_profile(user_doc),
            }
        )


class AccessGrantListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        repository = get_repository()
        grants = repository.list_access_grants(request.user.id)
        api_map = repository.get_apis_by_ids([int(grant["api_id"]) for grant in grants if grant.get("api_id") is not None])
        category_map = repository.get_categories_by_ids(
            [int(api_doc["category_id"]) for api_doc in api_map.values() if api_doc.get("category_id") is not None]
        )
        plan_map = repository.get_pricing_plans_by_ids(
            [int(grant["pricing_plan_id"]) for grant in grants if grant.get("pricing_plan_id") is not None]
        )
        pricing_map = repository.pricing_min_map(list(api_map.keys()))

        payload = [
            serialize_access_grant(
                grant,
                api_doc=api_map.get(int(grant["api_id"])) if grant.get("api_id") is not None else None,
                pricing_plan=plan_map.get(int(grant["pricing_plan_id"]))
                if grant.get("pricing_plan_id") is not None
                else None,
                category=category_map.get(int(api_map[int(grant["api_id"])]["category_id"]))
                if grant.get("api_id") is not None
                and api_map.get(int(grant["api_id"]))
                and api_map[int(grant["api_id"])].get("category_id") is not None
                else None,
                pricing_from=pricing_map.get(int(grant["api_id"])) if grant.get("api_id") is not None else None,
            )
            for grant in grants
        ]
        return Response(paginate(request, payload))


class UsageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        repository = get_repository()
        usage_items = repository.list_usage(request.user.id)
        api_map = repository.get_apis_by_ids([int(item["api_id"]) for item in usage_items if item.get("api_id") is not None])
        category_map = repository.get_categories_by_ids(
            [int(api_doc["category_id"]) for api_doc in api_map.values() if api_doc.get("category_id") is not None]
        )
        grant_map = repository.get_access_grants_by_ids(
            [int(item["access_grant_id"]) for item in usage_items if item.get("access_grant_id") is not None]
        )
        plan_map = repository.get_pricing_plans_by_ids(
            [int(grant["pricing_plan_id"]) for grant in grant_map.values() if grant.get("pricing_plan_id") is not None]
        )
        pricing_map = repository.pricing_min_map(list(api_map.keys()))

        payload = [
            serialize_usage_item(
                usage,
                api_doc=api_map.get(int(usage["api_id"])) if usage.get("api_id") is not None else None,
                access_grant=grant_map.get(int(usage["access_grant_id"]))
                if usage.get("access_grant_id") is not None
                else None,
                pricing_plan=plan_map.get(int(grant_map[int(usage["access_grant_id"])]["pricing_plan_id"]))
                if usage.get("access_grant_id") is not None
                and grant_map.get(int(usage["access_grant_id"]))
                and grant_map[int(usage["access_grant_id"])].get("pricing_plan_id") is not None
                else None,
                category=category_map.get(int(api_map[int(usage["api_id"])]["category_id"]))
                if usage.get("api_id") is not None
                and api_map.get(int(usage["api_id"]))
                and api_map[int(usage["api_id"])].get("category_id") is not None
                else None,
                pricing_from=pricing_map.get(int(usage["api_id"])) if usage.get("api_id") is not None else None,
            )
            for usage in usage_items
        ]
        return Response(paginate(request, payload))


class UsageStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        repository = get_repository()
        return Response(repository.usage_stats(request.user.id))


class OpenAPISchemaView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(build_openapi_schema())
