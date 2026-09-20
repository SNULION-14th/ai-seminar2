import React, { useState, useRef, useEffect } from 'react';
import type { Todo } from '../../types/todo';
import checkboxChecked from '../../assets/figma/checkbox-checked.svg';
import taskActionIcon from '../../assets/figma/task-action.svg';
import inputActionIcon from '../../assets/figma/input-action.svg';

interface TodoItemProps {
  todo: Todo;
  index: number;
  onToggleTodo: (id: string) => void;
  onToggleStar: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onEditTodo: (id: string, newTitle: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  index,
  onToggleTodo,
  onToggleStar,
  onDeleteTodo,
  onEditTodo,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(todo.title);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleEditSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== todo.title) {
      onEditTodo(todo.id, trimmed);
    } else {
      setEditValue(todo.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(todo.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`task-row ${todo.completed ? 'completed' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* Drag Handle (subtle dots icon) */}
      <div className="drag-handle" title="드래그하여 순서 변경">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>

      {/* Checkbox */}
      <button
        type="button"
        className={`task-checkbox ${todo.completed ? 'checked' : ''}`}
        onClick={() => onToggleTodo(todo.id)}
        aria-label={todo.completed ? '완료 취소' : '할 일 완료'}
      >
        {todo.completed ? (
          <img src={checkboxChecked} alt="Completed" width="20" height="20" />
        ) : (
          <div className="checkbox-unchecked" />
        )}
      </button>

      {/* Task Content / Double Click Inline Edit */}
      <div className="task-content">
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            className="task-edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleKeyDown}
            aria-label="Edit task title"
          />
        ) : (
          <span
            className="task-title"
            onDoubleClick={() => setIsEditing(true)}
            title="더블클릭하여 텍스트 수정"
          >
            {todo.title}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="task-actions">
        {/* Star / Pin Button */}
        <button
          type="button"
          className={`task-star-btn ${todo.starred ? 'starred' : 'unstarred'}`}
          onClick={() => onToggleStar(todo.id)}
          title={todo.starred ? '우선순위 고정 해제' : '상단 고정 (우선순위)'}
          aria-label={todo.starred ? 'Starred todo' : 'Star todo'}
        >
          <img
            src={todo.starred ? taskActionIcon : inputActionIcon}
            alt={todo.starred ? 'Starred' : 'Unstarred'}
            width="18"
            height="18"
          />
        </button>

        {/* Delete Button (shown on row hover) */}
        <button
          type="button"
          className="task-delete-btn"
          onClick={() => onDeleteTodo(todo.id)}
          title="할 일 삭제"
          aria-label="Delete todo"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
};
