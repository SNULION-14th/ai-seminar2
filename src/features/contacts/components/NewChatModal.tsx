import { Copy, Plus, QrCode, X } from 'lucide-react';
import { Avatar } from '../../../components/common/Avatar';
import type { User } from '../../../types/chat';

interface NewChatModalProps {
  users: User[];
  onClose: () => void;
  onStartChat: (userId: string) => void;
  onShowToast: (message: string) => void;
}

export const NewChatModal = ({
  users,
  onClose,
  onStartChat,
  onShowToast,
}: NewChatModalProps) => {
  const contacts = users.filter((user) => !user.isCurrentUser);

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText('https://purechat.local/invite/geonho');
      onShowToast('초대 링크를 복사했어요.');
    } catch {
      onShowToast('이 브라우저에서는 링크 복사를 지원하지 않아요.');
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="new-chat-title">
      <section className="modal-sheet">
        <header className="modal-header">
          <div>
            <p className="eyebrow">3-TAP START</p>
            <h2 id="new-chat-title">새 대화 시작</h2>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="새 대화 창 닫기">
            <X size={20} />
          </button>
        </header>

        <div className="invite-card">
          <div className="fake-qr" aria-hidden="true">
            <QrCode size={56} strokeWidth={1.5} />
          </div>
          <div>
            <strong>링크 또는 QR로 빠르게 연결</strong>
            <p>상대방에게 보여주거나 링크를 공유해 보세요.</p>
          </div>
          <button className="invite-copy-btn" type="button" onClick={copyInviteLink}>
            <Copy size={16} />
            링크 복사
          </button>
        </div>

        <div className="contact-heading">
          <h3>바로 시작할 친구</h3>
          <span>{contacts.length}명</span>
        </div>
        <div className="contact-list">
          {contacts.map((user) => (
            <button className="contact-row" type="button" key={user.id} onClick={() => onStartChat(user.id)}>
              <Avatar src={user.avatarUrl} name={user.nickname} status={user.status} />
              <span>
                <strong>{user.nickname}</strong>
                <small>{user.statusMessage}</small>
              </span>
              <Plus size={19} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
