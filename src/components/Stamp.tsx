// DS-03 도장 찍기: 인증센터 도장. 찍히면 위에서 "쿵" 내려오고 잉크가 번진다 (TRK-06, SHR-01).
// 데이터는 props로만 받는다.
import { useEffect, useId } from 'react'
import styles from './Stamp.module.css'

export interface StampProps {
  name: string
  stamped: boolean
  date?: string // ISO
  animate?: boolean
  size?: 'sm' | 'md' | 'lg'
  onStamped?: () => void
}

const VIBRATE_MS = 40

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}

export function Stamp({ name, stamped, date, animate = false, size = 'md', onStamped }: StampProps) {
  const uid = useId()
  const roughId = `${uid}-rough`
  const arcId = `${uid}-arc`
  const playing = animate && stamped

  // 도장이 찍히는 순간 짧게 진동한다 (지원 기기만)
  useEffect(() => {
    if (!playing) return
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(VIBRATE_MS)
  }, [playing])

  // 이름이 길면 글자 간격을 줄여 원 안에 맞춘다
  const fit = name.length > 4 ? { textLength: 64, lengthAdjust: 'spacingAndGlyphs' as const } : {}
  const nameSize = name.length <= 3 ? 22 : name.length <= 5 ? 18 : 15
  const dateText = date ? fmtDate(date) : ''

  return (
    <figure
      className={`${styles.stamp} ${styles[size]}`}
      aria-label={stamped ? `${name} 도장${dateText ? `, ${dateText}에 찍었어요` : ''}` : `${name} 도장 자리, 아직 안 찍었어요`}
      role="img"
    >
      <div className={styles.seat}>
        {stamped ? (
          <div
            className={`${styles.inked} ${playing ? styles.thud : ''}`}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) onStamped?.()
            }}
          >
            {playing && <span className={styles.bleed} aria-hidden="true" />}
            <svg className={styles.svg} viewBox="0 0 100 100" aria-hidden="true">
              <defs>
                <filter id={roughId} x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={name.length} />
                  <feDisplacementMap in="SourceGraphic" scale="2.4" />
                </filter>
                <path id={arcId} d="M18 52a32 32 0 0 1 64 0" />
              </defs>
              <g filter={`url(#${roughId})`} className={styles.ink}>
                <circle cx="50" cy="50" r="45" fill="none" strokeWidth="4.5" />
                <circle cx="50" cy="50" r="38.5" fill="none" strokeWidth="1.5" />
                <text className={styles.arc} fontSize="9.5">
                  <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
                    국토종주 인증
                  </textPath>
                </text>
                <text className={styles.name} x="50" y="64" fontSize={nameSize} textAnchor="middle" {...fit}>
                  {name}
                </text>
                <path d="M30 72h40" strokeWidth="1.5" />
              </g>
            </svg>
          </div>
        ) : (
          <svg className={`${styles.svg} ${styles.empty}`} viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="44" fill="none" strokeWidth="2.5" strokeDasharray="6 6" />
            <text x="50" y="56" fontSize={nameSize - 4} textAnchor="middle" {...fit}>
              {name}
            </text>
          </svg>
        )}
      </div>
      {size !== 'sm' || dateText ? (
        <figcaption className={styles.caption}>
          {size !== 'sm' && <span className={styles.captionName}>{name}</span>}
          {dateText && <span className="num">{dateText}</span>}
        </figcaption>
      ) : null}
    </figure>
  )
}
