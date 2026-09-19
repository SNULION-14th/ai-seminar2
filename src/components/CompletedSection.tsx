import React from 'react';
import type { Task } from '../types/todo';
import circleCheckDone from '../assets/figma/circle-check-done.svg';
import { Trash2 } from 'lucide-react';

interface CompletedSectionProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const CompletedSection: React.FC<CompletedSectionProps> = ({
  tasks,
  onToggle,
  onDelete,
}) => {
  if (tasks.length === 0) return null;

  return (
    <section className="completed-section">
      <div className="completed-divider">
        <div className="divider-line" />
        <span className="divider-text">COMPLETED</span>
        <div className="divider-line" />
      </div>

      <div className="completed-list">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={`completed-item ${index > 0 ? 'completed-item-bordered' : ''}`}
          >
            <button
              type="button"
              className="completed-checkbox"
              onClick={() => onToggle(task.id)}
              aria-label="Mark uncompleted"
            >
              <img src={circleCheckDone} alt="" className="checkbox-svg" />
            </button>

            <span className="completed-item-title">{task.title}</span>

            <div className="completed-item-actions">
              <button
                type="button"
                className="item-action-btn delete"
                onClick={() => onDelete(task.id)}
                title="Delete task"
                aria-label="Delete task"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
