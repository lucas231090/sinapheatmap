import { useNotificationStore } from "@/store/useNotificationStore";

const typeStyles = {
  success: "#1f8b4c",
  error: "#bf1d1d",
  info: "#1f4e8b",
};

function NNotificationCenter() {
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification,
  );

  if (!notifications.length) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="rounded border p-3 text-sm text-white"
          style={{
            backgroundColor: typeStyles[notification.type] || typeStyles.info,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <span>{notification.message}</span>
            <button
              type="button"
              onClick={() => removeNotification(notification.id)}
              aria-label="Fechar notificacao"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default NNotificationCenter;
