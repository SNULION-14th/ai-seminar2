import React, { useState } from 'react';
import { ArrowUpIcon, TargetIcon } from './Icons';

interface TaskInputProps {
  onAddTask: (title: string, asFocus: boolean) => void;
  canAddFocus: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({
  onAddTask,
  canAddFocus,
}) => {
  const [text, setText] = useState('');
  const [isFocus, setIsFocus] = useState(canAddFocus);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    onAddTask(trimmed, isFocus && canAddFocus);
    setText('');
  };

  return (
    <form className="task-input-container" onSubmit={handleSubmit}>
      <input
        type="text"
        className="task-input-field"
        placeholder="Add a task for today…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        type="button"
        className={`focus-toggle-btn ${isFocus && canAddFocus ? 'active' : ''}`}
        onClick={() => {
          if (canAddFocus || isFocus) {
            setIsFocus(!isFocus);
          }
        }}
        title={
          canAddFocus
            ? isFocus
              ? 'Marking as Focus task (max 3)'
              : 'Add as regular task'
            : 'Focus list full (max 3)'
        }
        aria-label="Toggle focus task status"
      >
        <TargetIcon
          size={18}
          color={isFocus && canAddFocus ? '#4F46E5' : '#94A3B8'}
        />
      </button>

      <button
        type="submit"
        className="task-submit-btn"
        disabled={!text.trim()}
        aria-label="Add task"
      >
        <ArrowUpIcon size={18} />
      </button>
    </form>
  );
};
