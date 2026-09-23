import React, { useState } from 'react';
import { Moon, Sparkles } from 'lucide-react';
import type { ProgressStats } from '../../services/todoService';

interface SunsetReviewCardProps {
  stats: ProgressStats;
  initialReflection: string;
  isDayFinished: boolean;
  onSaveReflection: (text: string) => void;
}

export const SunsetReviewCard: React.FC<SunsetReviewCardProps> = ({
  stats,
  initialReflection,
  isDayFinished,
  onSaveReflection,
}) => {
  const [reflection, setReflection] = useState(initialReflection);
  const [showToast, setShowToast] = useState(false);

  const displayTotal = stats.total > 0 ? stats.total : 3;

  const handleFinishDay = () => {
    onSaveReflection(reflection);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <section className="sunset-card">
      <div className="sunset-header">
        <Moon size={18} className="sunset-moon-icon" />
        <span className="sunset-header-title">저녁 회고</span>
      </div>

      <p className="sunset-quote">
        오늘 {displayTotal}가지 중 {stats.completed}가지를 마쳤어요.{' '}
        <span className="sunset-quote-sub">
          남은 일은 내일의 나에게 맡겨도 괜찮아요.
        </span>
      </p>

      <div className="sunset-input-group">
        <label htmlFor="sunset-reflection" className="sunset-label">
          오늘 가장 마음에 남은 순간
        </label>
        <textarea
          id="sunset-reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="한 문장이면 충분해요"
          rows={3}
          className="sunset-textarea"
        />
      </div>

      <div className="sunset-footer">
        <span className="sunset-privacy-note">기록은 나에게만 보여요.</span>

        <button
          type="button"
          onClick={handleFinishDay}
          className="sunset-finish-btn"
        >
          {isDayFinished ? (
            <>
              <Sparkles size={15} />
              <span>기록 완료</span>
            </>
          ) : (
            <span>하루 마무리</span>
          )}
        </button>
      </div>

      {showToast && (
        <div className="sunset-toast-notice">
          오늘 하루도 정말 수고 많으셨어요! 편안한 저녁 보내세요 🌙
        </div>
      )}
    </section>
  );
};
