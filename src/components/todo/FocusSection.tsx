import React from 'react';
import type { Todo } from '../../types/todo';
import { TodoItem } from './TodoItem';
import { MAX_FOCUS_TASKS } from '../../services/todoService';

interface FocusSectionProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDemote: (id: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
}

export const FocusSection: React.FC<FocusSectionProps> = ({
  todos,
  onToggle,
  onDelete,
  onDemote,
  onUpdateTitle,
}) => {
  const completedCount = todos.filter((t) => t.status === 'completed').length;

  return (
    <section className="focus-section">
      <div className="focus-section-header">
        <h2 className="focus-section-title">오늘의 집중</h2>
        <p className="focus-section-desc">
          하루 <span className="highlight">{MAX_FOCUS_TASKS}가지</span>면 충분해요 ·{' '}
          <span>
            {completedCount} / {MAX_FOCUS_TASKS}
          </span>
        </p>
      </div>

      <div className="focus-list">
        {todos.length === 0 ? (
          <div className="focus-empty-box">
            오늘 가장 중요한 핵심 목표를 등록해 보세요.
          </div>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
              onDemote={onDemote}
              onUpdateTitle={onUpdateTitle}
            />
          ))
        )}
      </div>
    </section>
  );
};
