import React from 'react';

interface BannerProps {
  isAllCompleted: boolean;
}

export const Banner: React.FC<BannerProps> = ({ isAllCompleted }) => {
  if (!isAllCompleted) {
    return null;
  }

  return (
    <div className="status-banner">
      <div className="banner-title">All done for today! 🎉</div>
      <div className="banner-description">
        Every focus task is checked off. Rest or get ahead — your call.
      </div>
    </div>
  );
};
