import { create } from "zustand";

const DEFAULT_DURATION = 5000;

export const useNotificationStore = create((set) => ({
  notifications: [],
  addNotification: ({
    type = "info",
    message,
    duration = DEFAULT_DURATION,
  }) => {
    const id = crypto.randomUUID();

    set((state) => ({
      notifications: [...state.notifications, { id, type, message }],
    }));

    if (duration > 0) {
      window.setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter(
            (notification) => notification.id !== id,
          ),
        }));
      }, duration);
    }

    return id;
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id,
      ),
    }));
  },
  clearNotifications: () => {
    set({ notifications: [] });
  },
}));
