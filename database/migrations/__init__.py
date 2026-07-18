"""
Database Migrations Runner
"""

import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

MIGRATION_TABLE = "migration_history"

# Registry of migrations: version -> {"name": str, "up": callable, "down": callable}
MIGRATIONS: dict = {}


def register_migration(version: str, name: str, up_fn, down_fn=None):
    """Register a migration."""
    MIGRATIONS[version] = {
        "name": name,
        "up": up_fn,
        "down": down_fn,
    }


async def ensure_migration_table(db: AsyncSession):
    """Ensure the migration history table exists."""
    query = f"""
    CREATE TABLE IF NOT EXISTS {MIGRATION_TABLE} (
        version VARCHAR(10) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        duration INTEGER DEFAULT 0
    );
    """
    await db.execute(text(query))
    await db.commit()


async def get_applied_migrations(db: AsyncSession) -> list:
    """Get list of already applied migrations."""
    result = await db.execute(
        text(f"SELECT version FROM {MIGRATION_TABLE} ORDER BY version")
    )
    return [row[0] for row in result.fetchall()]


async def run_migrations(db: AsyncSession, target_version: str = None):
    """Run all pending migrations up to target_version."""
    from database.migrations import MIGRATIONS as mig_registry

    await ensure_migration_table(db)
    applied = await get_applied_migrations(db)

    for version in sorted(mig_registry.keys()):
        if version in applied:
            logger.info(f"Migration {version} already applied, skipping")
            continue

        if target_version and version > target_version:
            break

        migration = mig_registry[version]
        logger.info(f"Running migration {version}: {migration['name']}")
        await migration["up"](db)
        applied.append(version)
