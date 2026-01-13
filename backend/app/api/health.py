"""
Health check endpoints
"""

from fastapi import APIRouter, Depends  # type: ignore
from loguru import logger

from app.database import get_db_pool
from app.services.telegram_bot import telegram_service

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "telegram-bot-backend"
    }


@router.get("/detailed")
async def detailed_health_check(db = Depends(get_db_pool)):
    """Detailed health check with service status"""
    checks = {
        "api": "healthy",
        "database": "unknown",
        "telegram_bot": "unknown"
    }
    
    # Check database
    try:
        async with db.acquire() as conn:
            await conn.fetchval("SELECT 1")
        checks["database"] = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        checks["database"] = "unhealthy"
    
    # Check Telegram bot
    try:
        bot_info = await telegram_service.get_bot_info()
        checks["telegram_bot"] = "healthy" if bot_info else "unhealthy"
    except Exception as e:
        logger.error(f"Telegram bot health check failed: {e}")
        checks["telegram_bot"] = "unhealthy"
    
    overall_status = "healthy" if all(v == "healthy" for v in checks.values()) else "degraded"
    
    return {
        "status": overall_status,
        "checks": checks
    }
