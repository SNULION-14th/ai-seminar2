// 한국 표준시(KST)는 서머타임이 없으므로 UTC+9 고정 오프셋으로 계산한다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

export interface KstParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: number
}

export function kstParts(date: Date): KstParts {
  const k = new Date(date.getTime() + KST_OFFSET_MS)
  return {
    year: k.getUTCFullYear(),
    month: k.getUTCMonth() + 1,
    day: k.getUTCDate(),
    hour: k.getUTCHours(),
    minute: k.getUTCMinutes(),
    weekday: k.getUTCDay(),
  }
}

/** "2026-09-24T15:00" 형식의 KST 시각 키. Open-Meteo(timezone=Asia/Seoul)의 time 값과 같은 형식이다. */
export function hourKey(date: Date): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 13) + ':00'
}

export interface TimelineSlot {
  key: string
  date: Date
  hour: number
}

/** 현재 시각이 속한 정시부터 n시간. */
export function buildTimeline(now: Date, n = 24): TimelineSlot[] {
  const start = Math.floor(now.getTime() / HOUR_MS) * HOUR_MS
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(start + i * HOUR_MS)
    return { key: hourKey(date), date, hour: kstParts(date).hour }
  })
}

const pad = (n: number) => String(n).padStart(2, '0')

export function yyyymmdd(p: Pick<KstParts, 'year' | 'month' | 'day'>): string {
  return `${p.year}${pad(p.month)}${pad(p.day)}`
}

export { HOUR_MS, pad }
