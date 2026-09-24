import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Settings } from 'lucide-react';
import { Toast } from './components/common/Toast';
import { ChatRoomView } from './features/chat/components/ChatRoomView';
import { ChatListView } from './features/chat-list/components/ChatListView';
import { NewChatModal } from './features/contacts/components/NewChatModal';
import { SettingsView } from './features/settings/components/SettingsView';
import { usePureChat } from './features/chat/hooks/usePureChat';

type AppTab = 'chats' | 'settings';

const App = () => {
  const [tab, setTab] = useState<AppTab>('chats');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const {
    rooms,
    messages,
    settings,
    users,
    selectRoom,
    sendMessage,
    toggleReaction,
    createRoom,
    updateSettings,
    resetDemo,
  } = usePureChat();

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId),
    [activeRoomId, rooms],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = settings.darkMode ? 'dark' : 'light';
  }, [settings.darkMode]);

  const handleSelectRoom = (roomId: string) => {
    selectRoom(roomId);
    setActiveRoomId(roomId);
  };

  const handleStartChat = (userId: string) => {
    const roomId = createRoom(userId);
    setIsNewChatOpen(false);
    setTab('chats');
    setActiveRoomId(roomId);
    setToast('새 대화방을 열었어요.');
  };

  const handleReset = () => {
    resetDemo();
    setActiveRoomId(null);
    setTab('chats');
    setToast('데모 데이터를 처음 상태로 되돌렸어요.');
  };

  return (
    <main className="app-container" aria-label="PureChat 메신저">
      <section className="app-main-content">
        {activeRoom ? (
          <ChatRoomView
            room={activeRoom}
            messages={messages[activeRoom.id] ?? []}
            settings={settings}
            onBack={() => setActiveRoomId(null)}
            onSend={(content, isSilent) => sendMessage(activeRoom.id, content, isSilent)}
            onToggleReaction={toggleReaction}
          />
        ) : tab === 'chats' ? (
          <ChatListView
            rooms={rooms}
            settings={settings}
            onSelectRoom={handleSelectRoom}
            onOpenNewChat={() => setIsNewChatOpen(true)}
            onToggleFocusMode={() => updateSettings({ focusMode: !settings.focusMode })}
          />
        ) : (
          <SettingsView settings={settings} onUpdate={updateSettings} onReset={handleReset} />
        )}
      </section>

      {!activeRoom && (
        <nav className="app-bottom-nav" aria-label="주요 탐색">
          <button
            className={'nav-tab-btn ' + (tab === 'chats' ? 'active' : '')}
            type="button"
            onClick={() => setTab('chats')}
            aria-current={tab === 'chats' ? 'page' : undefined}
          >
            <MessageCircle size={20} />
            <span>대화</span>
          </button>
          <button
            className={'nav-tab-btn ' + (tab === 'settings' ? 'active' : '')}
            type="button"
            onClick={() => setTab('settings')}
            aria-current={tab === 'settings' ? 'page' : undefined}
          >
            <Settings size={20} />
            <span>설정</span>
          </button>
        </nav>
      )}

      {isNewChatOpen && (
        <NewChatModal
          users={users}
          onClose={() => setIsNewChatOpen(false)}
          onStartChat={handleStartChat}
          onShowToast={setToast}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </main>
  );
};

export default App;
