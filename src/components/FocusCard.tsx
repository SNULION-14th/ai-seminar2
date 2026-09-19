import React from 'react';
import type { Task } from '../types/todo';
import { Trash2 } from 'lucide-react';

interface FocusCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const FocusCard: React.FC<FocusCardProps> = ({ task, onToggle, onDelete }) => {
  const getBadgeClass = (priority: Task['priority']) => {
    switch (priority) {
      case 'High':
        return 'badge-high';
      case 'Medium':
        return 'badge-medium';
      case 'Low':
        return 'badge-low';
    }
  };

  return (
    <div className={`focus-card ${task.completed ? 'completed' : ''}`}>
      <button
        type="button"
        className={`focus-checkbox ${task.completed ? 'checked' : ''}`}
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? 'Mark uncompleted' : 'Mark completed'}
      >
        {task.completed && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M11.5 3.5L5.3 9.7L2.5 6.9"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <span className="focus-card-title">{task.title}</span>

      <div className="focus-card-actions">
        <span className={`priority-badge ${getBadgeClass(task.priority)}`}>
          {task.priority}
        </span>
        <button
          type="button"
          className="card-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          title="Delete task"
          aria-label="Delete task"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};
