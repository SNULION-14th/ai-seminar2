import React from 'react';
import type { ChatRoom } from '../../../types/chat';
import { Avatar } from '../../../components/common/Avatar';
import { Pin } from 'lucide-react';

interface ChatListItemProps {
  room: ChatRoom;
  onClick: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({ room, onClick }) => {
  // 상대방 프로필 찾기 (1:1인 경우 상대방)
  const otherUser = room.participants.find((p) => !p.isCurrentUser) || room.participants[0];

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (diffHours < 48) {
      return '어제';
    }
    return `${Math.floor(diffHours / 24)}일 전`;
  };

  return (
    <div className="chat-item" onClick={onClick} role="button" tabIndex={0}>
      <Avatar
        src={otherUser?.avatarUrl}
        name={room.title}
        status={!room.isGroup ? otherUser?.status : undefined}
      />

      <div className="chat-item-content">
        <div className="chat-item-header">
          <div className="chat-item-name">
            {room.isPinned && <Pin size={12} color="#8b5cf6" style={{ transform: 'rotate(45deg)' }} />}
            <span>{room.title}</span>
            {room.ephemeralHours && room.ephemeralHours > 0 ? (
              <span title="클린챗 24시간 모드" style={{ fontSize: '0.75rem' }}>🌿</span>
            ) : null}
          </div>
          <span className="chat-item-time">
            {formatTime(room.lastMessage?.createdAt)}
          </span>
        </div>

        <div className="chat-item-footer">
          <p className="chat-item-preview">
            {room.lastMessage?.content || '대화가 없습니다.'}
          </p>
          {room.unreadCount > 0 && (
            <span className="chat-item-badge">{room.unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
};
