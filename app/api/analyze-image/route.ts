import { NextRequest, NextResponse } from 'next/server';

const GITHUB_API_KEY = process.env.GITHUB_MODELS_API_KEY;
const GITHUB_MODELS_ENDPOINT = 'https://models.inference.ai.azure.com';

interface AnalysisOptions {
  generateTitle?: boolean;
  generateContent?: boolean;
  generateTags?: boolean;
  generateCategory?: boolean;
  maxTitleLength?: number;
  maxContentLength?: number;
}

/**
 * POST /api/analyze-image
 * Analyzes an image using GPT-4o vision model to generate title, content, tags, and category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, filename, mimeType, options = {} } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    const {
      generateTitle = true,
      generateContent = true,
      generateTags = true,
      generateCategory = true,
      maxTitleLength = 100,
      maxContentLength = 500,
    } = options as AnalysisOptions;

    // Build the prompt based on requested options
    const promptParts: string[] = [];
    
    if (generateTitle) {
      promptParts.push(`1. A concise, descriptive title (max ${maxTitleLength} chars)`);
    }
    if (generateContent) {
      promptParts.push(`2. A detailed description of what's in the image (max ${maxContentLength} chars)`);
    }
    if (generateTags) {
      promptParts.push(`3. 3-5 relevant tags/keywords`);
    }
    if (generateCategory) {
      promptParts.push(`4. A category from: Personal, Work, Travel, Food, People, Nature, Technology, Art, Education, Health, Finance, Shopping, Entertainment, Other`);
    }

    const prompt = `Analyze this image and provide the following in JSON format:
${promptParts.join('\n')}

Respond ONLY with valid JSON in this exact structure:
{
  "title": "concise title here",
  "content": "detailed description here",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "category here",
  "confidence": 0.95
}

If any field is not requested, still include it with a default value. Be specific and accurate. The confidence score should be between 0 and 1.`;

    // Call GitHub Models API (GPT-4o with vision)
    const response = await fetch(`${GITHUB_MODELS_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GITHUB_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub Models API error:', errorText);
      throw new Error(`Vision API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from vision model');
    }

    // Parse the JSON response
    let analysisResult;
    try {
      // Try to extract JSON from the response (in case model wraps it in markdown)
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : assistantMessage;
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', assistantMessage);
      // Fallback parsing attempt
      analysisResult = {
        title: extractTitleFromFilename(filename || 'image'),
        content: assistantMessage.substring(0, maxContentLength),
        tags: [],
        category: 'Other',
        confidence: 0.5,
      };
    }

    // Validate and sanitize the result
    const result = {
      title: sanitizeText(analysisResult.title || extractTitleFromFilename(filename), maxTitleLength),
      content: sanitizeText(analysisResult.content || '', maxContentLength),
      suggestedTags: Array.isArray(analysisResult.tags) 
        ? analysisResult.tags.slice(0, 5).map((tag: string) => sanitizeText(tag, 30))
        : [],
      suggestedCategory: sanitizeText(analysisResult.category || 'Other', 50),
      confidence: Math.min(Math.max(Number(analysisResult.confidence) || 0.5, 0), 1),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Image analysis error:', error);
    
    // Return a graceful fallback instead of failing
    const fallbackResult = {
      title: 'Uploaded Image',
      content: 'Image uploaded successfully',
      suggestedTags: [],
      suggestedCategory: 'Other',
      confidence: 0,
    };

    return NextResponse.json(fallbackResult);
  }
}

/**
 * Sanitize and truncate text
 */
function sanitizeText(text: string, maxLength: number): string {
  if (!text) return '';
  
  // Remove excessive whitespace
  const cleaned = text.trim().replace(/\s+/g, ' ');
  
  // Truncate if needed
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength - 3) + '...';
  }
  
  return cleaned;
}

/**
 * Extract title from filename as fallback
 */
function extractTitleFromFilename(filename: string): string {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const cleaned = nameWithoutExt.replace(/[_-]/g, ' ');
  const title = cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  return title || 'Uploaded Image';
}
