import React, { useState } from 'react';
import type { Todo } from '../../types/todo';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onToggleTodo: (id: string) => void;
  onToggleStar: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onEditTodo: (id: string, newTitle: string) => void;
  onReorderTodos: (sourceIndex: number, destinationIndex: number) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onToggleTodo,
  onToggleStar,
  onDeleteTodo,
  onEditTodo,
  onReorderTodos,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Set a subtle ghost image data or format
    try {
      e.dataTransfer.setData('text/plain', index.toString());
    } catch {
      // IE fallback if necessary
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onReorderTodos(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <section className="task-list-section">
      <div className="task-list-header">
        <h2 className="task-list-title">Today's tasks</h2>
        <span className="task-list-count">{todos.length} shown</span>
      </div>

      <div className="task-list-card">
        {todos.length === 0 ? (
          <div className="task-list-empty">
            <span className="empty-icon">🌿</span>
            <p>오늘 표시할 할 일이 없습니다.</p>
            <small>새로운 집중 목표를 등록해보세요!</small>
          </div>
        ) : (
          todos.map((todo, index) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              index={index}
              onToggleTodo={onToggleTodo}
              onToggleStar={onToggleStar}
              onDeleteTodo={onDeleteTodo}
              onEditTodo={onEditTodo}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
            />
          ))
        )}
      </div>
    </section>
  );
};
