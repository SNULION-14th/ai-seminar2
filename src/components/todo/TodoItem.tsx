import React, { useState, useRef, useEffect } from 'react';
import { Check, Archive, Trash2 } from 'lucide-react';
import type { Todo } from '../../types/todo';
import { PriorityBadge } from '../common/PriorityBadge';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDemote: (id: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onDemote,
  onUpdateTitle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const editInputRef = useRef<HTMLInputElement>(null);

  const isCompleted = todo.status === 'completed';

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditing]);

  const handleSaveTitle = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== todo.title) {
      onUpdateTitle(todo.id, trimmed);
    } else {
      setEditTitle(todo.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitle(todo.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`todo-item-card ${isCompleted ? 'is-completed' : ''}`}
    >
      <div className="todo-item-main">
        <button
          type="button"
          onClick={() => onToggle(todo.id)}
          aria-label={isCompleted ? '완료 취소' : '할 일 완료'}
          className={`todo-checkbox-btn ${isCompleted ? 'is-checked' : ''}`}
        >
          {isCompleted && <Check size={16} strokeWidth={3} />}
        </button>

        <div className="todo-item-content">
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              className="todo-edit-input"
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditing(true)}
              title="더블클릭하여 제목 수정"
              className="todo-item-title"
            >
              {todo.title}
            </span>
          )}
        </div>
      </div>

      <div className="todo-item-actions">
        <PriorityBadge priority={todo.priority} />

        <button
          type="button"
          onClick={() => onDemote(todo.id)}
          title="보관함으로 옮기기"
          aria-label={`${todo.title} 보관함으로 옮기기`}
          className="todo-action-icon-btn"
        >
          <Archive size={16} />
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
};
