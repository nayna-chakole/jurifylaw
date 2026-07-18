"""
Migration 001: Initial Schema
Creates all initial database tables
"""

import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

MIGRATION_VERSION = "001"
MIGRATION_NAME = "initial_schema"

UP_QUERY = """
-- Already handled by SQLAlchemy ORM, but for reference:
-- See database/schema.sql for the complete DDL

INSERT INTO migration_history (version, name, applied_at)
VALUES ('001', 'initial_schema', NOW())
ON CONFLICT (version) DO NOTHING;
"""

DOWN_QUERY = """
DROP TABLE IF EXISTS embeddings_metadata CASCADE;
DROP TABLE IF EXISTS legal_documents CASCADE;
DROP TABLE IF EXISTS uploaded_documents CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DELETE FROM migration_history WHERE version = '001';
"""


async def up(db: AsyncSession):
    """Apply the migration."""
    logger.info(f"Applying migration {MIGRATION_VERSION}: {MIGRATION_NAME}")
    await db.execute(text(UP_QUERY))
    await db.commit()
    logger.info(f"Migration {MIGRATION_VERSION} applied successfully")


async def down(db: AsyncSession):
    """Rollback the migration."""
    logger.info(f"Rolling back migration {MIGRATION_VERSION}: {MIGRATION_NAME}")
    await db.execute(text(DOWN_QUERY))
    await db.commit()
    logger.info(f"Migration {MIGRATION_VERSION} rolled back successfully")
