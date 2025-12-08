import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/notifications
 * Fetch notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount: notifications?.filter(n => !n.is_read).length || 0,
    });
  } catch (error: any) {
    console.error('[NOTIFICATIONS] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notification(s) as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all unread notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', notificationIds)
        .eq('user_id', user.id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `${notificationIds.length} notification(s) marked as read`,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('[NOTIFICATIONS] PATCH Error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Delete notification(s)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `${notificationIds.length} notification(s) deleted`,
    });
  } catch (error: any) {
    console.error('[NOTIFICATIONS] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications', details: error.message },
      { status: 500 }
    );
  }
}
