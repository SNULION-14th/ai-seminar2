import React from 'react';
import type { ProgressStats } from '../../services/todoService';

interface ProgressCardProps {
  stats: ProgressStats;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ stats }) => {
  const displayTotal = stats.total > 0 ? stats.total : 3;

  const getEncouragement = () => {
    if (stats.completed === 0) {
      return '오늘의 첫 발을 떼어볼까요? 천천히 시작해요.';
    }
    if (stats.completed >= displayTotal) {
      return '오늘의 핵심 목표를 모두 달성했습니다! 🎉';
    }
    return '좋은 흐름이에요. 천천히 이어가요.';
  };

  return (
    <section className="flowdo-card progress-card">
      <div className="progress-card-header">
        <span className="progress-card-title">오늘의 진행</span>
        <span className="progress-card-pct-badge">{stats.percentage}%</span>
      </div>

      <div className="progress-card-numbers">
        <span className="progress-card-completed">{stats.completed}</span>
        <span className="progress-card-total">/ {displayTotal}</span>
      </div>

      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(100, stats.percentage)}%` }}
        />
      </div>

      <p className="progress-card-encouragement">{getEncouragement()}</p>
    </section>
  );
};
