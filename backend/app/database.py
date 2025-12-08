"""
Database connection and utilities
"""

import asyncpg
from contextlib import asynccontextmanager
from typing import Optional
from loguru import logger

from app.config import settings


# Global connection pool
_pool: Optional[asyncpg.Pool] = None


async def init_db_pool():
    """Initialize database connection pool"""
    global _pool
    
    try:
        _pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=2,
            max_size=10,
            command_timeout=60,
            statement_cache_size=0,  # Disable prepared statements for Supabase pooler
        )
        logger.info("✓ Database connection pool created")
        return _pool
    except Exception as e:
        logger.error(f"Failed to create database pool: {e}")
        raise


async def close_db_pool():
    """Close database connection pool"""
    global _pool
    
    if _pool:
        await _pool.close()
        logger.info("✓ Database connection pool closed")
        _pool = None


async def get_db_pool() -> asyncpg.Pool:
    """Get database connection pool (dependency injection)"""
    global _pool
    
    if not _pool:
        _pool = await init_db_pool()
    
    return _pool


@asynccontextmanager
async def get_db_connection():
    """Context manager for database connections"""
    pool = await get_db_pool()
    async with pool.acquire() as connection:
        yield connection
