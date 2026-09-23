import React from 'react';
import type { Priority } from '../../types/todo';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const PRIORITY_LABELS: Record<Priority, string> = {
  high: '높은',
  normal: '보통',
  low: '낮은',
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  return (
    <span className={`priority-badge priority-${priority} ${className}`}>
      <span className="priority-dot" aria-hidden="true" />
      <span className="priority-label">{PRIORITY_LABELS[priority]}</span>
    </span>
  );
};
