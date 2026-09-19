import React from 'react';

interface ProgressBarProps {
  completedCount: number;
  totalCount: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ completedCount, totalCount }) => {
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <section className="progress-section" aria-label="오늘의 진행률">
      <div className="progress-header">
        <span className="progress-title">오늘의 진척</span>
        <span className="progress-status">
          {percentage}% 완료 ({completedCount}/{totalCount})
        </span>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </section>
  );
};
