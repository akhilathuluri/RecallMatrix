import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { categorized, clusters, tags } = body;

    console.log('[APPLY ORGANIZATION] Starting', {
      categories: Object.keys(categorized).length,
      clusters: clusters.length,
      totalTags: tags.length,
    });

    // Update each memory with its category and cluster
    const updates = [];
    
    for (const [category, memories] of Object.entries(categorized)) {
      for (const memory of memories as any[]) {
        // Find cluster for this memory
        const cluster = clusters.find((c: any) => c.memoryIds.includes(memory.id));
        
        // Extract relevant tags for this memory
        const memoryText = `${memory.title} ${memory.content}`.toLowerCase();
        const relevantTags = tags.filter((tag: string) => 
          memoryText.includes(tag.toLowerCase())
        ).slice(0, 5);

        updates.push(
          supabase
            .from('memories')
            .update({
              category,
              tags: relevantTags,
              cluster_id: cluster?.id || null,
            })
            .eq('id', memory.id)
            .eq('user_id', user.id)
        );
      }
    }

    // Execute all updates
    const results = await Promise.all(updates);
    
    const successCount = results.filter(r => !r.error).length;
    const errorCount = results.filter(r => r.error).length;

    console.log('[APPLY ORGANIZATION] Completed', {
      success: successCount,
      errors: errorCount,
    });

    return NextResponse.json({
      success: true,
      updated: successCount,
      errors: errorCount,
      message: `Successfully organized ${successCount} memories into ${Object.keys(categorized).length} categories`,
    });
  } catch (error: any) {
    console.error('[APPLY ORGANIZATION] Error:', error);
    return NextResponse.json(
      { error: 'Failed to apply organization', details: error.message },
      { status: 500 }
    );
  }
}
