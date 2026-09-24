import React, { useState } from 'react';
import type { Message, User } from '../../../types/chat';
import { ReactionPicker } from './ReactionPicker';
import { SmilePlus, Moon, Leaf } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  sender?: User;
  isCurrentUser: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  sender,
  isCurrentUser,
  onToggleReaction,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className={`message-row ${isCurrentUser ? 'outgoing' : 'incoming'}`}>
      {!isCurrentUser && sender && (
        <span className="message-sender">{sender.nickname}</span>
      )}

      {showPicker && (
        <ReactionPicker
          onSelectReaction={(emoji) => onToggleReaction(message.id, emoji)}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div className="message-bubble-wrapper">
        <div
          className="message-bubble"
          onDoubleClick={() => setShowPicker(!showPicker)}
          title="더블클릭하여 리액션 남기기"
        >
          {message.content}

          {message.isSilent && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.68rem',
                opacity: 0.8,
                marginLeft: '6px',
              }}
            >
              <Moon size={10} /> 조용히 전송됨
            </span>
          )}

          {message.expiresAt && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.68rem',
                opacity: 0.8,
                marginLeft: '6px',
              }}
              title="클린챗: 24시간 후 자동 소멸"
            >
              <Leaf size={10} />
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isCurrentUser ? 'flex-end' : 'flex-start', gap: '2px' }}>
          <span className="message-meta">{formatTime(message.createdAt)}</span>
          <button
            className="icon-btn"
            style={{ width: '22px', height: '22px', padding: 0 }}
            onClick={() => setShowPicker(!showPicker)}
            title="리액션 추가"
            aria-label="리액션 추가"
          >
            <SmilePlus size={13} color="var(--text-dim)" />
          </button>
        </div>
      </div>

      {message.reactions && message.reactions.length > 0 && (
        <div className="reaction-tags">
          {message.reactions.map((r) => {
            const hasReacted = r.users.includes('user_me');
            return (
              <button
                key={r.emoji}
                className={`reaction-tag ${hasReacted ? 'reacted' : ''}`}
                onClick={() => onToggleReaction(message.id, r.emoji)}
                title={`${r.count}명이 반응함`}
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
