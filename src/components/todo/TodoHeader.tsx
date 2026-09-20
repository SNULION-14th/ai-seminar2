import React from 'react';
import type { ThemeMode, TodoStats } from '../../types/todo';
import { formatToday } from '../../utils/date';
import dateIcon from '../../assets/figma/date-icon.svg';
import logoIcon from '../../assets/figma/logo-icon.svg';

interface TodoHeaderProps {
  stats: TodoStats;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const TodoHeader: React.FC<TodoHeaderProps> = ({
  stats,
  theme,
  onToggleTheme,
}) => {
  const todayFormatted = formatToday();

  return (
    <header className="dashboard-header">
      <div className="header-left">
        {/* Date Row */}
        <div className="header-date">
          <img src={dateIcon} alt="Calendar" className="date-icon" width="16" height="16" />
          <span>{todayFormatted}</span>
        </div>

        {/* Brand & Subtitle */}
        <div className="header-brand">
          <div className="brand-logo-wrapper">
            <img src={logoIcon} alt="FocusFlow Logo" className="brand-logo" width="40" height="40" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">FocusFlow</h1>
            <p className="brand-subtitle">A calmer way to move your day forward.</p>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Real-time Progress Bar */}
        <div className="progress-container">
          <div className="progress-labels">
            <span className="progress-percent">{stats.percentage}% complete</span>
            <span className="progress-fraction">
              {stats.completed}/{stats.total} done
            </span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={stats.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Task completion progress"
          >
            <div
              className="progress-fill"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="theme-toggle-btn"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          aria-label="Toggle theme mode"
        >
          {theme === 'light' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};
