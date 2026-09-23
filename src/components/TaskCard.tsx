import React from 'react';
import type { TaskItem } from '../types';
import { Check, ExternalLink, FileText, Trash2, Calendar, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: TaskItem;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  showEventTitle?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggle,
  onDelete,
  showEventTitle = true
}) => {
  // Check if overdue: for semester mock, reference date is mid-October 2026 (e.g., 2026-10-14) or current date
  const referenceDate = '2026-10-14';
  const isOverdue = !task.completed && task.dueDate && task.dueDate < referenceDate;

  return (
    <div
      className={`task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
      data-testid={`task-card-${task.id}`}
    >
      <div className="task-main">
        <button
          className={`task-checkbox ${task.completed ? 'checked' : ''}`}
          onClick={() => onToggle(task.id)}
          aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
          data-testid={`task-toggle-${task.id}`}
        >
          {task.completed && <Check size={14} />}
        </button>

        <div className="task-content">
          <div className="task-title-line">
            <span className={`task-title ${task.completed ? 'line-through' : ''}`}>
              {task.title}
            </span>
          </div>

          <div className="task-meta-row">
            {/* Due Date / Overdue Indicator */}
            {task.dueDate && (
              <span className={`task-date-pill ${isOverdue ? 'overdue-pill' : ''}`}>
                {isOverdue ? <AlertCircle size={10} /> : <Calendar size={10} />}
                <span>{isOverdue ? `Overdue (${task.dueDate})` : `Due ${task.dueDate}`}</span>
              </span>
            )}

            {/* Parent Event Tag (optional if grouped) */}
            {showEventTitle && task.eventTitle && (
              <span className="task-event-pill">
                <span>{task.eventTitle}</span>
              </span>
            )}

            {/* Notion Context Pill */}
            {task.notionContext && (
              <span
                className={`task-notion-pill type-${task.notionContext.type.toLowerCase()}`}
                data-testid={`task-notion-${task.id}`}
              >
                <FileText size={10} />
                <span className="context-type-badge">{task.notionContext.type}</span>
                <span className="context-title">{task.notionContext.pageTitle}</span>
                {task.notionContext.url && (
                  <a
                    href={task.notionContext.url}
                    target="_blank"
                    rel="noreferrer"
                    className="notion-link-icon"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={10} />
                  </a>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {onDelete && (
        <button
          className="icon-btn delete-btn"
          onClick={() => onDelete(task.id)}
          title="Delete Task"
          data-testid={`delete-task-btn-${task.id}`}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
};
