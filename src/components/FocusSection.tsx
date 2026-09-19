import React from 'react';
import type { Task } from '../types/todo';
import { FocusCard } from './FocusCard';
import focusIcon from '../assets/figma/focus-icon.svg';

interface FocusSectionProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const FocusSection: React.FC<FocusSectionProps> = ({ tasks, onToggle, onDelete }) => {
  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <section className="focus-section">
      <div className="section-header">
        <div className="section-header-left">
          <div className="section-tag">
            <img src={focusIcon} alt="" className="tag-icon" />
            <span className="tag-label">FOCUS NOW</span>
          </div>
          <h2 className="section-title">Your top three</h2>
        </div>
        <span className="section-counter">{activeCount} active</span>
      </div>

      <div className="focus-cards-list">
        {tasks.length === 0 ? (
          <div className="empty-state">No focus tasks currently. Add one below!</div>
        ) : (
          tasks.map((task) => (
            <FocusCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  );
};
