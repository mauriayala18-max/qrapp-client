import { api } from "./api";

export type NotificationType =
  | "order_status"
  | "payment"
  | "reservation"
  | "points"
  | "promotion"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType | string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  reference_id?: string;
}

export interface NotificationPreferences {
  order_status: boolean;
  payment: boolean;
  reservation: boolean;
  points: boolean;
  promotion: boolean;
  system: boolean;
}

export interface NotificationsPage {
  notifications: AppNotification[];
  has_more: boolean;
  page: number;
}

const DEFAULT_PREFS: NotificationPreferences = {
  order_status: true,
  payment: true,
  reservation: true,
  points: true,
  promotion: true,
  system: true,
};

export const notificationService = {
  getNotifications: async (
    page = 1,
    unreadOnly = false,
  ): Promise<NotificationsPage> => {
    const res = await api.get<
      | AppNotification[]
      | { notifications?: AppNotification[]; items?: AppNotification[]; has_more?: boolean }
    >("/api/v1/notifications", {
      params: { page, ...(unreadOnly ? { unread_only: true } : {}) },
    });
    const data = res.data;
    const notifications = Array.isArray(data)
      ? data
      : data.notifications ?? data.items ?? [];
    const hasMore = Array.isArray(data)
      ? notifications.length > 0
      : Boolean(data.has_more);
    return { notifications, has_more: hasMore, page };
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<{ count?: number; unread?: number }>(
      "/api/v1/notifications/unread-count",
    );
    return Number(res.data?.count ?? res.data?.unread ?? 0);
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await api.patch(`/api/v1/notifications/${notificationId}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.post("/api/v1/notifications/read-all");
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const res = await api.get<Partial<NotificationPreferences>>(
      "/api/v1/notifications/preferences",
    );
    return { ...DEFAULT_PREFS, ...(res.data ?? {}) };
  },

  updatePreferences: async (
    prefs: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> => {
    const res = await api.patch<Partial<NotificationPreferences>>(
      "/api/v1/notifications/preferences",
      prefs,
    );
    return { ...DEFAULT_PREFS, ...(res.data ?? prefs) };
  },
};
