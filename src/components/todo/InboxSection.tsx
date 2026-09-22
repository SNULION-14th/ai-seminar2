import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUp, Trash2 } from 'lucide-react';
import type { Todo, Priority } from '../../types/todo';

interface InboxSectionProps {
  todos: Todo[];
  onPromote: (id: string) => boolean;
  onDelete: (id: string) => void;
  isFocusFull: boolean;
}

const PRIORITY_DOT_COLORS: Record<Priority, string> = {
  high: '#c9603f',
  normal: '#5b54e8',
  low: '#3f9a6e',
};

export const InboxSection: React.FC<InboxSectionProps> = ({
  todos,
  onPromote,
  onDelete,
  isFocusFull,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [promoteWarning, setPromoteWarning] = useState<string | null>(null);

  const handlePromote = (id: string) => {
    const success = onPromote(id);
    if (!success) {
      setPromoteWarning('오늘의 집중 슬롯(3개)이 이미 가득 찼습니다.');
      setTimeout(() => setPromoteWarning(null), 2500);
    }
  };

  return (
    <section className="flowdo-card inbox-card">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inbox-header-btn"
        aria-expanded={isOpen}
      >
        <div className="inbox-header-title-wrap">
          <span className="inbox-title">보관함</span>
          <span className="inbox-count-badge">
            {todos.length}개 · 급하지 않은 일
          </span>
        </div>

        <div className="inbox-toggle-icon">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {promoteWarning && (
        <div className="inbox-warning-alert">
          <span>{promoteWarning}</span>
        </div>
      )}

      {isOpen && (
        <div className="inbox-content-list">
          {todos.length === 0 ? (
            <div className="inbox-empty-notice">
              보관함이 비어 있습니다.
            </div>
          ) : (
            todos.map((todo) => {
              const dotColor = PRIORITY_DOT_COLORS[todo.priority] ?? '#5b54e8';
              return (
                <div key={todo.id} className="inbox-item-row">
                  <div className="inbox-item-left">
                    <span
                      className="inbox-item-dot"
                      style={{ backgroundColor: dotColor }}
                      aria-hidden="true"
                    />
                    <span className="inbox-item-title">
                      {todo.title}
                    </span>
                  </div>

                  <div className="inbox-item-actions">
                    <button
                      type="button"
                      onClick={() => handlePromote(todo.id)}
                      title={isFocusFull ? '오늘의 집중 슬롯이 찼습니다' : '오늘 집중할 일로 승격'}
                      className="inbox-promote-btn"
                    >
                      <ArrowUp size={14} strokeWidth={2.5} />
                      <span>오늘로</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(todo.id)}
                      title="삭제"
                      aria-label={`${todo.title} 삭제`}
                      className="todo-action-icon-btn is-delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
};
