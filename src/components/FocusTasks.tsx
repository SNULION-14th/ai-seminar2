import React from 'react';
import type { Task } from '../types/todo';
import { CheckIcon, GripDotsIcon, TargetIcon } from './Icons';

interface FocusTasksProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
}

export const FocusTasks: React.FC<FocusTasksProps> = ({
  tasks,
  onToggleTask,
  onRemoveTask,
}) => {
  return (
    <section className="focus-section">
      <div className="focus-header">
        <div className="focus-pill">
          <TargetIcon size={14} color="#4338CA" />
          <span>Today’s focus</span>
        </div>
        <p className="focus-subtitle">Max 3 critical items for maximum clarity.</p>
      </div>

      <div className="focus-list">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`task-card ${task.completed ? 'task-completed' : ''}`}
          >
            <button
              type="button"
              className={`checkbox-btn ${task.completed ? 'checked' : ''}`}
              onClick={() => onToggleTask(task.id)}
              aria-label={
                task.completed
                  ? `Mark ${task.title} as incomplete`
                  : `Mark ${task.title} as complete`
              }
            >
              {task.completed && <CheckIcon size={13} strokeWidth={2.8} />}
            </button>

            <div
              className="task-body"
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
              <div className="task-title">{task.title}</div>
              {task.completed && task.completedAt && (
                <div className="task-timestamp">
                  Completed {task.completedAt}
                </div>
              )}
            </div>

            <button
              type="button"
              className="task-action-btn"
              onClick={() => onRemoveTask(task.id)}
              title="Delete task"
              aria-label="Delete task"
            >
              <GripDotsIcon size={16} />
            </button>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="empty-focus-state">
            No focus tasks set. Pick up to 3 high-impact tasks for today.
          </div>
        )}
      </div>
    </section>
  );
};
