"""
Memory Management Service
Handles memory CRUD operations and synchronization with Supabase
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncpg
from loguru import logger

from app.services.embedding_service import embedding_service
from app.services.storage_service import storage_service


class MemoryService:
    """Service for managing memories"""
    
    async def create_memory_from_telegram(
        self,
        user_id: str,
        title: str,
        content: str,
        source: str,
        db: asyncpg.Pool
    ) -> Dict[str, Any]:
        """
        Create a new memory from Telegram
        Automatically generates embedding
        """
        try:
            # Generate embedding
            embedding_text = f"{title} {content}"
            embedding = await embedding_service.generate_embedding(embedding_text)
            
            if not embedding:
                logger.warning(f"Failed to generate embedding for memory: {title}")
            
            # Convert embedding list to PostgreSQL vector format
            embedding_str = None
            if embedding:
                embedding_str = f"[{','.join(map(str, embedding))}]"
            
            # Insert memory into database
            async with db.acquire() as conn:
                # Get next index position for this user
                max_index = await conn.fetchval(
                    "SELECT COALESCE(MAX(index_position), 0) FROM memories WHERE user_id = $1",
                    user_id
                )
                next_index = (max_index or 0) + 1
                
                memory_id = await conn.fetchval(
                    """
                    INSERT INTO memories (
                        user_id, title, content, type, embedding, index_position, source, created_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                    RETURNING id
                    """,
                    user_id, title, content, 'text', embedding_str, next_index, source
                )
            
            logger.info(f"Created memory {memory_id} for user {user_id} from {source}")
            return {
                "success": True,
                "memory_id": memory_id,
                "has_embedding": embedding is not None
            }
            
        except Exception as e:
            logger.error(f"Error creating memory: {e}")
            return {"success": False, "error": str(e)}
    
    async def create_memory_with_file(
        self,
        user_id: str,
        title: str,
        content: str,
        file_path: str,
        file_name: str,
        file_type: str,
        content_type: str,
        source: str,
        db: asyncpg.Pool
    ) -> Dict[str, Any]:
        """
        Create a memory with attached file
        Downloads file from Telegram and uploads to Supabase Storage
        """
        try:
            # Process file: download from Telegram and upload to Supabase
            logger.info(f"Processing file for user {user_id}: {file_name}")
            upload_result = await storage_service.process_telegram_file(
                file_path=file_path,
                user_id=user_id,
                file_name=file_name,
                content_type=content_type
            )
            
            if not upload_result["success"]:
                logger.error(f"File upload failed: {upload_result.get('error')}")
                # Fallback: create memory without file
                return await self.create_memory_from_telegram(
                    user_id, title, f"{content}\n\n⚠️ File upload failed", source, db
                )
            
            public_url = upload_result["public_url"]
            file_size = upload_result["file_size"]
            
            # Generate embedding from text content
            embedding_text = f"{title} {content}"
            embedding = await embedding_service.generate_embedding(embedding_text)
            
            # Convert embedding list to PostgreSQL vector format
            embedding_str = None
            if embedding:
                embedding_str = f"[{','.join(map(str, embedding))}]"
            
            # Insert memory with file reference
            async with db.acquire() as conn:
                # Get next index position for this user
                max_index = await conn.fetchval(
                    "SELECT COALESCE(MAX(index_position), 0) FROM memories WHERE user_id = $1",
                    user_id
                )
                next_index = (max_index or 0) + 1
                
                memory_id = await conn.fetchval(
                    """
                    INSERT INTO memories (
                        user_id, title, content, type, embedding, index_position, source, created_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                    RETURNING id
                    """,
                    user_id, title, content, 'file', embedding_str, next_index, source
                )
                
                # Insert file record
                await conn.execute(
                    """
                    INSERT INTO memory_files (
                        memory_id, file_name, file_path, file_type, file_size
                    )
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    memory_id, file_name, public_url, file_type, file_size
                )
            
            logger.info(f"Created memory with file {memory_id} for user {user_id}")
            return {
                "success": True,
                "memory_id": memory_id,
                "file_url": public_url
            }
            
        except Exception as e:
            logger.error(f"Error creating memory with file: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_recent_memories(
        self,
        user_id: str,
        limit: int,
        db: asyncpg.Pool
    ) -> List[Dict[str, Any]]:
        """Get recent memories for user"""
        async with db.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, title, content, created_at, source
                FROM memories
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT $2
                """,
                user_id, limit
            )
            
            return [dict(row) for row in rows]
    
    async def search_memories(
        self,
        user_id: str,
        query: str,
        limit: int,
        db: asyncpg.Pool
    ) -> List[Dict[str, Any]]:
        """
        Search memories using text search
        If embeddings available, use semantic search
        """
        # Generate query embedding
        query_embedding = await embedding_service.generate_embedding(query)
        
        # Convert embedding to PostgreSQL vector format
        query_embedding_str = None
        if query_embedding:
            query_embedding_str = f"[{','.join(map(str, query_embedding))}]"
        
        async with db.acquire() as conn:
            if query_embedding_str:
                # Semantic search using vector similarity
                rows = await conn.fetch(
                    """
                    SELECT
                        id, title, content, created_at,
                        1 - (embedding <=> $2::vector) as similarity
                    FROM memories
                    WHERE user_id = $1 AND embedding IS NOT NULL
                    ORDER BY embedding <=> $2::vector
                    LIMIT $3
                    """,
                    user_id, query_embedding_str, limit
                )
            else:
                # Fallback to text search
                rows = await conn.fetch(
                    """
                    SELECT id, title, content, created_at
                    FROM memories
                    WHERE user_id = $1
                    AND (
                        title ILIKE $2 OR content ILIKE $2
                    )
                    ORDER BY created_at DESC
                    LIMIT $3
                    """,
                    user_id, f"%{query}%", limit
                )
            
            return [dict(row) for row in rows]
    
    async def get_memory_count(self, user_id: str, db: asyncpg.Pool) -> int:
        """Get total memory count for user"""
        async with db.acquire() as conn:
            count = await conn.fetchval(
                """
                SELECT COUNT(*) FROM memories WHERE user_id = $1
                """,
                user_id
            )
            return count or 0
    
    async def update_memory_embedding(
        self,
        memory_id: str,
        db: asyncpg.Pool
    ) -> bool:
        """
        Regenerate embedding for a specific memory
        Useful for backfilling embeddings
        """
        try:
            async with db.acquire() as conn:
                # Get memory
                row = await conn.fetchrow(
                    """
                    SELECT title, content FROM memories WHERE id = $1
                    """,
                    memory_id
                )
                
                if not row:
                    logger.warning(f"Memory {memory_id} not found")
                    return False
                
                # Generate embedding
                embedding_text = f"{row['title']} {row['content']}"
                embedding = await embedding_service.generate_embedding(embedding_text)
                
                if not embedding:
                    logger.warning(f"Failed to generate embedding for memory {memory_id}")
                    return False
                
                # Update memory
                await conn.execute(
                    """
                    UPDATE memories
                    SET embedding = $1
                    WHERE id = $2
                    """,
                    embedding, memory_id
                )
            
            logger.info(f"Updated embedding for memory {memory_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating memory embedding: {e}")
            return False


# Global service instance
memory_service = MemoryService()
