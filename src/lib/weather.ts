import type { DailyWeather, WeatherResult } from '../types'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'
const FORECAST_HORIZON_DAYS = 15

const DAY_MS = 86_400_000

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(iso: string, n: number): string {
  return toISO(new Date(Date.parse(iso) + n * DAY_MS))
}

export function diffDays(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS)
}

function shiftYear(iso: string, years: number): string {
  const [y, m, d] = iso.split('-')
  // 2/29 → 2/28 보정
  const day = m === '02' && d === '29' ? '28' : d
  return `${Number(y) + years}-${m}-${day}`
}

interface OpenMeteoDaily {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_sum: number[]
  precipitation_probability_max?: number[]
}

/**
 * 여행 날짜가 예보 범위(오늘+15일) 안이면 forecast,
 * 아니면 작년 같은 날짜의 실측값(archive)을 참고값으로 반환한다.
 */
export async function fetchTripWeather(
  lat: number,
  lon: number,
  start: string,
  end: string,
  today: string = toISO(new Date()),
): Promise<WeatherResult> {
  const inRange = diffDays(today, end) <= FORECAST_HORIZON_DAYS && diffDays(today, start) >= 0
  const source = inRange ? 'forecast' : 'last-year'

  const qStart = inRange ? start : shiftYear(start, -1)
  const qEnd = inRange ? end : shiftYear(end, -1)
  const daily = [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    ...(inRange ? ['precipitation_probability_max'] : []),
  ].join(',')

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily,
    timezone: 'auto',
    start_date: qStart,
    end_date: qEnd,
  })

  const res = await fetch(`${inRange ? FORECAST_URL : ARCHIVE_URL}?${params}`)
  if (!res.ok) throw new Error(`날씨 API 오류 (${res.status})`)
  const json = (await res.json()) as { daily?: OpenMeteoDaily }
  if (!json.daily) throw new Error('날씨 데이터가 비어 있어요')

  const d = json.daily
  const days: DailyWeather[] = d.time.map((_, i) => ({
    date: addDays(start, i),
    code: d.weather_code[i] ?? 0,
    tMax: Math.round(d.temperature_2m_max[i] ?? 0),
    tMin: Math.round(d.temperature_2m_min[i] ?? 0),
    precipProb: d.precipitation_probability_max?.[i] ?? null,
    precipSum: d.precipitation_sum[i] ?? 0,
  }))

  return { source, days }
}
