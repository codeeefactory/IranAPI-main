from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .repositories import MongoUser, format_decimal


def mask_secret(value: str | None, *, visible_prefix: int = 6, visible_suffix: int = 4) -> str | None:
    if not value:
        return None
    if len(value) <= visible_prefix + visible_suffix:
        return "•" * len(value)
    return f"{value[:visible_prefix]}{'•' * 8}{value[-visible_suffix:]}"


def serialize_category_summary(category: dict[str, Any] | None) -> dict[str, Any] | None:
    if not category:
        return None

    return {
        "id": int(category["_id"]),
        "name": category.get("name", ""),
        "name_en": category.get("name_en", ""),
        "slug": category.get("slug", ""),
        "icon": category.get("icon", ""),
        "color": category.get("color", "#2563eb"),
    }


def serialize_category(category: dict[str, Any]) -> dict[str, Any]:
    return {
        **serialize_category_summary(category),
        "description": category.get("description", ""),
        "apis_count": int(category.get("active_apis_count", 0)),
        "created_at": category.get("created_at"),
        "updated_at": category.get("updated_at"),
    }


def serialize_rapidapi(api_doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "canonical_version": api_doc.get("canonical_version", "v1"),
        "listing_url": api_doc.get("rapidapi_listing_url", ""),
        "package_slug": api_doc.get("rapidapi_package_slug", ""),
        "public_auth_scheme": api_doc.get("public_auth_scheme", "api_key"),
        "support_url": api_doc.get("support_url", ""),
        "publication_status": api_doc.get("publication_status", "draft"),
    }


def serialize_pricing_plan(plan: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": int(plan["_id"]),
        "api_slug": plan.get("api_slug", ""),
        "api_rapidapi_listing_url": plan.get("api_rapidapi_listing_url", ""),
        "name": plan.get("name", ""),
        "plan_type": plan.get("plan_type", "basic"),
        "price": format_decimal(plan.get("price", 0)),
        "currency": plan.get("currency", "IRR"),
        "requests_per_month": plan.get("requests_per_month"),
        "requests_per_day": plan.get("requests_per_day"),
        "features": plan.get("features", []),
        "is_popular": bool(plan.get("is_popular", False)),
        "is_active": bool(plan.get("is_active", True)),
        "rapidapi_plan_slug": plan.get("rapidapi_plan_slug", ""),
        "is_listed_on_rapidapi": bool(plan.get("is_listed_on_rapidapi", False)),
        "created_at": plan.get("created_at"),
        "updated_at": plan.get("updated_at"),
    }


def serialize_documentation(document: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": int(document["_id"]),
        "api_slug": document.get("api_slug", ""),
        "title": document.get("title", ""),
        "slug": document.get("slug", ""),
        "content": document.get("content", ""),
        "order": int(document.get("order", 0)),
        "is_active": bool(document.get("is_active", True)),
        "created_at": document.get("created_at"),
        "updated_at": document.get("updated_at"),
    }


def serialize_api_list(
    api_doc: dict[str, Any],
    *,
    category: dict[str, Any] | None,
    pricing_from: str | None,
) -> dict[str, Any]:
    return {
        "id": int(api_doc["_id"]),
        "name": api_doc.get("name", ""),
        "name_en": api_doc.get("name_en", ""),
        "slug": api_doc.get("slug", ""),
        "short_description": api_doc.get("short_description", ""),
        "category": serialize_category_summary(category),
        "logo": api_doc.get("logo", ""),
        "status": api_doc.get("status", "active"),
        "is_featured": bool(api_doc.get("is_featured", False)),
        "is_popular": bool(api_doc.get("is_popular", False)),
        "rating": format_decimal(api_doc.get("rating", 0)),
        "rating_count": int(api_doc.get("rating_count", 0)),
        "views_count": int(api_doc.get("views_count", 0)),
        "tags": api_doc.get("tags", []),
        "pricing_from": pricing_from,
        "rapidapi": serialize_rapidapi(api_doc),
        "created_at": api_doc.get("created_at"),
        "updated_at": api_doc.get("updated_at"),
    }


def serialize_api_detail(
    api_doc: dict[str, Any],
    *,
    category: dict[str, Any] | None,
    pricing_plans: list[dict[str, Any]],
    documentations: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        **serialize_api_list(
            api_doc,
            category=category,
            pricing_from=format_decimal(min((plan.get("price", 0) for plan in pricing_plans), default=0))
            if pricing_plans
            else None,
        ),
        "description": api_doc.get("description", ""),
        "base_url": api_doc.get("base_url", ""),
        "documentation_url": api_doc.get("documentation_url", ""),
        "banner": api_doc.get("banner", ""),
        "pricing_plans": [serialize_pricing_plan(plan) for plan in pricing_plans],
        "documentations": [serialize_documentation(document) for document in documentations],
        "created_by_username": api_doc.get("created_by_username"),
    }


def serialize_user(user: dict[str, Any] | MongoUser | None) -> dict[str, Any] | None:
    if not user:
        return None

    if isinstance(user, MongoUser):
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "date_joined": user.date_joined,
        }

    return {
        "id": int(user["_id"]),
        "username": user.get("username", ""),
        "email": user.get("email", ""),
        "first_name": user.get("first_name", ""),
        "last_name": user.get("last_name", ""),
        "date_joined": user.get("date_joined"),
    }


def serialize_profile(user_doc: dict[str, Any] | MongoUser | None) -> dict[str, Any] | None:
    if not user_doc or isinstance(user_doc, MongoUser):
        return None

    profile = user_doc.get("profile", {})
    return {
        "id": int(user_doc["_id"]),
        "user": serialize_user(user_doc),
        "phone": profile.get("phone", ""),
        "company": profile.get("company", ""),
        "bio": profile.get("bio", ""),
        "avatar": profile.get("avatar"),
        "api_key": mask_secret(profile.get("api_key")),
        "api_key_preview": mask_secret(profile.get("api_key")),
        "has_api_key": bool(profile.get("api_key")),
        "created_at": profile.get("created_at"),
        "updated_at": profile.get("updated_at"),
    }


def serialize_access_grant(
    grant: dict[str, Any],
    *,
    api_doc: dict[str, Any] | None,
    pricing_plan: dict[str, Any] | None,
    category: dict[str, Any] | None,
    pricing_from: str | None,
) -> dict[str, Any]:
    return {
        "id": int(grant["_id"]),
        "api": serialize_api_list(api_doc, category=category, pricing_from=pricing_from) if api_doc else None,
        "pricing_plan": serialize_pricing_plan(pricing_plan) if pricing_plan else None,
        "source": grant.get("source", "manual"),
        "status": grant.get("status", "pending"),
        "external_subscription_id": grant.get("external_subscription_id", ""),
        "starts_at": grant.get("starts_at"),
        "ends_at": grant.get("ends_at"),
        "requests_per_day": grant.get("requests_per_day"),
        "requests_per_month": grant.get("requests_per_month"),
        "metadata": grant.get("metadata", {}),
        "created_at": grant.get("created_at"),
        "updated_at": grant.get("updated_at"),
    }


def serialize_usage_item(
    usage: dict[str, Any],
    *,
    api_doc: dict[str, Any] | None,
    access_grant: dict[str, Any] | None,
    pricing_plan: dict[str, Any] | None,
    category: dict[str, Any] | None,
    pricing_from: str | None,
) -> dict[str, Any]:
    serialized_grant = (
        serialize_access_grant(
            access_grant,
            api_doc=api_doc,
            pricing_plan=pricing_plan,
            category=category,
            pricing_from=pricing_from,
        )
        if access_grant
        else None
    )

    return {
        "id": int(usage["_id"]),
        "api": serialize_api_list(api_doc, category=category, pricing_from=pricing_from) if api_doc else None,
        "access_grant": serialized_grant,
        "source": usage.get("source", "manual"),
        "requests_count": int(usage.get("requests_count", 0)),
        "last_used": usage.get("last_used"),
        "window_started_at": usage.get("window_started_at"),
        "window_ended_at": usage.get("window_ended_at"),
        "created_at": usage.get("created_at"),
    }


def build_session_payload(user_doc: dict[str, Any] | None) -> dict[str, Any]:
    if not user_doc:
        return {
            "authenticated": False,
            "user": None,
            "profile": None,
        }

    return {
        "authenticated": True,
        "user": serialize_user(user_doc),
        "profile": serialize_profile(user_doc),
    }


@dataclass(slots=True)
class PasswordCandidate:
    username: str
    email: str
    first_name: str
    last_name: str


class RegistrationSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"})
    password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "رمزهای عبور مطابقت ندارند."})

        candidate = PasswordCandidate(
            username=attrs["username"],
            email=attrs.get("email", ""),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        validate_password(attrs["password"], user=candidate)
        attrs["email"] = attrs.get("email", "").strip()
        attrs["first_name"] = attrs.get("first_name", "").strip()
        attrs["last_name"] = attrs.get("last_name", "").strip()
        attrs["username"] = attrs["username"].strip()
        return attrs


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})


class RatingSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)


class UserUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)


class UserProfileUpdateSerializer(serializers.Serializer):
    phone = serializers.CharField(required=False, allow_blank=True)
    company = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.URLField(required=False, allow_null=True, allow_blank=True)
