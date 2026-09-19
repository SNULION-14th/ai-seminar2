import React, { useState, useRef } from 'react';
import { Check, Trash2, Star } from 'lucide-react';
import type { Todo } from '../types/todo';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSetFocus?: (id: string) => void;
  onMoveSection?: (id: string, targetSection: 'today' | 'later') => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onSetFocus,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const isSwiping = useRef(false);

  // 모바일 터치 스와이프 제스처
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    if (diff < 0) {
      // 왼쪽으로만 밀 수 있음 (최대 -92px)
      setTranslateX(Math.max(diff, -92));
    } else {
      setTranslateX(0);
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    isSwiping.current = false;
    if (translateX < -50) {
      // 절반 이상 밀었으면 열어두기
      setTranslateX(-80);
    } else {
      setTranslateX(0);
    }
  };

  return (
    <div className="todo-item-wrapper">
      {/* 배경 삭제 액션 (Figma swipe-to-delete layer) */}
      <div
        className="swipe-delete-background"
        onClick={() => onDelete(todo.id)}
        aria-label="삭제"
      >
        <Trash2 size={20} className="swipe-delete-icon" />
      </div>

      {/* 카드 전면부 */}
      <div
        className={`todo-card ${todo.completed ? 'completed' : ''}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="todo-content-left">
          <button
            type="button"
            className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
            onClick={() => onToggle(todo.id)}
            aria-label={todo.completed ? '할 일 완료 취소' : '할 일 완료'}
          >
            {todo.completed && <Check size={13} className="todo-check-icon" />}
          </button>

          <span
            className={`todo-title ${todo.completed ? 'line-through' : ''}`}
            onClick={() => onToggle(todo.id)}
          >
            {todo.title}
          </span>
        </div>

        <div className="todo-content-right">
          {todo.tag && <span className="todo-tag">{todo.tag}</span>}

          {/* 데스크톱 호버 액션 버튼들 */}
          <div className="desktop-actions">
            {onSetFocus && !todo.isFocus && (
              <button
                type="button"
                className="action-btn focus-star-btn"
                onClick={() => onSetFocus(todo.id)}
                title="오늘의 1순위로 지정"
                aria-label="오늘의 1순위로 지정"
              >
                <Star size={15} />
              </button>
            )}
            <button
              type="button"
              className="action-btn delete-btn"
              onClick={() => onDelete(todo.id)}
              title="삭제"
              aria-label="삭제"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
