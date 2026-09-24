import React, { useEffect } from 'react';
import { CheckCircle2, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  icon?: 'check' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  icon = 'check',
  onClose,
  duration = 2400,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {icon === 'check' ? <CheckCircle2 size={16} /> : <Info size={16} />}
      <span>{message}</span>
    </div>
  );
};
