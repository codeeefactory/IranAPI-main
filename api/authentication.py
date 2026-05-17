from __future__ import annotations

from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

from .repositories import MongoRepository


class MongoSessionAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        session_id = request.COOKIES.get(settings.SESSION_COOKIE_NAME)
        if not session_id:
            return None

        repository = MongoRepository()
        user_doc = repository.session_user(session_id)
        if not user_doc:
            return None

        return repository.build_mongo_user(user_doc), None


class MongoTokenAuthentication(authentication.BaseAuthentication):
    keyword = "Token"
    alternate_keywords = {"Bearer"}

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("utf-8")
        if not header:
            return None

        parts = header.split()
        if len(parts) != 2 or parts[0] not in {self.keyword, *self.alternate_keywords}:
            return None

        token = parts[1]
        repository = MongoRepository()
        user_doc = repository.get_user_for_token(token)
        if not user_doc:
            raise AuthenticationFailed("اعتبارنامه نامعتبر است.")

        return repository.build_mongo_user(user_doc), token
