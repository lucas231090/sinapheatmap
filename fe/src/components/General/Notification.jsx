const Notification = ({ message, type, onClose }) => {
  if (!message) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case "error":
        return "bg-red-500";
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${getBackgroundColor()}`}
    >
      <p>{message}</p>
      <button className="mt-2 text-sm underline" onClick={onClose}>
        Fechar
      </button>
    </div>
  );
};

export default Notification;
