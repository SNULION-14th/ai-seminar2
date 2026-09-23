import React from 'react';
import type { HeaderProps } from '../types';
import logoIcon from '../assets/syncstudy-logo.svg';
import resetIcon from '../assets/reset-icon.svg';

export const Header: React.FC<HeaderProps> = ({ studyName, onReset }) => {
  return (
    <header className="syncstudy-header">
      <div className="syncstudy-header-left">
        <div className="syncstudy-brand">
          <img src={logoIcon} alt="" className="syncstudy-brand-logo" width={16} height={16} />
          <span className="syncstudy-brand-name">SyncStudy</span>
        </div>
        <h1 className="syncstudy-title">{studyName}</h1>
        <p className="syncstudy-subtitle">참여 가능한 시간을 모두 눌러주세요. 다시 누르면 취소됩니다.</p>
      </div>
      <button
        type="button"
        className="syncstudy-reset-btn"
        onClick={onReset}
        title="모든 시간대 투표 및 선택 상태를 초기화합니다"
      >
        <img src={resetIcon} alt="" className="reset-icon" width={16} height={16} />
        <span>전체 초기화</span>
      </button>
    </header>
  );
};
