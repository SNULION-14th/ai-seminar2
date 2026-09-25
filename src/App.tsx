import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './App.css'
import type { CourtWeather, MatchResult, MatchType, TennisRecord } from './types'
import { getStats, loadRecords, saveRecords, toNotionCsv } from './storage'
import { fetchCourtWeather } from './weather'

const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })

const emptyForm = () => ({
  title: '',
  date: today(),
  type: '단식' as MatchType,
  opponent: '',
  score: '',
  result: '승' as MatchResult,
  court: '서울대 테니스장',
  memo: '',
})

function WeatherCard() {
  const [weather, setWeather] = useState<CourtWeather | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetchCourtWeather(controller.signal)
      .then(setWeather)
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : '날씨 조회 실패')
      })
    return () => controller.abort()
  }, [])

  const tone = weather
    ? { '치기 좋음': 'good', 애매: 'meh', 비추: 'bad' }[weather.verdict]
    : 'loading'

  return (
    <section className={`card weather ${tone}`} aria-live="polite">
      <h2>오늘 서울대 코트 날씨</h2>
      {error && <p className="muted">{error}</p>}
      {!error && !weather && <p className="muted">불러오는 중…</p>}
      {weather && (
        <>
          <p className="verdict">{weather.verdict}</p>
          <p className="muted">{weather.reason}</p>
          <ul className="weather-stats">
            <li>
              <strong>{weather.temperature}℃</strong>기온
            </li>
            <li>
              <strong>{weather.precipitationProbability}%</strong>강수확률(3h)
            </li>
            <li>
              <strong>{weather.windSpeed}km/h</strong>풍속
            </li>
          </ul>
        </>
      )}
    </section>
  )
}

function App() {
  const [records, setRecords] = useState<TennisRecord[]>(loadRecords)
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState<'전체' | MatchType>('전체')

  useEffect(() => saveRecords(records), [records])

  const stats = useMemo(() => getStats(records), [records])
  const visible = useMemo(
    () =>
      [...records]
        .filter((r) => filter === '전체' || r.type === filter)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [records, filter],
  )

  const update = <K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K],
  ) =>
    setForm((f) => {
      const next = { ...f, [key]: value }
      // 연습이면 결과도 연습, 경기로 바꾸면 승으로 초기화
      if (key === 'type') next.result = value === '연습' ? '연습' : f.result === '연습' ? '승' : f.result
      return next
    })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const title =
      form.title.trim() ||
      (form.type === '연습' ? '연습' : `${form.type}${form.opponent ? ` vs ${form.opponent}` : ''}`)
    setRecords((prev) => [...prev, { ...form, title, id: crypto.randomUUID() }])
    setForm(emptyForm())
  }

  const remove = (id: string) => setRecords((prev) => prev.filter((r) => r.id !== id))

  const exportCsv = () => {
    const blob = new Blob([toNotionCsv(records)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rally-log-${today()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>🎾 Rally Log</h1>
          <p className="muted">서울대 코트에서 친 경기와 연습을 기록하는 테니스 기록장</p>
        </div>
        <button type="button" className="ghost" onClick={exportCsv}>
          Notion용 CSV 내보내기
        </button>
      </header>

      <div className="top-grid">
        <WeatherCard />
        <section className="card">
          <h2>내 기록</h2>
          <ul className="stats">
            <li>
              <strong>{stats.winRate}%</strong>승률
            </li>
            <li>
              <strong>
                {stats.wins}승 {stats.losses}패
              </strong>
              경기 {stats.matches}
            </li>
            <li>
              <strong>{stats.practices}</strong>연습
            </li>
          </ul>
          <p className="muted recent">
            최근 5경기{' '}
            {stats.recent.length === 0
              ? '없음'
              : stats.recent.map((r, i) => (
                  <span key={i} className={`dot ${r === '승' ? 'win' : 'loss'}`}>
                    {r}
                  </span>
                ))}
          </p>
        </section>
      </div>

      <section className="card">
        <h2>기록 추가</h2>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            날짜
            <input type="date" required value={form.date} onChange={(e) => update('date', e.target.value)} />
          </label>
          <label>
            유형
            <select value={form.type} onChange={(e) => update('type', e.target.value as MatchType)}>
              <option>단식</option>
              <option>복식</option>
              <option>연습</option>
            </select>
          </label>
          <label>
            결과
            <select
              value={form.result}
              disabled={form.type === '연습'}
              onChange={(e) => update('result', e.target.value as MatchResult)}
            >
              <option>승</option>
              <option>패</option>
              {form.type === '연습' && <option>연습</option>}
            </select>
          </label>
          <label>
            상대 / 파트너
            <input value={form.opponent} placeholder="예: 동아리 선배" onChange={(e) => update('opponent', e.target.value)} />
          </label>
          <label>
            스코어
            <input
              value={form.score}
              placeholder="예: 6-4"
              disabled={form.type === '연습'}
              onChange={(e) => update('score', e.target.value)}
            />
          </label>
          <label>
            코트
            <input value={form.court} onChange={(e) => update('court', e.target.value)} />
          </label>
          <label className="wide">
            제목 (비우면 자동)
            <input value={form.title} onChange={(e) => update('title', e.target.value)} />
          </label>
          <label className="wide">
            메모
            <textarea rows={2} value={form.memo} placeholder="잘 된 샷, 고칠 점" onChange={(e) => update('memo', e.target.value)} />
          </label>
          <button type="submit" className="primary wide">
            기록 저장
          </button>
        </form>
      </section>

      <section className="card">
        <div className="list-head">
          <h2>기록 목록</h2>
          <div className="tabs" role="tablist">
            {(['전체', '단식', '복식', '연습'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={filter === t}
                className={filter === t ? 'tab active' : 'tab'}
                onClick={() => setFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {visible.length === 0 ? (
          <p className="muted">아직 기록이 없어요.</p>
        ) : (
          <ul className="records">
            {visible.map((r) => (
              <li key={r.id} className="record">
                <span className={`badge ${r.result === '승' ? 'win' : r.result === '패' ? 'loss' : 'practice'}`}>
                  {r.result}
                </span>
                <div className="record-body">
                  <p className="record-title">
                    {r.title} {r.score && <span className="score">{r.score}</span>}
                  </p>
                  <p className="muted small">
                    {r.date} · {r.type} · {r.court}
                    {r.opponent && ` · ${r.opponent}`}
                  </p>
                  {r.memo && <p className="small">{r.memo}</p>}
                </div>
                <button type="button" className="ghost small" onClick={() => remove(r.id)} aria-label={`${r.title} 삭제`}>
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
