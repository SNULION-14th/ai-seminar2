import { useSyncExternalStore, type CSSProperties } from 'react'
import './App.css'
import { PrecipChart } from './components/PrecipChart'
import { SourceLabel } from './components/SourceLabel'
import { WeatherIcon } from './components/WeatherIcon'
import { HOURS, LOCATION, SOURCES } from './config'
import { chartY, hourLabel } from './lib/chart'
import { buildTimeline, kstParts } from './lib/time'
import type { HourPoint, SourceId } from './sources/types'
import { useForecast } from './useForecast'

const COMPACT_QUERY = '(max-width: 720px)'
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(COMPACT_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const useCompact = () => useSyncExternalStore(subscribe, () => window.matchMedia(COMPACT_QUERY).matches)

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

function App() {
  const { now, states, isDay } = useForecast()
  const compact = useCompact()
  const dims = compact ? { col: 64, chart: 260, icon: 32 } : { col: 88, chart: 320, icon: 42 }

  const timeline = buildTimeline(now, HOURS)
  const p = kstParts(now)

  const pointsOf = (id: SourceId): (HourPoint | undefined)[] => {
    const s = states[id]
    return timeline.map((slot) => (s.status === 'ok' ? s.series.get(slot.key) : undefined))
  }
  const points = Object.fromEntries(SOURCES.map((s) => [s.id, pointsOf(s.id)])) as Record<SourceId, (HourPoint | undefined)[]>
  const loading = (id: SourceId) => states[id].status === 'loading'
  const empty = (id: SourceId) => <span className={`empty${loading(id) ? ' empty--loading' : ''}`}>–</span>

  const sections = [
    {
      title: '날씨',
      rowClass: 'row--wx',
      cell: (id: SourceId, pt: HourPoint | undefined, i: number) =>
        pt?.condition ? (
          <WeatherIcon condition={pt.condition} isDay={isDay.get(timeline[i].key) ?? (timeline[i].hour >= 6 && timeline[i].hour < 19)} size={dims.icon} />
        ) : (
          empty(id)
        ),
    },
    {
      title: '기온 (°C)',
      rowClass: 'row--value',
      cell: (id: SourceId, pt: HourPoint | undefined) =>
        pt?.temp != null ? <span className="temp">{Math.round(pt.temp)}°</span> : empty(id),
    },
    {
      title: '강수확률 (%)',
      rowClass: 'row--value',
      cell: (id: SourceId, pt: HourPoint | undefined) =>
        pt?.pop != null ? (
          <span
            className={`pop${pt.pop >= 50 ? ' pop--high' : ''}`}
            style={{ background: pt.pop > 0 ? `rgba(59, 130, 246, ${0.05 + (pt.pop / 100) * 0.3})` : undefined }}
          >
            {pt.pop}%
          </span>
        ) : (
          empty(id)
        ),
    },
  ]

  const boardStyle = { '--col': `${dims.col}px`, '--chart-h': `${dims.chart}px` } as CSSProperties

  return (
    <div className="page">
      <header className="header">
        <h1 className="title">Weather All</h1>
        <p className="meta">
          {LOCATION.name} · {p.month}월 {p.day}일 ({WEEKDAY[p.weekday]}) {p.hour}시 기준
        </p>
      </header>

      <main className="board" style={boardStyle}>
        {/* 고정 열: 소스 로고 */}
        <div className="fixed">
          <div className="row row--hours rule-bottom" />
          {sections.map((sec, si) => (
            <div key={sec.title}>
              <div className={`row row--label${si > 0 ? ' rule-top' : ''}`}>{sec.title}</div>
              {SOURCES.map((s) => (
                <div key={s.id} className={`row ${sec.rowClass}`}>
                  <SourceLabel source={s} state={states[s.id]} />
                </div>
              ))}
            </div>
          ))}
          <div className="row row--label rule-top">강수확률 그래프</div>
          <div className="chart-side">
            <div className="legend">
              {SOURCES.map((s) => (
                <SourceLabel key={s.id} source={s} />
              ))}
            </div>
            {[100, 50, 0].map((v) => (
              <span key={v} className="axis" style={{ top: chartY(v, dims.chart) }}>
                {v}%
              </span>
            ))}
          </div>
        </div>

        {/* 가로 스크롤 영역: 24시간 */}
        <div className="scroller" tabIndex={0} aria-label="24시간 예보, 좌우로 스크롤">
          <div className="timeline" style={{ width: dims.col * timeline.length }}>
            <div className="row row--hours rule-bottom">
              {timeline.map((slot, i) => (
                <div key={slot.key} className={`cell hour${i === 0 || slot.hour === 0 ? ' hour--strong' : ''}`}>
                  {hourLabel(slot, i)}
                </div>
              ))}
            </div>
            {sections.map((sec, si) => (
              <div key={sec.title}>
                <div className={`row row--label${si > 0 ? ' rule-top' : ''}`} />
                {SOURCES.map((s) => (
                  <div key={s.id} className={`row ${sec.rowClass}`}>
                    {points[s.id].map((pt, i) => (
                      <div key={timeline[i].key} className="cell">
                        {sec.cell(s.id, pt, i)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            <div className="row row--label rule-top" />
            <PrecipChart
              timeline={timeline}
              col={dims.col}
              height={dims.chart}
              lines={SOURCES.map((s) => ({ id: s.id, color: s.color, values: points[s.id].map((pt) => pt?.pop ?? null) }))}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
