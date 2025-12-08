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

    // Categorize the memory
    const category = inferCategory(title, content);
    const tags = extractTags(title, content);

    console.log('[AUTO-CATEGORIZE]', { memoryId, category, tags });

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
 * Infer category from title and content
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
