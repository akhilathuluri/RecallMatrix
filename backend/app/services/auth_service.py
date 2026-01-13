"""
Authentication Service
Handles auth code generation and verification for Telegram bot
"""

import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from loguru import logger  # type: ignore
import asyncpg  # type: ignore

from app.config import settings


class AuthService:
    """Service for managing Telegram bot authentication"""
    
    async def generate_auth_code(self, user_id: str, db: asyncpg.Pool) -> str:
        """
        Generate a random authentication code for user
        Returns the code that should be shown to user
        """
        # Generate random code
        code = ''.join(
            secrets.choice(string.ascii_uppercase + string.digits)
            for _ in range(settings.AUTH_CODE_LENGTH)
        )
        
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.AUTH_CODE_EXPIRY_MINUTES
        )
        
        async with db.acquire() as conn:
            # Invalidate any existing codes for this user
            await conn.execute(
                """
                UPDATE telegram_auth_codes
                SET is_used = true
                WHERE user_id = $1 AND is_used = false
                """,
                user_id
            )
            
            # Insert new code
            await conn.execute(
                """
                INSERT INTO telegram_auth_codes (user_id, code, expires_at)
                VALUES ($1, $2, $3)
                """,
                user_id, code, expires_at
            )
        
        logger.info(f"Generated auth code for user {user_id}")
        return code
    
    async def verify_and_connect(
        self,
        auth_code: str,
        telegram_user_id: str,
        telegram_username: Optional[str],
        telegram_first_name: Optional[str],
        telegram_last_name: Optional[str],
        db: asyncpg.Pool
    ) -> Dict[str, Any]:
        """
        Verify auth code and connect Telegram account to MemoryVault account
        Returns success status and error message if failed
        """
        async with db.acquire() as conn:
            # Find valid auth code
            row = await conn.fetchrow(
                """
                SELECT user_id, expires_at, is_used
                FROM telegram_auth_codes
                WHERE code = $1
                ORDER BY created_at DESC
                LIMIT 1
                """,
                auth_code
            )
            
            if not row:
                return {"success": False, "error": "Invalid code"}
            
            if row["is_used"]:
                return {"success": False, "error": "Code already used"}
            
            current_time = datetime.now(timezone.utc)
            expires_at = row["expires_at"]
            
            logger.debug(f"Current time: {current_time}")
            logger.debug(f"Expires at: {expires_at}")
            logger.debug(f"Expired: {current_time > expires_at}")
            
            if current_time > expires_at:
                return {"success": False, "error": "Code expired"}
            
            user_id = row["user_id"]
            
            # Check if telegram account already connected to another user
            existing = await conn.fetchrow(
                """
                SELECT user_id FROM telegram_connections
                WHERE telegram_user_id = $1 AND is_active = true
                """,
                telegram_user_id
            )
            
            if existing and existing["user_id"] != user_id:
                return {
                    "success": False,
                    "error": "Telegram account already connected to another MemoryVault account"
                }
            
            # Create or update connection
            await conn.execute(
                """
                INSERT INTO telegram_connections (
                    user_id, telegram_user_id, telegram_username,
                    telegram_first_name, telegram_last_name, is_active
                )
                VALUES ($1, $2, $3, $4, $5, true)
                ON CONFLICT (telegram_user_id)
                DO UPDATE SET
                    user_id = $1,
                    telegram_username = $3,
                    telegram_first_name = $4,
                    telegram_last_name = $5,
                    is_active = true,
                    connected_at = NOW()
                """,
                user_id, telegram_user_id, telegram_username,
                telegram_first_name, telegram_last_name
            )
            
            # Mark code as used
            await conn.execute(
                """
                UPDATE telegram_auth_codes
                SET is_used = true
                WHERE code = $1
                """,
                auth_code
            )
        
        logger.info(f"Connected Telegram user {telegram_user_id} to MemoryVault user {user_id}")
        return {"success": True, "user_id": user_id}
    
    async def is_user_connected(self, telegram_user_id: str, db: asyncpg.Pool) -> bool:
        """Check if Telegram user is connected"""
        async with db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT user_id FROM telegram_connections
                WHERE telegram_user_id = $1 AND is_active = true
                """,
                telegram_user_id
            )
            return row is not None
    
    async def get_connection_status(
        self, user_id: str, db: asyncpg.Pool
    ) -> Dict[str, Any]:
        """Get connection status for MemoryVault user"""
        async with db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT
                    telegram_user_id,
                    telegram_username,
                    telegram_first_name,
                    telegram_last_name,
                    connected_at,
                    is_active
                FROM telegram_connections
                WHERE user_id = $1 AND is_active = true
                """,
                user_id
            )
            
            if not row:
                return {"connected": False}
            
            return {
                "connected": True,
                "telegram_user_id": row["telegram_user_id"],
                "telegram_username": row["telegram_username"],
                "telegram_name": f"{row['telegram_first_name'] or ''} {row['telegram_last_name'] or ''}".strip(),
                "connected_at": row["connected_at"].isoformat()
            }
    
    async def get_connection_status_by_telegram(
        self, telegram_user_id: str, db: asyncpg.Pool
    ) -> Dict[str, Any]:
        """Get connection status by Telegram user ID"""
        async with db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT user_id, connected_at, is_active
                FROM telegram_connections
                WHERE telegram_user_id = $1 AND is_active = true
                """,
                telegram_user_id
            )
            
            if not row:
                return {"connected": False}
            
            return {
                "connected": True,
                "user_id": row["user_id"],
                "connected_at": row["connected_at"].isoformat()
            }
    
    async def disconnect_user(self, user_id: str, db: asyncpg.Pool) -> bool:
        """Disconnect Telegram account for user"""
        async with db.acquire() as conn:
            await conn.execute(
                """
                UPDATE telegram_connections
                SET is_active = false
                WHERE user_id = $1
                """,
                user_id
            )
        
        logger.info(f"Disconnected Telegram for user {user_id}")
        return True


# Global service instance
auth_service = AuthService()
