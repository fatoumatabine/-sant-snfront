import { create } from 'zustand';
import { Notification } from '@/types';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';

interface NotificationApi {
  id: number;
  userId: number;
  titre: string;
  message: string;
  lu: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'lu'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  getUnreadCount: () => number;
  reset: () => void;
}

const mapApiNotification = (item: NotificationApi): Notification => ({
  id: String(item.id),
  userId: String(item.userId),
  titre: item.titre,
  message: item.message,
  type: 'info',
  lu: item.lu,
  date: item.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
});

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.get(API_ENDPOINTS.notifications.list);
      const items = (response.data || response || []) as NotificationApi[];
      const notifications = Array.isArray(items) ? items.map(mapApiNotification) : [];
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.lu).length,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur notifications',
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.notifications.unread + '/count');
      const count = response?.data?.count ?? 0;
      set({ unreadCount: count });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erreur compteur notifications',
      });
    }
  },

  addNotification: async (notification) => {
    try {
      await apiService.post(API_ENDPOINTS.notifications.list, {
        userId: Number(notification.userId),
        titre: notification.titre,
        message: notification.message,
      });
      await get().fetchNotifications();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erreur création notification',
      });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await apiService.put(API_ENDPOINTS.notifications.markRead(id), {});
      set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === id ? { ...n, lu: true } : n
        );
        return {
          notifications,
          unreadCount: notifications.filter((n) => !n.lu).length,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erreur lecture notification',
      });
    }
  },

  markAllAsRead: async () => {
    try {
      await apiService.put(API_ENDPOINTS.notifications.markAllRead, {});
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, lu: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erreur lecture notifications',
      });
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await apiService.delete(API_ENDPOINTS.notifications.delete(id));
      set((state) => {
        const notifications = state.notifications.filter((n) => n.id !== id);
        return {
          notifications,
          unreadCount: notifications.filter((n) => !n.lu).length,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erreur suppression notification',
      });
    }
  },

  getUnreadCount: () => get().unreadCount,

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
    });
  },
}));
