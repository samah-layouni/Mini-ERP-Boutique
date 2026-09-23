import { useEffect, useState, useCallback } from 'react';

function NotificationToast({ notifications, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(n => (
        <Toast key={n.id} notif={n} onClose={() => onClose(n.id)} />
      ))}
    </div>
  );
}

function Toast({ notif, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), notif.duration || 6000);
    return () => clearTimeout(timer);
  }, []);

  const colors = {
    info:    { bg: 'bg-blue-50',    border: 'border-blue-500',    text: 'text-blue-800',    icon: 'ℹ️' },
    success: { bg: 'bg-green-50',   border: 'border-green-500',   text: 'text-green-800',   icon: '✅' },
    warning: { bg: 'bg-orange-50',  border: 'border-orange-500',  text: 'text-orange-800',  icon: '⚠️' },
    danger:  { bg: 'bg-red-50',     border: 'border-red-500',     text: 'text-red-800',     icon: '🚨' },
  };
  const c = colors[notif.type] || colors.info;

  return (
    <div
      className={`${c.bg} ${c.border} border-l-4 rounded shadow-lg p-4 flex items-start gap-3`}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      <span className="text-xl">{c.icon}</span>
      <div className="flex-1">
        <p className={`font-bold text-sm ${c.text}`}>{notif.title}</p>
        {notif.message && (
          <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-700 font-bold text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const push = useCallback((type, title, message, duration = 6000) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const remove = useCallback(id => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, push, remove };
}

export default NotificationToast;
export { NotificationToast };