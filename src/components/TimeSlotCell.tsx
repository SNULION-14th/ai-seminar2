import React from 'react';
import type { TimeSlotCellProps } from '../types';
import crownIcon from '../assets/crown-icon.svg';

export const TimeSlotCell: React.FC<TimeSlotCellProps> = ({
  day,
  hour,
  count,
  isSelected,
  isBest,
  onClick,
}) => {
  const formattedHour = `${String(hour).padStart(2, '0')}:00`;
  const ariaLabel = `${day}요일 ${formattedHour}, ${count}표${isSelected ? ', 내 선택' : ''}${isBest && count > 0 ? ', 최다 득표 1위' : ''}`;

  // 득표수에 따른 레벨 (Figma 색상 매핑)
  let countTier = 'zero';
  if (count >= 5) {
    countTier = 'tier-3';
  } else if (count >= 3) {
    countTier = 'tier-2';
  } else if (count >= 1) {
    countTier = 'tier-1';
  }

  const showCrown = isBest && count > 0;

  return (
    <button
      type="button"
      className={`time-slot-cell ${countTier} ${showCrown ? 'is-best' : ''} ${isSelected ? 'is-selected' : ''}`}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
    >
      {showCrown && (
        <img src={crownIcon} alt="" width={12} height={12} className="cell-crown-icon" />
      )}
      <span className="cell-count-text">{count}</span>
    </button>
  );
};
