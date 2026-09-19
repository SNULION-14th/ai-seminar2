import React from 'react';

interface ProgressCardProps {
  completedCount: number;
  totalCount: number;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  completedCount,
  totalCount,
}) => {
  const percentage =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="progress-card">
      <div className="progress-header">
        <span className="progress-title">
          {completedCount} of {totalCount} Focus tasks done
        </span>
        <span className="progress-percentage">{percentage}%</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};
