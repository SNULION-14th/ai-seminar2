import React, { useState } from 'react';
import type { ChatRoom, UserSettings } from '../../../types/chat';
import { ChatListItem } from './ChatListItem';
import { Moon, Plus, Search, ShieldCheck } from 'lucide-react';

interface ChatListViewProps {
  rooms: ChatRoom[];
  settings: UserSettings;
  onSelectRoom: (roomId: string) => void;
  onOpenNewChat: () => void;
  onToggleFocusMode: () => void;
}

export const ChatListView: React.FC<ChatListViewProps> = ({
  rooms,
  settings,
  onSelectRoom,
  onOpenNewChat,
  onToggleFocusMode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRooms = rooms
    .filter((room) =>
      room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Pinned rooms first
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      // Then latest message
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Header */}
      <header className="app-header">
        <div className="header-title-group">
          <h1>PureChat</h1>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '2px 6px',
              borderRadius: '9999px',
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            Zero-Bloat
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className={`icon-btn ${settings.focusMode ? 'active' : ''}`}
            onClick={onToggleFocusMode}
            title={settings.focusMode ? '포커스 모드 해제' : '포커스 모드 켜기 (방해금지)'}
            aria-label="포커스 모드 토글"
            style={{
              backgroundColor: settings.focusMode ? 'var(--focus-bg)' : undefined,
              color: settings.focusMode ? 'var(--focus-accent)' : undefined,
            }}
          >
            <Moon size={20} />
          </button>

          <button
            className="icon-btn"
            onClick={onOpenNewChat}
            title="새 대화 시작"
            aria-label="새 대화 시작"
          >
            <Plus size={22} />
          </button>
        </div>
      </header>

      {/* Search Input Bar */}
      <div style={{ padding: '8px 16px 4px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 12px',
          }}
        >
          <Search size={16} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="대화방 및 메시지 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Chat Rooms Scroll List */}
      <main className="chat-list">
        {filteredRooms.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: 'var(--text-muted)',
            }}
          >
            <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>검색 결과가 없습니다.</p>
            <button
              onClick={onOpenNewChat}
              style={{
                fontSize: '0.82rem',
                color: 'var(--focus-accent)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              새 대화 시작하기 →
            </button>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <ChatListItem
              key={room.id}
              room={room}
              onClick={() => onSelectRoom(room.id)}
            />
          ))
        )}
      </main>

      {/* Privacy Banner Notice */}
      <footer
        style={{
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '0.72rem',
          color: 'var(--text-dim)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <ShieldCheck size={14} color="#10b981" />
        <span>단말 간 종단 암호화(E2EE) • 광고 및 추적 없음</span>
      </footer>
    </div>
  );
};
