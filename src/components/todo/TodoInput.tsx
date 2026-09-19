import React, { useState, useRef, useEffect } from 'react';
import inputIcon from '../../assets/figma/input-icon.svg';
import inputActionIcon from '../../assets/figma/input-action.svg';
import taskActionIcon from '../../assets/figma/task-action.svg';

interface TodoInputProps {
  onAddTodo: (title: string, starred: boolean) => void;
}

export const TodoInput: React.FC<TodoInputProps> = ({ onAddTodo }) => {
  const [title, setTitle] = useState('');
  const [starred, setStarred] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Zero-Click Focus: automatically focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    onAddTodo(trimmed, starred);
    setTitle('');
    setStarred(false);

    // Maintain focus for continuous keyboard entry
    inputRef.current?.focus();
  };

  return (
    <form className="task-input-form" onSubmit={handleSubmit}>
      <div className="task-input-wrapper">
        <div className="task-input-icon-left">
          <img src={inputIcon} alt="Add" width="20" height="20" />
        </div>

        <input
          ref={inputRef}
          type="text"
          className="task-input-field"
          placeholder="What needs to be done today?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="New todo input"
        />

        <div className="task-input-actions-right">
          <button
            type="button"
            className={`star-toggle-btn ${starred ? 'active' : ''}`}
            onClick={() => setStarred(!starred)}
            title={starred ? '우선순위 설정 해제' : '우선순위(별표) 설정'}
            aria-label="Toggle priority"
          >
            <img
              src={starred ? taskActionIcon : inputActionIcon}
              alt="Star priority"
              width="18"
              height="18"
            />
          </button>

          <button
            type="submit"
            className="kbd-badge"
            disabled={!title.trim()}
            title="Enter 키를 눌러 할 일 등록"
          >
            <span>Enter ↵</span>
          </button>
        </div>
      </div>
    </form>
  );
};
