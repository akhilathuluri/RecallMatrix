"""
MemoryVault Telegram Bot Backend
FastAPI server for Telegram bot integration
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from loguru import logger  # type: ignore

from app.config import settings
from app.api import telegram_router, health_router
from app.services.telegram_bot import telegram_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("Starting MemoryVault Telegram Bot Backend...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    
    # Initialize Telegram bot
    try:
        await telegram_service.initialize()
        logger.info("✓ Telegram bot initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Telegram bot: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down MemoryVault Telegram Bot Backend...")
    await telegram_service.shutdown()
    logger.info("✓ Telegram bot shut down successfully")


# Create FastAPI app
app = FastAPI(
    title="MemoryVault Telegram Bot API",
    description="Backend service for MemoryVault Telegram bot integration",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.APP_BASE_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix="/health", tags=["Health"])
app.include_router(telegram_router, prefix="/api/telegram", tags=["Telegram"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "MemoryVault Telegram Bot Backend",
        "version": "1.0.0",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn  # type: ignore
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower(),
    )
