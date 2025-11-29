"""
Telegram bot webhook and API endpoints
"""

from fastapi import APIRouter, Request, HTTPException, Depends, Header
from telegram import Update
from loguru import logger

from app.config import settings
from app.services.telegram_bot import telegram_service
from app.services.auth_service import auth_service
from app.database import get_db_pool

router = APIRouter()


@router.post("/webhook")
async def telegram_webhook(request: Request):
    """
    Telegram webhook endpoint
    Receives updates from Telegram servers
    """
    try:
        data = await request.json()
        update = Update.de_json(data, telegram_service.bot)
        
        # Process update in background
        await telegram_service.process_update(update)
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing Telegram webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/set-webhook")
async def set_webhook():
    """
    Set Telegram webhook URL
    Should be called once during deployment
    """
    try:
        webhook_url = settings.TELEGRAM_WEBHOOK_URL
        if not webhook_url:
            raise ValueError("TELEGRAM_WEBHOOK_URL not configured")
        
        success = await telegram_service.set_webhook(webhook_url)
        
        if success:
            return {"status": "success", "webhook_url": webhook_url}
        else:
            raise HTTPException(status_code=500, detail="Failed to set webhook")
    except Exception as e:
        logger.error(f"Error setting webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remove-webhook")
async def remove_webhook():
    """
    Remove Telegram webhook
    Useful for development/debugging
    """
    try:
        success = await telegram_service.remove_webhook()
        return {"status": "success" if success else "failed"}
    except Exception as e:
        logger.error(f"Error removing webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bot-info")
async def get_bot_info():
    """Get Telegram bot information"""
    try:
        info = await telegram_service.get_bot_info()
        if not info:
            raise HTTPException(status_code=500, detail="Bot not initialized")
        return info
    except Exception as e:
        logger.error(f"Error getting bot info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-auth-code")
async def generate_auth_code(
    user_id: str,
    x_api_key: str = Header(...),
    db = Depends(get_db_pool)
):
    """
    Generate authentication code for user
    Called from Next.js app
    """
    # Verify API key (basic security)
    if x_api_key != settings.API_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        code = await auth_service.generate_auth_code(user_id, db)
        return {
            "code": code,
            "expires_in_minutes": settings.AUTH_CODE_EXPIRY_MINUTES
        }
    except Exception as e:
        logger.error(f"Error generating auth code: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connection-status/{user_id}")
async def get_connection_status(
    user_id: str,
    x_api_key: str = Header(...),
    db = Depends(get_db_pool)
):
    """
    Get Telegram connection status for user
    Called from Next.js app
    """
    if x_api_key != settings.API_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        status = await auth_service.get_connection_status(user_id, db)
        return status
    except Exception as e:
        logger.error(f"Error getting connection status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/disconnect/{user_id}")
async def disconnect_telegram(
    user_id: str,
    x_api_key: str = Header(...),
    db = Depends(get_db_pool)
):
    """
    Disconnect Telegram account for user
    Called from Next.js app
    """
    if x_api_key != settings.API_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        success = await auth_service.disconnect_user(user_id, db)
        return {"success": success}
    except Exception as e:
        logger.error(f"Error disconnecting Telegram: {e}")
        raise HTTPException(status_code=500, detail=str(e))
