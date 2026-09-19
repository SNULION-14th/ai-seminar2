import React from 'react';
import { FlameIcon, GearIcon, MoonIcon, SunIcon } from './Icons';

interface HeaderProps {
  streak: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  streak,
  darkMode,
  onToggleDarkMode,
  onOpenSettings,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <span className="header-date">SATURDAY, SEP 19</span>
        <h1 className="header-title">One step at a time.</h1>
      </div>
      <div className="header-actions">
        <div className="streak-badge" title={`${streak} day streak!`}>
          <FlameIcon size={16} />
          <span className="streak-count">{streak}</span>
          <span className="streak-label">day streak</span>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Settings"
          onClick={onOpenSettings}
          title="Settings"
        >
          <GearIcon size={18} />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Toggle dark mode"
          onClick={onToggleDarkMode}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </div>
    </header>
  );
};
