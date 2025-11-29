import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ReminderAgent } from '@/lib/agents/ReminderAgent';

/**
 * Scan all memories for reminders and create notifications
 * This endpoint should be called daily (e.g., via cron job or scheduler)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[REMINDER-SCAN] Starting scan for user:', user.id);

    // Initialize ReminderAgent
    const reminderAgent = new ReminderAgent();

    // Execute reminder detection
    const result = await reminderAgent.execute({
      id: `reminder_scan_${Date.now()}`,
      type: 'reminder',
      priority: 1,
      query: 'Scan for reminders',
      userId: user.id,
      createdAt: new Date(),
    });

    if (!result.success || !result.data) {
      throw new Error('Failed to scan reminders');
    }

    // Extract reminders from result
    const reminders = result.data.reminders || [];
    console.log('[REMINDER-SCAN] Found reminders:', reminders.length);

    // Create notifications for each reminder
    const notifications = reminders.map((reminder: any) => ({
      user_id: user.id,
      memory_id: reminder.memoryIds?.[0] || null, // ProactiveInsight has memoryIds array
      title: reminder.title,
      message: reminder.description || reminder.suggestedAction || 'Reminder notification',
      priority: reminder.priority,
      type: 'reminder',
      is_read: false,
      metadata: {
        actionable: reminder.actionable,
        suggestedAction: reminder.suggestedAction,
        type: reminder.type,
      },
    }));

    // Insert notifications (skip duplicates for same memory in last 24 hours)
    let insertedCount = 0;
    for (const notification of notifications) {
      // Check if notification already exists for this memory in last 24 hours
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('memory_id', notification.memory_id)
        .eq('type', 'reminder')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('notifications')
          .insert(notification);

        if (!error) {
          insertedCount++;
        } else {
          console.error('[REMINDER-SCAN] Error inserting notification:', error);
        }
      }
    }

    console.log('[REMINDER-SCAN] Created notifications:', insertedCount);

    return NextResponse.json({
      success: true,
      remindersFound: reminders.length,
      notificationsCreated: insertedCount,
      data: {
        reminders,
      },
    });
  } catch (error: any) {
    console.error('[REMINDER-SCAN] Error:', error);
    return NextResponse.json(
      { error: 'Failed to scan reminders', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger for testing (GET request)
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
