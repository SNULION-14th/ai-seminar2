import type { Condition, Series } from './types'

/** Open-Meteo 모델 ID ↔ 서비스 소스 ID */
export const OPEN_METEO_MODELS = {
  ecmwf: 'ecmwf_ifs025',
  gfs: 'gfs_seamless',
  icon: 'icon_seamless',
} as const

type ModelSource = keyof typeof OPEN_METEO_MODELS

/** WMO weather interpretation code → 공통 상태 */
function fromWmo(code: number | null): Condition | null {
  if (code == null) return null
  if (code <= 1) return 'clear'
  if (code === 2) return 'partly'
  if (code === 3 || code === 45 || code === 48) return 'cloudy'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 51) return 'rain' // 이슬비·비·어는비·소나기·뇌우
  return null
}

interface Hourly {
  time: string[]
  [field: string]: (number | null)[] | string[]
}

export interface OpenMeteoResult {
  series: Record<ModelSource, Series>
  isDay: Map<string, boolean>
}

export async function fetchOpenMeteo(lat: number, lon: number, signal: AbortSignal): Promise<OpenMeteoResult> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
    models: Object.values(OPEN_METEO_MODELS).join(','),
    timezone: 'Asia/Seoul',
    forecast_days: '2',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal })
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const { hourly } = (await res.json()) as { hourly: Hourly }

  const col = (field: string, model: string) => (hourly[`${field}_${model}`] ?? []) as (number | null)[]
  const series = {} as Record<ModelSource, Series>
  const isDay = new Map<string, boolean>()

  for (const [source, model] of Object.entries(OPEN_METEO_MODELS) as [ModelSource, string][]) {
    const temp = col('temperature_2m', model)
    const pop = col('precipitation_probability', model)
    const code = col('weather_code', model)
    const day = col('is_day', model)
    const map: Series = new Map()
    hourly.time.forEach((t, i) => {
      map.set(t, {
        temp: temp[i] ?? null,
        pop: pop[i] ?? null,
        condition: fromWmo(code[i] ?? null),
      })
      if (day[i] != null && !isDay.has(t)) isDay.set(t, day[i] === 1)
    })
    series[source] = map
  }
  return { series, isDay }
}
