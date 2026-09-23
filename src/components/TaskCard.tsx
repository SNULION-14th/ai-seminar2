import React from "react";
import type { TaskItem } from "../types";
import {
  Check,
  ExternalLink,
  FileText,
  Trash2,
  Calendar,
  AlertCircle,
  Pencil,
} from "lucide-react";

interface TaskCardProps {
  task: TaskItem;
  onToggle: (id: string) => void;
  onEdit?: (task: TaskItem) => void;
  onDelete?: (id: string) => void;
  showEventTitle?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
  showEventTitle = true,
}) => {
  const now = new Date();
  const referenceDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isOverdue =
    !task.completed && task.dueDate && task.dueDate < referenceDate;

  return (
    <div
      className={`task-card ${task.completed ? "completed" : ""} ${isOverdue ? "overdue" : ""}`}
      data-testid={`task-card-${task.id}`}
    >
      <div className="task-main">
        <button
          className={`task-checkbox ${task.completed ? "checked" : ""}`}
          onClick={() => onToggle(task.id)}
          aria-label={
            task.completed ? "Mark task as incomplete" : "Mark task as complete"
          }
          data-testid={`task-toggle-${task.id}`}
        >
          {task.completed && <Check size={14} />}
        </button>

        <div className="task-content">
          <div className="task-title-line">
            <span
              className={`task-title ${task.completed ? "line-through" : ""}`}
            >
              {task.title}
            </span>
          </div>

          <div className="task-meta-row">
            {/* Due Date / Overdue Indicator */}
            {task.dueDate && (
              <span
                className={`task-date-pill ${isOverdue ? "overdue-pill" : ""}`}
              >
                {isOverdue ? <AlertCircle size={10} /> : <Calendar size={10} />}
                <span>
                  {isOverdue
                    ? `Overdue (${task.dueDate})`
                    : `Due ${task.dueDate}`}
                </span>
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
                <span className="context-type-badge">
                  {task.notionContext.type}
                </span>
                <span className="context-title">
                  {task.notionContext.pageTitle}
                </span>
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

      {(onEdit || onDelete) && (
        <div className="task-card-actions">
          {onEdit && (
            <button
              className="icon-btn"
              onClick={() => onEdit(task)}
              title="Edit Task"
              data-testid={`edit-task-btn-${task.id}`}
            >
              <Pencil size={13} />
            </button>
          )}
          {onDelete && (
            <button
              className="icon-btn delete-btn"
              onClick={() => {
                if (window.confirm(`Delete "${task.title}"?`)) {
                  onDelete(task.id);
                }
              }}
              title="Delete Task"
              data-testid={`delete-task-btn-${task.id}`}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
