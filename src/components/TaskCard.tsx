import React from 'react';
import type { TaskItem } from '../types';
import { Check, ExternalLink, FileText, Trash2, Calendar } from 'lucide-react';

interface TaskCardProps {
  task: TaskItem;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete }) => {
  return (
    <div className={`task-card ${task.completed ? 'completed' : ''}`} data-testid={`task-card-${task.id}`}>
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
            {task.eventTitle && (
              <span className="task-event-pill">
                <Calendar size={11} />
                <span>{task.eventTitle}</span>
              </span>
            )}

            {task.notionContext && (
              <span
                className={`task-notion-pill type-${task.notionContext.type.toLowerCase()}`}
                data-testid={`task-notion-${task.id}`}
              >
                <FileText size={11} />
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
