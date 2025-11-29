'use client';

import { useEffect, useCallback, useRef } from 'react';

interface UseNotificationsOptions {
  enabled?: boolean;
  pollInterval?: number;
  onNewNotification?: (notification: any) => void;
}

/**
 * Hook to manage notifications polling and browser push notifications
 */
export function useNotifications({
  enabled = true,
  pollInterval = 30000, // 30 seconds
  onNewNotification,
}: UseNotificationsOptions = {}) {
  const lastCheckRef = useRef<Date | null>(null);
  const permissionGrantedRef = useRef(false);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('[NOTIFICATIONS] Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      permissionGrantedRef.current = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('[NOTIFICATIONS] Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      permissionGrantedRef.current = permission === 'granted';
      return permission === 'granted';
    } catch (error) {
      console.error('[NOTIFICATIONS] Error requesting permission:', error);
      return false;
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: any) => {
    if (!permissionGrantedRef.current || !('Notification' in window)) {
      return;
    }

    try {
      const notif = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png', // Add your app icon
        badge: '/badge-72x72.png', // Add a small badge icon
        tag: notification.id, // Prevent duplicate notifications
        requireInteraction: notification.priority === 'high',
        silent: notification.priority === 'low',
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (error) {
      console.error('[NOTIFICATIONS] Error showing notification:', error);
    }
  }, []);

  // Poll for new notifications
  const checkForNewNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?unread=true&limit=10');
      const data = await response.json();

      if (data.success && data.notifications?.length > 0) {
        const now = new Date();
        
        // Get notifications created after last check
        const newNotifications = data.notifications.filter((notif: any) => {
          const createdAt = new Date(notif.created_at);
          return !lastCheckRef.current || createdAt > lastCheckRef.current;
        });

        // Show browser notifications for new items
        for (const notif of newNotifications) {
          showBrowserNotification(notif);
          onNewNotification?.(notif);
        }

        lastCheckRef.current = now;
      }
    } catch (error) {
      console.error('[NOTIFICATIONS] Error checking for notifications:', error);
    }
  }, [showBrowserNotification, onNewNotification]);

  // Request permission on mount
  useEffect(() => {
    if (enabled) {
      requestNotificationPermission();
      lastCheckRef.current = new Date();
    }
  }, [enabled, requestNotificationPermission]);

  // Set up polling
  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkForNewNotifications();

    // Set up interval
    const interval = setInterval(checkForNewNotifications, pollInterval);

    return () => clearInterval(interval);
  }, [enabled, pollInterval, checkForNewNotifications]);

  return {
    requestPermission: requestNotificationPermission,
    checkNow: checkForNewNotifications,
  };
}
