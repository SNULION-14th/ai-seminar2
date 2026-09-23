import React from 'react';
import type { BestSlotBannerProps } from '../types';
import trophyIcon from '../assets/trophy-icon.svg';

export const BestSlotBanner: React.FC<BestSlotBannerProps> = ({ bestSlot, totalVotes = 0 }) => {
  const hasBest = Boolean(bestSlot && bestSlot.count > 0);

  const formattedTime = bestSlot
    ? `${bestSlot.day}요일 ${String(bestSlot.hour).padStart(2, '0')}:00 – ${String(bestSlot.hour + 1).padStart(2, '0')}:00`
    : '';

  return (
    <section className="syncstudy-banner" aria-label="최다 득표 시간대 안내">
      <div className="banner-left">
        <div className={`banner-icon-wrap ${hasBest ? '' : 'is-empty'}`}>
          <img src={trophyIcon} alt="" width={48} height={48} className="banner-trophy-img" />
        </div>
        <div className="banner-slot-info">
          <span className="banner-label">현재 최다 득표 시간대</span>
          <h2 className="banner-title">
            {hasBest ? formattedTime : '원하는 시간을 클릭하여 투표를 시작하세요'}
          </h2>
        </div>
      </div>

      <div className="banner-stats">
        <div className="banner-stat-group">
          <span className="stat-label">득표</span>
          <div className="stat-value-wrap">
            <span className="stat-value highlight">{hasBest ? bestSlot?.count : 0}</span>
            <span className="stat-unit highlight">표</span>
          </div>
        </div>
        <div className="banner-stat-divider" aria-hidden="true" />
        <div className="banner-stat-group">
          <span className="stat-label">전체 투표</span>
          <div className="stat-value-wrap">
            <span className="stat-value">{totalVotes}</span>
            <span className="stat-unit">표</span>
          </div>
        </div>
      </div>
    </section>
  );
};
