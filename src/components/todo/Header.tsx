import React from 'react';
import { formatFullKoreanDate } from '../../utils/dateUtils';
import type { ProgressStats } from '../../services/todoService';

interface HeaderProps {
  stats: ProgressStats;
}

export const Header: React.FC<HeaderProps> = ({ stats }) => {
  const dateStr = formatFullKoreanDate();
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * stats.percentage) / 100;
  const displayTotal = stats.total > 0 ? stats.total : 3;

  return (
    <header className="flowdo-header">
      <div className="flowdo-header-left">
        <h1 className="flowdo-logo">FlowDo</h1>
        <div className="flowdo-header-divider" aria-hidden="true" />
        <span className="flowdo-date">{dateStr}</span>
      </div>

      <div className="flowdo-header-right">
        <div className="flowdo-header-summary">
          <span className="flowdo-header-count">
            {stats.completed} / {displayTotal} 완료
          </span>
          <span className="flowdo-header-sub">오늘의 집중</span>
        </div>

        <div className="flowdo-header-circle">
          <svg className="flowdo-circle-svg" viewBox="0 0 34 34">
            <circle
              cx="17"
              cy="17"
              r={radius}
              className="flowdo-circle-bg"
            />
            <circle
              cx="17"
              cy="17"
              r={radius}
              className="flowdo-circle-bar"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: isNaN(strokeDashoffset) ? circumference : strokeDashoffset,
              }}
            />
          </svg>
        </div>
      </div>
    </header>
  );
};
