import type { Condition } from '../sources/types'

// Figma 'Weather Icon' 컴포넌트와 동일한 28×28 아이콘 세트
const SUN = '#F5A524'
const CLOUD = '#AEB6C2'
const CLOUD_DARK = '#8C96A5'
const RAIN = '#3B82F6'
const SNOW = '#60A5FA'
const CLOUD_PATH = 'M9 20.5h10.5a4.25 4.25 0 0 0 .55-8.46 5.75 5.75 0 0 0-11.1 1.1A3.7 3.7 0 0 0 9 20.5z'

function Rays({ cx, cy, r1, r2, width }: { cx: number; cy: number; r1: number; r2: number; width: number }) {
  return (
    <g stroke={SUN} strokeWidth={width} strokeLinecap="round">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4
        return (
          <line
            key={i}
            x1={cx + r1 * Math.cos(a)}
            y1={cy + r1 * Math.sin(a)}
            x2={cx + r2 * Math.cos(a)}
            y2={cy + r2 * Math.sin(a)}
          />
        )
      })}
    </g>
  )
}

const CONDITION_LABEL: Record<Condition, string> = {
  clear: '맑음',
  partly: '구름많음',
  cloudy: '흐림',
  rain: '비',
  snow: '눈',
}

export function WeatherIcon({ condition, isDay, size }: { condition: Condition; isDay: boolean; size: number }) {
  let body
  if (condition === 'clear' && !isDay) {
    body = <path d="M19.8 17.6A7.5 7.5 0 0 1 11.4 6.2a8 8 0 1 0 10.4 10.4 7.4 7.4 0 0 1-2 1z" fill="#7D8BA6" />
  } else if (condition === 'clear') {
    body = (
      <>
        <circle cx="14" cy="14" r="5" fill={SUN} />
        <Rays cx={14} cy={14} r1={8} r2={10.5} width={2} />
      </>
    )
  } else if (condition === 'partly') {
    body = (
      <>
        <circle cx="10" cy="10" r="3.6" fill={SUN} />
        <Rays cx={10} cy={10} r1={6} r2={7.8} width={1.6} />
        <path d={CLOUD_PATH} transform="translate(3.5 3) scale(0.88)" fill={CLOUD} stroke="#fff" strokeWidth="1.6" />
      </>
    )
  } else if (condition === 'cloudy') {
    body = <path d={CLOUD_PATH} transform="translate(-4.2 -3.2) scale(1.3)" fill={CLOUD_DARK} />
  } else if (condition === 'rain') {
    body = (
      <>
        <path d={CLOUD_PATH} transform="translate(0 -4)" fill={CLOUD_DARK} />
        <g stroke={RAIN} strokeWidth="2" strokeLinecap="round">
          <line x1="10" y1="19.5" x2="9" y2="23" />
          <line x1="14.5" y1="19.5" x2="13.5" y2="23" />
          <line x1="19" y1="19.5" x2="18" y2="23" />
        </g>
      </>
    )
  } else {
    body = (
      <>
        <path d={CLOUD_PATH} transform="translate(0 -4)" fill={CLOUD} />
        <g fill={SNOW}>
          <circle cx="10" cy="20.5" r="1.3" />
          <circle cx="14.5" cy="22.5" r="1.3" />
          <circle cx="19" cy="20.5" r="1.3" />
          <circle cx="12" cy="24.8" r="1.3" />
          <circle cx="17" cy="24.8" r="1.3" />
        </g>
      </>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" role="img" aria-label={CONDITION_LABEL[condition]}>
      <title>{CONDITION_LABEL[condition]}</title>
      {body}
    </svg>
  )
}
