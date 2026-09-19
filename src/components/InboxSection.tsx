import React, { useState } from 'react';
import type { Task } from '../types/todo';
import inboxIcon from '../assets/figma/inbox-icon.svg';
import chevronIcon from '../assets/figma/chevron-down.svg';
import circleCheckEmpty from '../assets/figma/circle-check-empty.svg';
import { Trash2, ArrowUpCircle } from 'lucide-react';

interface InboxSectionProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPromoteToFocus?: (id: string) => void;
}

export const InboxSection: React.FC<InboxSectionProps> = ({
  tasks,
  onToggle,
  onDelete,
  onPromoteToFocus,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="inbox-section">
      <button
        type="button"
        className="inbox-header-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="inbox-title-group">
          <img src={inboxIcon} alt="" className="inbox-icon" />
          <span className="inbox-title">Later / Inbox</span>
          <span className="inbox-counter">{tasks.length}</span>
        </div>
        <img
          src={chevronIcon}
          alt=""
          className={`inbox-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="inbox-list">
          {tasks.length === 0 ? (
            <div className="empty-state-muted">Inbox is empty</div>
          ) : (
            tasks.map((task, index) => (
              <div
                key={task.id}
                className={`inbox-item ${index > 0 ? 'inbox-item-bordered' : ''}`}
              >
                <button
                  type="button"
                  className="inbox-checkbox"
                  onClick={() => onToggle(task.id)}
                  aria-label="Mark completed"
                >
                  <img src={circleCheckEmpty} alt="" className="checkbox-svg" />
                </button>

                <span className="inbox-item-title">{task.title}</span>

                <div className="inbox-item-meta">
                  <span className="inbox-priority-label">{task.priority}</span>
                  <div className="inbox-item-actions">
                    {onPromoteToFocus && (
                      <button
                        type="button"
                        className="item-action-btn"
                        onClick={() => onPromoteToFocus(task.id)}
                        title="Promote to Top 3 Focus"
                        aria-label="Promote to Top 3 Focus"
                      >
                        <ArrowUpCircle size={15} />
                      </button>
                    )}
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
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};
