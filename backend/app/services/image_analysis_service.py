"""
Image Analysis Service for Telegram Bot
Analyzes images using GitHub Models API (GPT-4o vision)
"""

import base64
import json
from typing import Dict, Any, Optional
from loguru import logger  # type: ignore
import httpx  # type: ignore

from app.config import settings


async def analyze_image_from_url(image_url: str, filename: str = "image") -> Dict[str, Any]:
    """
    Analyze an image from a URL using GPT-4o vision model
    
    Args:
        image_url: URL to the image (can be Telegram file URL)
        filename: Original filename for context
    
    Returns:
        Dictionary with title, content, tags, category, and confidence
    """
    try:
        prompt = """Analyze this image and provide the following in JSON format:
1. A concise, descriptive title (max 100 chars)
2. A detailed description of what's in the image (max 500 chars)
3. 3-5 relevant tags/keywords
4. A category from: Personal, Work, Travel, Food, People, Nature, Technology, Art, Education, Health, Finance, Shopping, Entertainment, Other

Respond ONLY with valid JSON in this exact structure:
{
  "title": "concise title here",
  "content": "detailed description here",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "category here",
  "confidence": 0.95
}

Be specific and accurate. The confidence score should be between 0 and 1."""

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.GITHUB_MODELS_ENDPOINT}/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": prompt,
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": image_url,
                                    },
                                },
                            ],
                        }
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.7,
                },
            )

        if response.status_code != 200:
            logger.error(f"Vision API error: {response.text}")
            return _fallback_analysis(filename)

        data = response.json()
        assistant_message = data.get("choices", [{}])[0].get("message", {}).get("content")

        if not assistant_message:
            return _fallback_analysis(filename)

        # Parse JSON response
        try:
            # Extract JSON from response (in case wrapped in markdown)
            if "```json" in assistant_message:
                json_str = assistant_message.split("```json")[1].split("```")[0].strip()
            elif "```" in assistant_message:
                json_str = assistant_message.split("```")[1].split("```")[0].strip()
            else:
                json_str = assistant_message.strip()
            
            # Try to find JSON object
            if "{" in json_str and "}" in json_str:
                start = json_str.index("{")
                end = json_str.rindex("}") + 1
                json_str = json_str[start:end]
            
            analysis = json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {e}\nResponse: {assistant_message}")
            return _fallback_analysis(filename, assistant_message)

        # Validate and sanitize
        return {
            "title": _sanitize_text(analysis.get("title", _extract_title_from_filename(filename)), 100),
            "content": _sanitize_text(analysis.get("content", ""), 500),
            "tags": [_sanitize_text(tag, 30) for tag in analysis.get("tags", [])[:5]],
            "category": _sanitize_text(analysis.get("category", "Other"), 50),
            "confidence": max(0, min(1, float(analysis.get("confidence", 0.5)))),
        }

    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        return _fallback_analysis(filename)


async def analyze_image_from_bytes(
    image_bytes: bytes, 
    mime_type: str = "image/jpeg",
    filename: str = "image"
) -> Dict[str, Any]:
    """
    Analyze an image from raw bytes
    
    Args:
        image_bytes: Raw image bytes
        mime_type: MIME type of the image
        filename: Original filename for context
    
    Returns:
        Dictionary with title, content, tags, category, and confidence
    """
    try:
        # Convert to base64
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        data_url = f"data:{mime_type};base64,{base64_image}"
        
        # Use the URL-based analysis
        return await analyze_image_from_url(data_url, filename)
    
    except Exception as e:
        logger.error(f"Image bytes analysis failed: {e}")
        return _fallback_analysis(filename)


def _fallback_analysis(filename: str, content: str = "") -> Dict[str, Any]:
    """
    Generate fallback analysis when AI fails
    """
    title = _extract_title_from_filename(filename)
    
    return {
        "title": title,
        "content": content[:500] if content else "Image uploaded from Telegram",
        "tags": [],
        "category": "Other",
        "confidence": 0.0,
    }


def _extract_title_from_filename(filename: str) -> str:
    """
    Extract a reasonable title from filename
    """
    # Remove extension
    name_without_ext = filename.rsplit(".", 1)[0] if "." in filename else filename
    
    # Replace special characters with spaces
    cleaned = name_without_ext.replace("_", " ").replace("-", " ")
    
    # Capitalize first letter of each word
    title = " ".join(word.capitalize() for word in cleaned.split())
    
    return title if title else "Uploaded Image"


def _sanitize_text(text: str, max_length: int) -> str:
    """
    Sanitize and truncate text
    """
    if not text:
        return ""
    
    # Remove excessive whitespace
    cleaned = " ".join(text.split())
    
    # Truncate if needed
    if len(cleaned) > max_length:
        return cleaned[:max_length - 3] + "..."
    
    return cleaned
