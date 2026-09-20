import React, { useState } from 'react';

interface NudgeBannerProps {
  activeCount: number;
}

export const NudgeBanner: React.FC<NudgeBannerProps> = ({ activeCount }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="nudge-banner" role="status" aria-live="polite">
      <div className="nudge-content">
        <span className="nudge-icon">💡</span>
        <div className="nudge-text">
          <span className="nudge-title">오늘 진행할 일이 {activeCount}개 쌓여있어요.</span>
          <span className="nudge-desc">오늘 정말 다 할 수 있나요? ⭐️ 별표로 핵심 3가지에 먼저 집중해보세요.</span>
        </div>
      </div>
      <button
        type="button"
        className="nudge-dismiss-btn"
        onClick={() => setIsDismissed(true)}
        aria-label="안내 닫기"
      >
        ✕
      </button>
    </div>
  );
};
