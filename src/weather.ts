import type { CourtWeather, PlayVerdict } from './types'

// 서울대학교 관악캠퍼스 테니스장 부근
const SNU = { latitude: 37.4591, longitude: 126.9535 }

interface OpenMeteoResponse {
  current: { temperature_2m: number; wind_speed_10m: number }
  hourly: { time: string[]; precipitation_probability: number[] }
}

export function judge(
  temperature: number,
  precipitationProbability: number,
  windSpeed: number,
): { verdict: PlayVerdict; reason: string } {
  if (precipitationProbability >= 60) return { verdict: '비추', reason: '비 올 가능성이 높아요' }
  if (windSpeed >= 30) return { verdict: '비추', reason: '바람이 너무 강해요' }
  if (precipitationProbability >= 30) return { verdict: '애매', reason: '비 소식이 조금 있어요' }
  if (windSpeed >= 20) return { verdict: '애매', reason: '바람이 공을 흔들 수 있어요' }
  if (temperature < 3) return { verdict: '애매', reason: '많이 추워요, 몸 충분히 풀기' }
  if (temperature > 33) return { verdict: '애매', reason: '너무 더워요, 물 챙기기' }
  return { verdict: '치기 좋음', reason: '코트 나가기 좋은 날씨예요' }
}

export async function fetchCourtWeather(signal?: AbortSignal): Promise<CourtWeather> {
  const params = new URLSearchParams({
    latitude: String(SNU.latitude),
    longitude: String(SNU.longitude),
    current: 'temperature_2m,wind_speed_10m',
    hourly: 'precipitation_probability',
    forecast_days: '1',
    timezone: 'Asia/Seoul',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal })
  if (!res.ok) throw new Error(`날씨 조회 실패 (${res.status})`)
  const data = (await res.json()) as OpenMeteoResponse

  // 지금부터 3시간 동안의 최대 강수확률
  const nowHour = new Date().getHours()
  const probs = data.hourly.precipitation_probability.slice(nowHour, nowHour + 3)
  const precipitationProbability = probs.length ? Math.max(...probs) : 0

  const temperature = Math.round(data.current.temperature_2m)
  const windSpeed = Math.round(data.current.wind_speed_10m)
  return {
    temperature,
    precipitationProbability,
    windSpeed,
    ...judge(temperature, precipitationProbability, windSpeed),
  }
}
