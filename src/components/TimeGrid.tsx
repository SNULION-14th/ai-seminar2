import React from 'react';
import type { TimeGridProps } from '../types';
import { DAYS, HOURS } from '../constants';
import { TimeSlotCell } from './TimeSlotCell';

export const TimeGrid: React.FC<TimeGridProps> = ({
  votes,
  mySelected,
  bestSlot,
  onSlotClick,
}) => {
  return (
    <section className="syncstudy-grid-card" aria-label="시간대별 투표 그리드">
      <div className="grid-card-header">
        <h2 className="grid-card-title">시간대별 투표</h2>
        <div className="grid-legend" aria-label="범례">
          <div className="legend-item">
            <div className="legend-gradient-chips" aria-hidden="true">
              <span className="chip chip-1" />
              <span className="chip chip-2" />
              <span className="chip chip-3" />
              <span className="chip chip-4" />
            </div>
            <span className="legend-text">득표 많을수록 진하게</span>
          </div>

          <div className="legend-item">
            <span className="chip chip-best" aria-hidden="true" />
            <span className="legend-text">1위</span>
          </div>

          <div className="legend-item">
            <span className="chip chip-selected" aria-hidden="true" />
            <span className="legend-text">내 선택</span>
          </div>
        </div>
      </div>

      <div className="syncstudy-grid-container" tabIndex={0} aria-label="스터디 시간대 투표 표">
        <table className="syncstudy-table">
          <thead>
            <tr>
              <th className="time-header-corner" scope="col">
                <span className="sr-only">시간</span>
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className={`day-header ${day === '토' || day === '일' ? 'weekend' : ''}`}
                  scope="col"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
          {HOURS.map((hour) => {
            const timeLabel = `${String(hour).padStart(2, '0')}:00`;
            return (
              <tr key={hour}>
                <th className="hour-label" scope="row">
                  {timeLabel}
                </th>
                {DAYS.map((day) => {
                  const slotKey = `${day}-${hour}`;
                  const count = votes[slotKey] || 0;
                  const isSelected = mySelected.includes(slotKey);
                  const isBest = bestSlot?.key === slotKey;

                  return (
                    <td key={slotKey} className="slot-td">
                      <TimeSlotCell
                        day={day}
                        hour={hour}
                        count={count}
                        isSelected={isSelected}
                        isBest={isBest}
                        onClick={() => onSlotClick(slotKey)}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </section>
  );
};
