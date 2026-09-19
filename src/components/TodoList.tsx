import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';
import type { Todo } from '../types/todo';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  todayTodos: Todo[];
  laterTodos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSetFocus: (id: string) => void;
  onMoveToToday: (id: string) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todayTodos,
  laterTodos,
  onToggle,
  onDelete,
  onSetFocus,
  onMoveToToday,
}) => {
  const [isLaterExpanded, setIsLaterExpanded] = useState(false);

  return (
    <div className="todo-lists-container">
      {/* Today Section */}
      <section className="today-section" aria-label="오늘 할 일 목록">
        <div className="today-header">
          <h2 className="today-title">Today</h2>
          <span className="today-hint">왼쪽으로 밀어 삭제</span>
        </div>

        <div className="today-list">
          {todayTodos.length === 0 ? (
            <div className="empty-state">오늘 예정된 할 일이 없습니다 🎉</div>
          ) : (
            todayTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onDelete={onDelete}
                onSetFocus={onSetFocus}
              />
            ))
          )}
        </div>
      </section>

      {/* Later Section (Accordion) */}
      <section className="later-section" aria-label="나중에 할 일 목록">
        <button
          type="button"
          className="later-accordion-btn"
          onClick={() => setIsLaterExpanded((prev) => !prev)}
          aria-expanded={isLaterExpanded}
        >
          <span className="later-title">Later ({laterTodos.length})</span>
          {isLaterExpanded ? (
            <ChevronUp size={18} className="later-chevron" />
          ) : (
            <ChevronDown size={18} className="later-chevron" />
          )}
        </button>

        {isLaterExpanded && (
          <div className="later-list animate-fadeIn">
            {laterTodos.length === 0 ? (
              <div className="empty-state-later">보관함이 비어 있습니다.</div>
            ) : (
              laterTodos.map((todo) => (
                <div key={todo.id} className="later-item-row">
                  <TodoItem
                    todo={todo}
                    onToggle={onToggle}
                    onDelete={onDelete}
                  />
                  <button
                    type="button"
                    className="move-today-btn"
                    onClick={() => onMoveToToday(todo.id)}
                    title="오늘 할 일로 이동"
                  >
                    <ArrowUpRight size={14} />
                    <span>오늘 하기</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};
