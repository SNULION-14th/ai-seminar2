// WMO weather interpretation codes (Open-Meteo)
export type WeatherKind = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm'

export function kindOf(code: number): WeatherKind {
  if (code <= 1) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'rain'
}

export const KIND_LABEL: Record<WeatherKind, string> = {
  clear: '맑음',
  cloudy: '흐림',
  fog: '안개',
  rain: '비',
  snow: '눈',
  storm: '뇌우',
}

export const isSnow = (code: number) => kindOf(code) === 'snow'
