import { kstParts, pad, yyyymmdd, HOUR_MS } from '../lib/time'
import type { Condition, HourPoint, Series } from './types'

export class KmaNoKeyError extends Error {}

/** 위경도 → 기상청 단기예보 격자(nx, ny). 기상청 Lambert Conformal Conic 변환식. */
export function toKmaGrid(lat: number, lon: number): { nx: number; ny: number } {
  const RE = 6371.00877
  const GRID = 5.0
  const SLAT1 = 30.0
  const SLAT2 = 60.0
  const OLON = 126.0
  const OLAT = 38.0
  const XO = 43
  const YO = 136
  const DEGRAD = Math.PI / 180

  const re = RE / GRID
  const slat1 = SLAT1 * DEGRAD
  const slat2 = SLAT2 * DEGRAD
  const olon = OLON * DEGRAD
  const olat = OLAT * DEGRAD

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5)
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn)
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5)
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5)
  ro = (re * sf) / Math.pow(ro, sn)

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5)
  ra = (re * sf) / Math.pow(ra, sn)
  let theta = lon * DEGRAD - olon
  if (theta > Math.PI) theta -= 2 * Math.PI
  if (theta < -Math.PI) theta += 2 * Math.PI
  theta *= sn

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  }
}

/** 단기예보 발표시각(02, 05, …, 23시). 발표 후 약 10분 뒤부터 조회 가능. */
function latestBase(now: Date): { baseDate: string; baseTime: string } {
  const bases = [2, 5, 8, 11, 14, 17, 20, 23]
  const p = kstParts(new Date(now.getTime() - 10 * 60 * 1000))
  const base = [...bases].reverse().find((h) => h <= p.hour)
  if (base === undefined) {
    return { baseDate: yyyymmdd(kstParts(new Date(now.getTime() - 24 * HOUR_MS))), baseTime: '2300' }
  }
  return { baseDate: yyyymmdd(p), baseTime: `${pad(base)}00` }
}

/** SKY(하늘상태) + PTY(강수형태) → 공통 상태 */
function toCondition(sky?: string, pty?: string): Condition | null {
  switch (pty) {
    case '1': // 비
    case '2': // 비/눈
    case '4': // 소나기
      return 'rain'
    case '3':
      return 'snow'
  }
  switch (sky) {
    case '1':
      return 'clear'
    case '3':
      return 'partly'
    case '4':
      return 'cloudy'
  }
  return null
}

interface KmaItem {
  category: string
  fcstDate: string
  fcstTime: string
  fcstValue: string
}

export async function fetchKma(lat: number, lon: number, now: Date, signal: AbortSignal): Promise<Series> {
  const { nx, ny } = toKmaGrid(lat, lon)
  const { baseDate, baseTime } = latestBase(now)
  const params = new URLSearchParams({ base_date: baseDate, base_time: baseTime, nx: String(nx), ny: String(ny) })

  // API 키를 브라우저에 노출하지 않도록 서버(vite 미들웨어)를 거친다. vite.config.ts 참고.
  const res = await fetch(`/api/kma?${params}`, { signal })
  const body = await res.json().catch(() => null)
  if (res.status === 503 && body?.error === 'NO_KEY') throw new KmaNoKeyError()
  if (!res.ok || !body) throw new Error(body?.error ?? `기상청 ${res.status}`)

  const header = body.response?.header
  if (header?.resultCode !== '00') throw new Error(header?.resultMsg ?? '기상청 응답 오류')
  const items: KmaItem[] = body.response.body?.items?.item ?? []

  const byHour = new Map<string, Record<string, string>>()
  for (const it of items) {
    const key = `${it.fcstDate.slice(0, 4)}-${it.fcstDate.slice(4, 6)}-${it.fcstDate.slice(6, 8)}T${it.fcstTime.slice(0, 2)}:00`
    const row = byHour.get(key) ?? {}
    row[it.category] = it.fcstValue
    byHour.set(key, row)
  }

  const series: Series = new Map()
  for (const [key, row] of byHour) {
    const point: HourPoint = {
      temp: row.TMP != null ? Number(row.TMP) : null,
      pop: row.POP != null ? Number(row.POP) : null,
      condition: toCondition(row.SKY, row.PTY),
    }
    series.set(key, point)
  }
  return series
}
