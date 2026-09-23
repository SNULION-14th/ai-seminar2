import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { Priority } from '../../types/todo';

interface TaskInputProps {
  onAdd: (title: string, priority: Priority) => void;
  isFocusFull: boolean;
}

const PRIORITIES: { key: Priority; label: string; dotColor: string }[] = [
  { key: 'high', label: '높음', dotColor: '#c9603f' },
  { key: 'normal', label: '보통', dotColor: '#5b54e8' },
  { key: 'low', label: '낮음', dotColor: '#3f9a6e' },
];

export const TaskInput: React.FC<TaskInputProps> = ({ onAdd, isFocusFull }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, priority);
    setText('');
  };

  return (
    <section className="flowdo-card task-input-card">
      <form onSubmit={handleSubmit} className="task-input-form">
        <div className="task-input-row">
          <div className="task-input-field-wrap">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="오늘 할 일을 빠르게 추가하세요"
              className="task-input-field"
            />
          </div>

          <div className="task-input-controls">
            <div className="priority-selector-group">
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriority(p.key)}
                    className={`priority-select-btn ${isSelected ? 'is-selected' : ''}`}
                  >
                    <span
                      className="priority-select-dot"
                      style={{ backgroundColor: p.dotColor }}
                      aria-hidden="true"
                    />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={!text.trim()}
              className="flowdo-btn-add"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>추가</span>
            </button>
          </div>
        </div>

        <div className="task-input-hint">
          {isFocusFull ? (
            <span className="task-input-hint-full">
              오늘의 집중이 가득 찼어요. 새 할 일은 보관함으로 갑니다.
            </span>
          ) : (
            <span className="task-input-hint-normal">
              단축키 <kbd className="hint-kbd">/</kbd> 로 빠른 입력 · <kbd className="hint-kbd">!</kbd> 로 높은 중요도 자동 지정
            </span>
          )}
        </div>
      </form>
    </section>
  );
};
