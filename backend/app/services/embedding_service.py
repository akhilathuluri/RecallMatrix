"""
Embedding Generation Service
Generates embeddings for memories using GitHub Models API
"""

import httpx
from typing import List, Optional
from loguru import logger

from app.config import settings


class EmbeddingService:
    """Service for generating text embeddings"""
    
    def __init__(self):
        self.endpoint = settings.GITHUB_MODELS_ENDPOINT
        self.model = settings.EMBEDDING_MODEL
        self.headers = {
            "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
            "Content-Type": "application/json"
        }
    
    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        """
        Generate embedding for a single text
        Returns embedding vector or None if failed
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for embedding")
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.endpoint}/embeddings",
                    headers=self.headers,
                    json={
                        "model": self.model,
                        "input": text
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Embedding API error: {response.status_code} - {response.text}")
                    return None
                
                data = response.json()
                embedding = data["data"][0]["embedding"]
                
                logger.debug(f"Generated embedding with {len(embedding)} dimensions")
                return embedding
                
        except httpx.TimeoutException:
            logger.error("Embedding API request timeout")
            return None
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return None
    
    async def generate_embeddings_batch(
        self, texts: List[str]
    ) -> List[Optional[List[float]]]:
        """
        Generate embeddings for multiple texts
        Returns list of embeddings (None for failed items)
        """
        if not texts:
            return []
        
        # GitHub Models API supports batch requests
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.endpoint}/embeddings",
                    headers=self.headers,
                    json={
                        "model": self.model,
                        "input": texts
                    },
                    timeout=60.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Batch embedding API error: {response.status_code}")
                    # Fallback to individual generation
                    return [await self.generate_embedding(text) for text in texts]
                
                data = response.json()
                embeddings = [item["embedding"] for item in data["data"]]
                
                logger.info(f"Generated {len(embeddings)} embeddings in batch")
                return embeddings
                
        except Exception as e:
            logger.error(f"Error in batch embedding generation: {e}")
            # Fallback to individual generation
            return [await self.generate_embedding(text) for text in texts]


# Global service instance
embedding_service = EmbeddingService()
