import React from 'react';
import { Zap, Clock, Tag as TagIcon, Play, Check } from 'lucide-react';
import type { Todo } from '../types/todo';

interface FocusCardProps {
  todo?: Todo;
  onToggle: (id: string) => void;
  onStartZenMode: (todo: Todo) => void;
}

export const FocusCard: React.FC<FocusCardProps> = ({ todo, onToggle, onStartZenMode }) => {
  if (!todo) return null;

  return (
    <section className="focus-section" aria-label="오늘의 가장 중요한 일">
      <div className="focus-header">
        <Zap className="focus-icon" size={16} />
        <h2 className="focus-title">오늘의 가장 중요한 일</h2>
      </div>

      <div className={`focus-card ${todo.completed ? 'completed' : ''}`}>
        <div className="focus-card-body">
          <div className="focus-top-row">
            <button
              type="button"
              className={`focus-checkbox ${todo.completed ? 'checked' : ''}`}
              onClick={() => onToggle(todo.id)}
              aria-label={todo.completed ? '포커스 태스크 완료 해제' : '포커스 태스크 완료'}
            >
              {todo.completed && <Check size={14} className="focus-check-icon" />}
            </button>
            <span className="focus-badge">#1 Focus</span>
          </div>

          <h3 className={`focus-task-title ${todo.completed ? 'line-through' : ''}`}>
            {todo.title}
          </h3>

          <div className="focus-meta-row">
            {todo.dueTime && (
              <span className="meta-chip">
                <Clock size={13} className="meta-chip-icon" />
                <span>{todo.dueTime}</span>
              </span>
            )}
            {todo.tag && (
              <span className="meta-chip">
                <TagIcon size={13} className="meta-chip-icon" />
                <span>{todo.tag}</span>
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="zen-mode-button"
          onClick={() => onStartZenMode(todo)}
          aria-label="Zen Mode 시작"
        >
          <Play size={14} className="zen-play-icon" fill="currentColor" />
          <span>Zen Mode 시작</span>
        </button>
      </div>
    </section>
  );
};
