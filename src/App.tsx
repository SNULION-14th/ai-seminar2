import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GitBranch,
  Plus,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import './App.css'

type Slot = {
  id: number
  day: string
  date: string
  time: string
  score: string
  people: string
}

const slots: Slot[] = [
  { id: 1, day: '화', date: '9/23', time: '14:00 – 14:30', score: '모두 가능', people: '4명' },
  { id: 2, day: '수', date: '9/24', time: '11:00 – 11:30', score: '가장 빠름', people: '4명' },
  { id: 3, day: '목', date: '9/25', time: '16:30 – 17:00', score: '모두 가능', people: '4명' },
]

function App() {
  const [selectedSlot, setSelectedSlot] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreated, setIsCreated] = useState(false)

  const selected = useMemo(
    () => slots.find((slot) => slot.id === selectedSlot) ?? slots[0],
    [selectedSlot],
  )

  const createSchedule = () => {
    setIsCreated(true)
    setIsCreateOpen(false)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="맞는 시간 홈">
          <span className="brand-mark"><Sparkles size={16} /></span>
          맞는 시간
        </a>
        <nav aria-label="주요 메뉴">
          <a className="active" href="#schedule">일정 조율</a>
          <a href="#work">내 작업</a>
        </nav>
        <button className="avatar" type="button" aria-label="내 프로필">YR</button>
      </header>

      <section className="hero-section" id="top">
        <div>
          <p className="eyebrow">팀의 빈 시간을 한눈에</p>
          <h1>딱 맞는 시간만,<br />바로 고르세요.</h1>
          <p className="hero-copy">캘린더의 상세 내용은 보지 않고, 팀원 모두가 가능한<br className="desktop-only" /> 시간만 모아 보여드려요.</p>
        </div>
        <div className="connection-status" aria-label="연동 상태">
          <div className="status-title"><span className="live-dot" /> 연결 준비</div>
          <div className="connection-row"><CalendarDays size={17} /> Google Calendar <span>OAuth 필요</span></div>
          <div className="connection-row"><GitBranch size={17} /> GitHub <span>토큰 필요</span></div>
        </div>
      </section>

      <section className="workspace" id="schedule">
        <div className="section-heading">
          <div>
            <p className="eyebrow">이번 주</p>
            <h2>팀 싱크 미팅</h2>
            <p>AI Seminar 2 · 30분 · 참여자 4명</p>
          </div>
          <div className="week-switcher" aria-label="주 변경">
            <button type="button" aria-label="이전 주"><ChevronLeft size={18} /></button>
            <span>9월 22일 – 28일</span>
            <button type="button" aria-label="다음 주"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="dashboard-grid">
          <article className="calendar-card">
            <div className="card-title-row">
              <div><CalendarDays size={19} /><h3>추천 시간</h3></div>
              <span className="privacy-label">상세 일정 비공개</span>
            </div>
            <p className="card-description">참여자 전원이 가능한 시간을 우선으로 정렬했어요.</p>
            <div className="slot-list" role="radiogroup" aria-label="추천 시간 선택">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  className={`slot ${selectedSlot === slot.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSlot(slot.id)}
                  role="radio"
                  aria-checked={selectedSlot === slot.id}
                >
                  <span className="date-badge"><strong>{slot.day}</strong>{slot.date}</span>
                  <span className="slot-time"><Clock3 size={16} />{slot.time}</span>
                  <span className="slot-meta"><CheckCircle2 size={15} />{slot.score} · {slot.people}</span>
                  {selectedSlot === slot.id && <span className="selected-check"><Check size={14} /></span>}
                </button>
              ))}
            </div>
            <button className="outline-button" type="button">다른 시간 직접 고르기 <ChevronRight size={16} /></button>
          </article>

          <article className="context-card" id="work">
            <div className="card-title-row">
              <div><GitBranch size={19} /><h3>이번 미팅의 맥락</h3></div>
              <span className="github-label">GitHub</span>
            </div>
            <p className="card-description">연결된 레포의 진행 중인 작업을 함께 확인해요.</p>
            <div className="repository">
              <div className="repo-icon"><GitBranch size={18} /></div>
              <div><strong>SNULION-14th / ai-seminar2</strong><span>이번 주 업데이트 3건</span></div>
              <ArrowUpRight size={17} />
            </div>
            <ul className="issue-list">
              <li><span className="issue-number">#12</span><span>Google Calendar MCP 연동</span><span className="issue-tag progress">진행 중</span></li>
              <li><span className="issue-number">#9</span><span>일정 후보 추천 화면</span><span className="issue-tag review">리뷰 중</span></li>
              <li><span className="issue-number">#7</span><span>초대 링크 공유 기능</span><span className="issue-tag done">완료</span></li>
            </ul>
          </article>
        </div>

        <section className="decision-bar" aria-live="polite">
          <div className="decision-icon"><Users size={20} /></div>
          <div>
            <p>선택한 시간</p>
            <strong>{selected.day}요일 {selected.date}, {selected.time}</strong>
          </div>
          <button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus size={18} /> 이 시간으로 일정 만들기
          </button>
        </section>
        {isCreated && <p className="success-message"><CheckCircle2 size={17} /> 일정 생성 요청을 준비했어요. Calendar OAuth 연결 후 실제 캘린더에 반영됩니다.</p>}
      </section>

      <footer>맞는 시간 · Google Calendar와 GitHub의 MCP 연동을 위한 일정 조율 서비스</footer>

      {isCreateOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsCreateOpen(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setIsCreateOpen(false)} aria-label="닫기"><X size={18} /></button>
            <span className="modal-icon"><CalendarDays size={22} /></span>
            <p className="eyebrow">일정 확인</p>
            <h2 id="modal-title">팀 싱크 미팅을 만들까요?</h2>
            <p className="modal-copy">{selected.day}요일 {selected.date} · {selected.time}<br />참여자 4명에게 초대장을 보냅니다.</p>
            <button className="primary-button modal-action" type="button" onClick={createSchedule}>일정 생성 요청하기</button>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
