'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[100] flex items-center space-x-3 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 ${
        bgColor[type]
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
    >
      <span className="text-lg font-bold">{icon[type]}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75">
        ✕
      </button>
    </div>
  );
}
