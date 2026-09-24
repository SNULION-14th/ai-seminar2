import { Bell, Database, Moon, RotateCcw, ShieldCheck, Sun } from 'lucide-react';
import { Avatar } from '../../../components/common/Avatar';
import { CURRENT_USER } from '../../../services/mockData';
import type { UserSettings } from '../../../types/chat';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => void;
  onReset: () => void;
}

interface ToggleProps {
  checked: boolean;
  label: string;
  onChange: () => void;
}

const Toggle = ({ checked, label, onChange }: ToggleProps) => (
  <button
    className={'settings-toggle ' + (checked ? 'on' : '')}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
  >
    <span />
  </button>
);

export const SettingsView = ({ settings, onUpdate, onReset }: SettingsViewProps) => (
  <div className="settings-view">
    <header className="app-header">
      <div className="header-title-group">
        <h1>설정</h1>
        <span className="settings-caption">나에게 맞춘 조용한 대화</span>
      </div>
    </header>

    <main className="settings-scroll-area">
      <section className="profile-card">
        <Avatar src={CURRENT_USER.avatarUrl} name={CURRENT_USER.nickname} size={56} status="online" />
        <div>
          <strong>{CURRENT_USER.nickname}</strong>
          <p>{CURRENT_USER.statusMessage}</p>
        </div>
      </section>

      <section className="settings-section">
        <h2>대화 환경</h2>
        <div className="settings-card">
          <div className="setting-row">
            <Moon size={19} />
            <div>
              <strong>포커스 모드</strong>
              <span>방해받지 않는 시간에는 조용히 연결해요.</span>
            </div>
            <Toggle
              checked={settings.focusMode}
              label="포커스 모드"
              onChange={() => onUpdate({ focusMode: !settings.focusMode })}
            />
          </div>
          <div className="setting-row">
            <Bell size={19} />
            <div>
              <strong>조용한 읽음</strong>
              <span>읽음 압박 대신 부드러운 상태만 보여줘요.</span>
            </div>
            <Toggle
              checked={settings.gentleRead}
              label="조용한 읽음"
              onChange={() => onUpdate({ gentleRead: !settings.gentleRead })}
            />
          </div>
          <div className="setting-row">
            {settings.darkMode ? <Moon size={19} /> : <Sun size={19} />}
            <div>
              <strong>화면 테마</strong>
              <span>{settings.darkMode ? '어두운 테마를 사용 중이에요.' : '밝은 테마를 사용 중이에요.'}</span>
            </div>
            <Toggle
              checked={settings.darkMode}
              label="어두운 테마"
              onChange={() => onUpdate({ darkMode: !settings.darkMode })}
            />
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2>프라이버시</h2>
        <div className="settings-card">
          <div className="setting-row static-row">
            <ShieldCheck size={19} color="#10b981" />
            <div>
              <strong>광고 및 추적 없음</strong>
              <span>PureChat 데모는 기기 안에만 데이터를 저장해요.</span>
            </div>
          </div>
          <div className="setting-row static-row">
            <Database size={19} />
            <div>
              <strong>클린챗</strong>
              <span>채팅방별로 24시간 후 자동 정리를 선택할 수 있어요.</span>
            </div>
          </div>
        </div>
      </section>

      <button className="reset-demo-btn" type="button" onClick={onReset}>
        <RotateCcw size={17} />
        데모 데이터 초기화
      </button>
    </main>
  </div>
);
