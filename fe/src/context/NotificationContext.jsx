import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Notification from "@/components/General/Notification";

export const NotificationContext = createContext({
  notify: () => {},
});

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    message: "",
    type: "success",
  });

  const clear = useCallback(() => {
    setNotification({ message: "", type: "success" });
  }, []);

  const notify = useCallback(({ message, type = "success" }) => {
    setNotification({ message, type });
  }, []);

  useEffect(() => {
    if (!notification.message) return;
    const timeoutId = setTimeout(() => {
      clear();
    }, 4000);
    return () => clearTimeout(timeoutId);
  }, [notification.message, clear]);

  const value = useMemo(() => ({ notify, clear }), [notify, clear]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={clear}
      />
    </NotificationContext.Provider>
  );
};
