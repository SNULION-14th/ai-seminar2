import React, { useState } from 'react';
import type { Task } from '../types/todo';
import { CheckIcon, ChevronDownIcon, TargetIcon } from './Icons';

interface OtherTasksProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onPromoteToFocus: (id: string) => void;
  canPromote: boolean;
  onRemoveTask: (id: string) => void;
}

export const OtherTasks: React.FC<OtherTasksProps> = ({
  tasks,
  onToggleTask,
  onPromoteToFocus,
  canPromote,
  onRemoveTask,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (tasks.length === 0) {
    return null;
  }

  const remainingCount = tasks.filter((t) => !t.completed).length;

  return (
    <section className="other-tasks-section">
      <button
        type="button"
        className="other-tasks-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="other-tasks-title-group">
          <span className="other-tasks-title">OTHER TASKS</span>
          <span className="other-tasks-count">{remainingCount}</span>
        </div>
        <div className={`chevron-wrapper ${isOpen ? 'open' : ''}`}>
          <ChevronDownIcon size={16} color="#94A3B8" />
        </div>
      </button>

      {isOpen && (
        <div className="other-tasks-list">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`other-task-item ${task.completed ? 'completed' : ''}`}
            >
              <div
                className="other-task-content"
                onClick={() => onToggleTask(task.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleTask(task.id);
                  }
                }}
              >
                <button
                  type="button"
                  className={`other-checkbox ${task.completed ? 'checked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(task.id);
                  }}
                  aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {task.completed && <CheckIcon size={10} strokeWidth={2.5} />}
                </button>
                <span className="other-task-title">{task.title}</span>
              </div>

              <div className="other-task-actions">
                {canPromote && !task.completed && (
                  <button
                    type="button"
                    className="action-icon-btn promote-btn"
                    onClick={() => onPromoteToFocus(task.id)}
                    title="Promote to Today's Focus"
                    aria-label="Promote to Today's Focus"
                  >
                    <TargetIcon size={14} color="#6366F1" />
                  </button>
                )}
                <button
                  type="button"
                  className="action-icon-btn delete-btn"
                  onClick={() => onRemoveTask(task.id)}
                  title="Delete task"
                  aria-label="Delete task"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
