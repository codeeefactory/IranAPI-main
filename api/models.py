"""
MongoDB-backed IranAPI no longer uses Django ORM models in active code paths.

Persistence is implemented through explicit repositories in `api.repositories`.
This module remains only as a compatibility marker for legacy imports.
"""
