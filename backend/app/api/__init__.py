"""
API routes
"""

from .telegram import router as telegram_router
from .health import router as health_router

__all__ = ["telegram_router", "health_router"]
