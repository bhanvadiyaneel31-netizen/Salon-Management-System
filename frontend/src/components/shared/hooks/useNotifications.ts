import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../../../services/api';
import { Notification } from '../../../types/notification';

export function useNotifications(activeSection: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const hasMarkedReadRef = useRef(false);

  const loadNotifications = async () => {
    try {
      const data = await api.notifications.getAll();
      setNotifications(data.map((n: any) => ({
        id: String(n.id),
        title: n.title,
        message: n.message,
        type: n.type,
        timestamp: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }),
        read: !!n.is_read
      })));
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeSection === 'notifications') {
      const unreadCount = notifications.filter(n => !n.read).length;
      if (unreadCount > 0 && !hasMarkedReadRef.current) {
        const markAll = async () => {
          try {
            await api.notifications.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            hasMarkedReadRef.current = true;
          } catch (error) {
            console.error('Failed to mark all as read:', error);
          }
        };
        markAll();
      }
    } else {
      hasMarkedReadRef.current = false;
    }
  }, [activeSection, notifications]);

  return { notifications, markAsRead, markAllAsRead, loadNotifications };
}
