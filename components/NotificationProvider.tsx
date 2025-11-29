'use client';

import { useNotifications } from '@/hooks/use-notifications';
import { toast } from 'sonner';

/**
 * Client component to enable notifications throughout the app
 * Mount this in the layout to enable notifications globally
 */
export function NotificationProvider() {
  useNotifications({
    enabled: true,
    pollInterval: 30000, // Check every 30 seconds
    onNewNotification: (notification) => {
      // Show toast notification as fallback
      toast(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    },
  });

  return null;
}
