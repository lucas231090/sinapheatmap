import { useCallback } from "react";
import { useNotificationStore } from "@/store/useNotificationStore";

export function useNotifications() {
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const notifySuccess = useCallback(
    (message) => addNotification({ type: "success", message }),
    [addNotification],
  );

  const notifyError = useCallback(
    (message) => addNotification({ type: "error", message }),
    [addNotification],
  );

  const notifyInfo = useCallback(
    (message) => addNotification({ type: "info", message }),
    [addNotification],
  );

  return { notifySuccess, notifyError, notifyInfo };
}
