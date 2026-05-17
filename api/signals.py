"""
Legacy Django model signals were removed during the MongoDB migration.

User profile creation is now handled explicitly inside repository create/update
flows instead of implicit post-save hooks tied to relational models.
"""
