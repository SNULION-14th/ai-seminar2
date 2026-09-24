import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun } from 'lucide-react'
import type { WeatherResult } from '../types'
import { KIND_LABEL, kindOf, type WeatherKind } from '../lib/weatherCode'

const ICON: Record<WeatherKind, typeof Sun> = {
  clear: Sun,
  cloudy: Cloud,
  fog: CloudFog,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
}

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  result: WeatherResult | null
  loading: boolean
  error: string | null
}

export function WeatherStrip({ result, loading, error }: Props) {
  return (
    <section className="card weather">
      <div className="card-head">
        <h2>날씨</h2>
        {result && (
          <span className={`badge ${result.source}`}>
            {result.source === 'forecast' ? '실시간 예보' : '작년 같은 날짜 실측 · 참고용'}
          </span>
        )}
      </div>
      {loading && <p className="muted">날씨 불러오는 중…</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !error && result && (
        <ul className="days">
          {result.days.map((d) => {
            const kind = kindOf(d.code)
            const Icon = ICON[kind]
            const [, m, day] = d.date.split('-')
            const wd = WEEKDAY[new Date(d.date + 'T00:00:00').getDay()]
            return (
              <li key={d.date} className={`day ${kind}`}>
                <span className="date">
                  {Number(m)}/{Number(day)} ({wd})
                </span>
                <Icon size={30} />
                <span className="kind">{KIND_LABEL[kind]}</span>
                <span className="temp">
                  <b>{d.tMax}°</b> / {d.tMin}°
                </span>
                <span className="rain">
                  {d.precipProb !== null ? `☔ ${d.precipProb}%` : `☔ ${d.precipSum.toFixed(1)}mm`}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      <p className="source">Weather data by Open-Meteo.com</p>
    </section>
  )
}
