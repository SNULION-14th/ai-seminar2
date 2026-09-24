import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import { BookOpen, ChevronDown, Clock3, Home, LibraryBig, Menu, Plus, Search, Star, Trash2, UserRound, X } from 'lucide-react'
import { readingStatusLabel } from './entities/reading-record/model'
import type { ReadingRecord, ReadingStatus, RecordTag } from './entities/reading-record/model'
import { createReadingRecord, loadReadingRecords, saveReadingRecords } from './features/reading-journal/recordStorage'
import './App.css'

const tagOptions: RecordTag[] = ['따뜻함', '여운', '새로움', '위로됨', '다시 읽고 싶다']
const navigation = [
  { label: '오늘의 기록', icon: Home, active: true }, { label: '책장', icon: LibraryBig, active: false },
  { label: '기록', icon: Clock3, active: false }, { label: '마이', icon: UserRound, active: false },
]

function App() {
  const titleId = useId()
  const thoughtId = useId()
  const statusId = useId()
  const [records, setRecords] = useState<ReadingRecord[]>(loadReadingRecords)
  const [bookTitle, setBookTitle] = useState('')
  const [thought, setThought] = useState('')
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState<RecordTag[]>([])
  const [status, setStatus] = useState<ReadingStatus>('reading')
  const [message, setMessage] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { saveReadingRecords(records) }, [records])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!bookTitle.trim() || !thought.trim()) {
      setMessage('책 제목과 한 줄 감상을 입력해주세요.')
      return
    }
    setRecords((current) => [createReadingRecord({ bookTitle: bookTitle.trim(), thought: thought.trim(), rating, tags, status }), ...current])
    setBookTitle(''); setThought(''); setRating(0); setTags([]); setStatus('reading')
    setMessage('한 줄 기록을 책장에 담았어요.')
  }

  const toggleTag = (tag: RecordTag) => setTags((current) => current.includes(tag) ? current.filter((selected) => selected !== tag) : [...current, tag])
  const deleteRecord = (id: string) => {
    const target = records.find((record) => record.id === id)
    setRecords((current) => current.filter((record) => record.id !== id))
    setMessage(target ? `‘${target.bookTitle}’ 기록을 삭제했어요.` : '')
  }

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="주요 메뉴">
      <div className="brand"><span className="brand-mark" aria-hidden="true"><BookOpen size={20} /></span><span>한 줄 책장</span></div>
      <p className="brand-description">나만의 문장 보관함</p>
      <nav>{navigation.map(({ label, icon: Icon, active }) => <a className={`nav-link ${active ? 'active' : ''}`} href={`#${label}`} key={label}><Icon size={18} strokeWidth={1.8} aria-hidden="true" />{label}</a>)}</nav>
      <div className="sidebar-footer"><div className="profile-badge" aria-hidden="true">나</div><div><strong>나의 책장</strong><span>조용히 쌓아가는 중</span></div><ChevronDown size={16} aria-hidden="true" /></div>
    </aside>
    <main className="main-content">
      <header className="mobile-header"><div className="brand"><span className="brand-mark" aria-hidden="true"><BookOpen size={18} /></span>한 줄 책장</div><button className="icon-button" type="button" aria-label="메뉴 열기" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button></header>
      <section className="welcome" id="오늘의 기록"><p className="eyebrow">TODAY’S NOTE</p><h1>오늘, 어떤 문장을 남기고 싶나요?</h1><p>읽은 책의 마음을 한 줄로 기록해보세요.</p></section>
      <section className="record-panel" aria-labelledby="record-heading">
        <form className="record-form" onSubmit={handleSubmit}>
          <div className="section-heading"><div><span className="small-icon"><Plus size={15} aria-hidden="true" /></span><h2 id="record-heading">빠른 기록</h2></div><span className="helper-text">10초면 충분해요</span></div>
          <div className="field-group"><label htmlFor={titleId}>책 제목</label><div className="input-with-icon"><Search size={18} aria-hidden="true" /><input id={titleId} value={bookTitle} onChange={(event) => setBookTitle(event.target.value)} placeholder="책 제목을 입력하세요" autoComplete="off" /></div></div>
          <div className="form-row"><fieldset className="rating-field"><legend>별점 <span>선택</span></legend><div className="star-picker" aria-label="별점 선택">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={value <= rating ? 'selected' : ''} onClick={() => setRating(value)} aria-label={`${value}점`} aria-pressed={value === rating}><Star size={21} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}{rating > 0 && <button className="rating-reset" type="button" onClick={() => setRating(0)}>지우기</button>}</div></fieldset><div className="status-field"><label htmlFor={statusId}>독서 상태 <span>선택</span></label><select id={statusId} value={status} onChange={(event) => setStatus(event.target.value as ReadingStatus)}><option value="want">읽고 싶음</option><option value="reading">읽는 중</option><option value="finished">완독</option></select></div></div>
          <div className="field-group"><label htmlFor={thoughtId}>한 줄 감상</label><textarea id={thoughtId} value={thought} onChange={(event) => setThought(event.target.value)} placeholder="한 줄 감상을 남겨보세요" rows={3} /></div>
          <fieldset className="tag-field"><legend>지금의 인상 <span>선택</span></legend><div className="tag-list">{tagOptions.map((tag) => <button type="button" key={tag} className={tags.includes(tag) ? 'tag selected' : 'tag'} aria-pressed={tags.includes(tag)} onClick={() => toggleTag(tag)}>#{tag}</button>)}</div></fieldset>
          <button className="submit-button" type="submit">기록 등록 <span aria-hidden="true">→</span></button><p className="form-message" aria-live="polite">{message}</p>
        </form>
        <aside className="current-book" aria-label="현재 읽는 책"><p className="current-label">CURRENTLY READING</p><div className="book-cover cover-current"><span>아무튼,<br />술</span><i>김혼비</i></div><div className="book-meta"><p>현재 읽는 책</p><h3>아무튼, 술</h3><span>김혼비 · 읽는 중</span></div><div className="progress"><span>읽는 중</span><div><i /></div><b>63%</b></div></aside>
      </section>
      <section className="records-section" id="기록" aria-labelledby="records-heading"><div className="records-heading"><div><p className="eyebrow">RECENT NOTES</p><h2 id="records-heading">최근 남긴 기록</h2></div><span>{records.length}개의 문장</span></div>{records.length === 0 ? <div className="empty-state"><BookOpen size={28} aria-hidden="true" /><h3>첫 문장을 책장에 담아보세요.</h3><p>책 제목과 떠오른 생각 한 줄이면 충분해요.</p></div> : <div className="record-list">{records.map((record, index) => <RecordCard key={record.id} record={record} index={index} onDelete={deleteRecord} />)}</div>}</section>
    </main>
  </div>
}

function RecordCard({ record, index, onDelete }: { record: ReadingRecord; index: number; onDelete: (id: string) => void }) {
  const date = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(record.createdAt)).replace(/ /g, '')
  return <article className="record-card"><div className={`book-cover card-cover cover-${index % 3}`} aria-hidden="true"><span>{record.bookTitle.slice(0, 7)}</span></div><div className="record-card-content"><div className="record-card-top"><div><p className="record-book-title">{record.bookTitle}</p><span className="record-status">{readingStatusLabel[record.status]}</span></div><button className="delete-button" type="button" onClick={() => onDelete(record.id)} aria-label={`${record.bookTitle} 기록 삭제`}><Trash2 size={17} /></button></div><p className="record-thought">“{record.thought}”</p><div className="record-footer"><div className="record-tags">{record.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div><div className="record-date">{record.rating > 0 && <span className="inline-rating" aria-label={`${record.rating}점`}>{'★'.repeat(record.rating)}{'☆'.repeat(5 - record.rating)}</span>}<time dateTime={record.createdAt}>{date}</time></div></div></div></article>
}

export default App
