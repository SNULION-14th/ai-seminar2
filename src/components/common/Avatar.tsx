import React from 'react';
import type { UserStatus } from '../../types/chat';
import { Moon } from 'lucide-react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  status?: UserStatus;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 48, status }) => {
  const initials = name.slice(0, 1).toUpperCase();

  return (
    <div className="avatar-wrapper" style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="avatar-img"
          style={{ width: size, height: size }}
          loading="lazy"
        />
      ) : (
        <div
          className="avatar-img"
          style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: size * 0.4,
            backgroundColor: '#e2e8f0',
            color: '#475569',
          }}
        >
          {initials}
        </div>
      )}

      {status && (
        <span
          className={`status-dot ${status}`}
          title={`상태: ${status === 'online' ? '온라인' : status === 'focus' ? '포커스 모드' : '오프라인'}`}
        >
          {status === 'focus' && (
            <Moon size={8} color="#ffffff" strokeWidth={3} />
          )}
        </span>
      )}
    </div>
  );
};
