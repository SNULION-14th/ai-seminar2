import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, CheckCircle2 } from 'lucide-react';
import type { Todo } from '../types/todo';

interface ZenModalProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (id: string) => void;
}

const DEFAULT_POMODORO_SECONDS = 25 * 60; // 25분

export const ZenModal: React.FC<ZenModalProps> = ({
  todo,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_POMODORO_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !todo) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((DEFAULT_POMODORO_SECONDS - timeLeft) / DEFAULT_POMODORO_SECONDS) * 100;

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(DEFAULT_POMODORO_SECONDS);
  };

  const handleFinish = () => {
    onComplete(todo.id);
    onClose();
  };

  return (
    <div className="zen-overlay" role="dialog" aria-modal="true" aria-label="Zen Mode 몰입 화면">
      <div className="zen-container animate-scaleUp">
        <button
          type="button"
          className="zen-close-btn"
          onClick={onClose}
          aria-label="Zen Mode 닫기"
        >
          <X size={20} />
        </button>

        <div className="zen-badge">⚡ Zen Focus Mode</div>

        <h2 className="zen-task-title">{todo.title}</h2>
        {todo.tag && <span className="zen-tag">{todo.tag}</span>}

        {/* 뽀모도로 원형/타이머 디스플레이 */}
        <div className="zen-timer-wrapper">
          <div className="zen-timer-time">{formattedTime}</div>
          <div className="zen-progress-bar">
            <div
              className="zen-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 제어 컨트롤러 */}
        <div className="zen-controls">
          <button
            type="button"
            className="zen-ctrl-btn secondary"
            onClick={handleReset}
            title="타이머 리셋"
            aria-label="타이머 리셋"
          >
            <RotateCcw size={18} />
          </button>

          <button
            type="button"
            className="zen-ctrl-btn primary"
            onClick={() => setIsRunning(!isRunning)}
            aria-label={isRunning ? '일시정지' : '시작'}
          >
            {isRunning ? (
              <>
                <Pause size={20} />
                <span>일시정지</span>
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                <span>집중 시작</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="zen-ctrl-btn complete"
            onClick={handleFinish}
            title="태스크 완료"
            aria-label="태스크 완료"
          >
            <CheckCircle2 size={20} />
            <span>완료</span>
          </button>
        </div>
      </div>
    </div>
  );
};
