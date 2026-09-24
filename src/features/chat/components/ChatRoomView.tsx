import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Leaf, Moon, Send } from 'lucide-react';
import { Avatar } from '../../../components/common/Avatar';
import type { ChatRoom, Message, UserSettings } from '../../../types/chat';
import { MessageBubble } from './MessageBubble';

interface ChatRoomViewProps {
  room: ChatRoom;
  messages: Message[];
  settings: UserSettings;
  onBack: () => void;
  onSend: (content: string, isSilent: boolean) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
}

export const ChatRoomView = ({
  room,
  messages,
  settings,
  onBack,
  onSend,
  onToggleReaction,
}: ChatRoomViewProps) => {
  const [draft, setDraft] = useState('');
  const [sendSilently, setSendSilently] = useState(settings.focusMode);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const otherUser = useMemo(
    () => room.participants.find((participant) => !participant.isCurrentUser),
    [room.participants],
  );

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const handleSubmit = () => {
    if (!draft.trim()) return;
    onSend(draft, sendSilently);
    setDraft('');
  };

  return (
    <div className="chat-room-container">
      <header className="app-header room-header">
        <button className="icon-btn" type="button" onClick={onBack} aria-label="대화 목록으로 돌아가기">
          <ArrowLeft size={22} />
        </button>
        <div className="room-title">
          <Avatar
            src={otherUser?.avatarUrl}
            name={room.title}
            size={32}
            status={room.isGroup ? undefined : otherUser?.status}
          />
          <div>
            <h1>{room.title}</h1>
            <span>{room.isGroup ? '소규모 그룹 대화' : otherUser?.statusMessage ?? '연결됨'}</span>
          </div>
        </div>
        <span className="room-privacy">E2EE</span>
      </header>

      <main className="messages-scroll-area" aria-label={room.title + ' 대화 내용'}>
        {settings.focusMode && (
          <div className="focus-banner">
            <Moon size={16} />
            <span>포커스 모드예요. 조용히 보내면 알림 없이 전달돼요.</span>
          </div>
        )}
        {room.ephemeralHours ? (
          <div className="clean-banner">
            <Leaf size={16} />
            <span>클린챗 · 메시지는 {room.ephemeralHours}시간 후 자동 정리돼요.</span>
          </div>
        ) : null}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            sender={room.participants.find((participant) => participant.id === message.senderId)}
            isCurrentUser={message.senderId === 'user_me'}
            onToggleReaction={onToggleReaction}
          />
        ))}
        <div ref={messageEndRef} />
      </main>

      <form
        className="chat-input-bar"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <button
          className={'icon-btn silent-toggle ' + (sendSilently ? 'active' : '')}
          type="button"
          aria-label="조용히 보내기 토글"
          aria-pressed={sendSilently}
          onClick={() => setSendSilently((current) => !current)}
          title="조용히 보내기"
        >
          <Moon size={18} />
        </button>
        <input
          className="chat-input-field"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={sendSilently ? '조용히 보낼 메시지...' : '메시지를 입력하세요...'}
          aria-label="메시지 입력"
        />
        <button className="send-btn" type="submit" disabled={!draft.trim()} aria-label="메시지 전송">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
