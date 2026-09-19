import React from 'react';
import progressCheckIcon from '../assets/figma/progress-check.svg';

interface HeaderProps {
  totalCount: number;
  completedCount: number;
}

export const Header: React.FC<HeaderProps> = ({ totalCount, completedCount }) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <header className="app-header">
      <div className="header-left">
        <span className="header-date">{formattedDate}</span>
        <h1 className="header-title">FocusFlow</h1>
      </div>

      <div className="header-right">
        <div className="progress-info">
          <img src={progressCheckIcon} alt="" className="progress-icon" />
          <span className="progress-text">
            {completedCount} / {totalCount} completed
          </span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </header>
  );
};
