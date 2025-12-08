"""
Storage Service
Handles file downloads from Telegram and uploads to Supabase Storage
"""

import os
import io
from typing import Dict, Any, Optional
from loguru import logger
import httpx
from supabase import create_client, Client
from app.config import settings


class StorageService:
    """Service for managing file storage"""
    
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.bucket_name = "telegram-files"
        
        # Initialize Supabase client
        self.supabase: Client = create_client(
            self.supabase_url,
            self.supabase_key
        )
    
    async def download_telegram_file(
        self,
        file_path: str
    ) -> Optional[bytes]:
        """
        Download file from Telegram servers
        
        Args:
            file_path: Telegram file path from file.file_path (can be relative path or full URL)
            
        Returns:
            File bytes or None if download fails
        """
        try:
            # Check if file_path is already a full URL or just a relative path
            if file_path.startswith("http"):
                file_url = file_path
            else:
                file_url = f"https://api.telegram.org/file/bot{self.bot_token}/{file_path}"
            
            logger.debug(f"Downloading file from Telegram: {file_url}")
            
            # Download file
            async with httpx.AsyncClient() as client:
                response = await client.get(file_url, timeout=30.0)
                response.raise_for_status()
                
                file_bytes = response.content
                logger.info(f"Downloaded {len(file_bytes)} bytes from Telegram")
                return file_bytes
                
        except Exception as e:
            logger.error(f"Error downloading file from Telegram: {e}")
            return None
    
    def upload_to_supabase(
        self,
        file_bytes: bytes,
        user_id: str,
        file_name: str,
        content_type: str
    ) -> Optional[str]:
        """
        Upload file to Supabase Storage
        
        Args:
            file_bytes: File content as bytes
            user_id: User ID for organizing files
            file_name: Original file name
            content_type: MIME type of file
            
        Returns:
            Public URL of uploaded file or None if upload fails
        """
        try:
            # Generate unique file path: user_id/timestamp_filename
            import time
            timestamp = int(time.time())
            storage_path = f"{user_id}/{timestamp}_{file_name}"
            
            logger.debug(f"Uploading to Supabase Storage: {storage_path}")
            
            # Upload to Supabase Storage
            response = self.supabase.storage.from_(self.bucket_name).upload(
                path=storage_path,
                file=file_bytes,
                file_options={"content-type": content_type}
            )
            
            # Get public URL
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(storage_path)
            
            logger.info(f"File uploaded successfully: {public_url}")
            return public_url
            
        except Exception as e:
            logger.error(f"Error uploading file to Supabase: {e}")
            return None
    
    async def process_telegram_file(
        self,
        file_path: str,
        user_id: str,
        file_name: str,
        content_type: str
    ) -> Dict[str, Any]:
        """
        Complete flow: Download from Telegram and upload to Supabase
        
        Args:
            file_path: Telegram file path
            user_id: User ID
            file_name: Original file name
            content_type: MIME type
            
        Returns:
            Dict with success status and public_url or error
        """
        try:
            # Download from Telegram
            file_bytes = await self.download_telegram_file(file_path)
            
            if not file_bytes:
                return {
                    "success": False,
                    "error": "Failed to download file from Telegram"
                }
            
            # Upload to Supabase
            public_url = self.upload_to_supabase(
                file_bytes, user_id, file_name, content_type
            )
            
            if not public_url:
                return {
                    "success": False,
                    "error": "Failed to upload file to storage"
                }
            
            return {
                "success": True,
                "public_url": public_url,
                "file_size": len(file_bytes)
            }
            
        except Exception as e:
            logger.error(f"Error processing Telegram file: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Singleton instance
storage_service = StorageService()
