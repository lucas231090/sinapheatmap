import { useNotificationStore } from "@/store/useNotificationStore";

export function useNotifications() {
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  return {
    notifySuccess: (message) => addNotification({ type: "success", message }),
    notifyError: (message) => addNotification({ type: "error", message }),
    notifyInfo: (message) => addNotification({ type: "info", message }),
  };
}
