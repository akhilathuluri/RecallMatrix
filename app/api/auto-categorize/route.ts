import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auto-categorize a single memory
 * Called automatically when a memory is created or updated
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { memoryId, title, content } = body;

    if (!memoryId || (!title && !content)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Try AI-based categorization first, fallback to keyword-based
    let category: string;
    let tags: string[];
    
    try {
      const aiResult = await categorizeWithAI(title, content);
      category = aiResult.category;
      tags = aiResult.tags;
      console.log('[AUTO-CATEGORIZE] AI-based:', { memoryId, category, tags });
    } catch (aiError) {
      console.warn('[AUTO-CATEGORIZE] AI failed, using keyword fallback:', aiError);
      category = inferCategory(title, content);
      tags = extractTags(title, content);
      console.log('[AUTO-CATEGORIZE] Keyword-based:', { memoryId, category, tags });
    }

    // Update memory with category and tags
    const { error } = await supabase
      .from('memories')
      .update({
        category,
        tags,
      })
      .eq('id', memoryId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      category,
      tags,
    });
  } catch (error: any) {
    console.error('[AUTO-CATEGORIZE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to categorize memory', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * AI-based categorization using GPT model
 */
async function categorizeWithAI(title: string, content: string): Promise<{ category: string; tags: string[] }> {
  const githubToken = process.env.GITHUB_MODELS_API_KEY || process.env.GITHUB_TOKEN;
  
  if (!githubToken) {
    throw new Error('GitHub Models API key not configured');
  }

  const prompt = `Analyze this memory and categorize it into ONE of these categories: Work, Finance, Health, Travel, Education, Shopping, Entertainment, Family, Personal, Other.

Also extract 3-5 relevant tags (single words or short phrases).

Memory Title: ${title}
Memory Content: ${content || 'No additional content'}

Respond in JSON format:
{
  "category": "CategoryName",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${githubToken}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a categorization assistant. Always respond with valid JSON containing category and tags.' 
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub Models API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0]?.message?.content || '{}';
  
  // Parse JSON response
  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON');
  }
  
  const result = JSON.parse(jsonMatch[0]);
  
  // Validate category
  const validCategories = ['Work', 'Finance', 'Health', 'Travel', 'Education', 'Shopping', 'Entertainment', 'Family', 'Personal', 'Other'];
  if (!validCategories.includes(result.category)) {
    result.category = 'Personal';
  }
  
  // Validate tags
  if (!Array.isArray(result.tags) || result.tags.length === 0) {
    result.tags = extractTags(title, content); // Fallback to keyword extraction
  } else {
    result.tags = result.tags.slice(0, 10); // Limit to 10 tags
  }
  
  return result;
}

/**
 * Infer category from title and content (keyword-based fallback)
 */
function inferCategory(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    'Work': ['work', 'project', 'meeting', 'deadline', 'office', 'client', 'team', 'job', 'career', 'business', 'colleague'],
    'Finance': ['bank', 'payment', 'invoice', 'budget', 'expense', 'salary', 'tax', 'subscription', 'membership', 'bill', 'money', 'credit', 'debit'],
    'Health': ['doctor', 'health', 'medical', 'appointment', 'medication', 'exercise', 'fitness', 'hospital', 'clinic', 'wellness'],
    'Travel': ['travel', 'trip', 'vacation', 'flight', 'hotel', 'passport', 'destination', 'tour', 'journey', 'visit'],
    'Education': ['study', 'course', 'learn', 'book', 'exam', 'university', 'school', 'tutorial', 'lesson', 'training'],
    'Shopping': ['buy', 'purchase', 'shop', 'order', 'product', 'store', 'amazon', 'cart', 'delivery'],
    'Entertainment': ['movie', 'game', 'music', 'show', 'concert', 'watch', 'play', 'netflix', 'spotify', 'entertainment', 'fun'],
    'Family': ['family', 'mom', 'dad', 'child', 'parent', 'relative', 'sister', 'brother', 'birthday', 'anniversary', 'kid'],
    'Personal': ['personal', 'favourite', 'love', 'friend', 'life', 'hobby', 'interest', 'like', 'enjoy'],
  };

  let maxScore = 0;
  let bestCategory = 'Personal';

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const score = keywords.filter(keyword => text.includes(keyword)).length;
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

/**
 * Extract tags from title and content
 */
function extractTags(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'is', 'was', 'are', 'were',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those',
    'with', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'have', 'has', 'had', 'will', 'would', 'can', 'could', 'should', 'may', 'might',
  ]);

  // Remove URLs
  const textWithoutUrls = text.replace(/https?:\/\/[^\s]+/g, '');
  
  // Split into words and filter
  const words = textWithoutUrls
    .split(/[\s,\.;:!?()\[\]{}\"']+/)
    .filter(w => 
      w.length >= 3 && 
      w.length <= 20 && 
      !commonWords.has(w) &&
      !/^\d+$/.test(w) && // Not just numbers
      !/[^a-z0-9-_]/.test(w) // Only alphanumeric and hyphens
    );

  // Get unique words, limit to top 5
  return Array.from(new Set(words)).slice(0, 5);
}
