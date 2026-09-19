import React from 'react';
import { Calendar } from 'lucide-react';

interface HeaderProps {
  customDate?: string;
}

export const Header: React.FC<HeaderProps> = ({ customDate }) => {
  // 오늘 날짜 계산 (기본값: '9월 18일, 금요일' 또는 현재 날짜)
  const displayDate = customDate || (() => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayName = days[today.getDay()];
    return `${month}월 ${date}일, ${dayName}`;
  })();

  return (
    <header className="app-header">
      <div className="header-titles">
        <span className="header-subtitle">오늘, 당신의 흐름</span>
        <h1 className="header-logo">FocusFlow</h1>
      </div>
      <div className="header-date-badge" aria-label="오늘 날짜">
        <Calendar className="date-icon" size={14} />
        <span className="date-text">{displayDate}</span>
      </div>
    </header>
  );
};
