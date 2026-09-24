// DS-05 시간대 하늘: 기기 시계 기준 단계. React·DOM을 쓰지 않는다.

export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night'

export const SKY_PHASES: readonly SkyPhase[] = ['dawn', 'day', 'dusk', 'night']

/** 새벽 05:00-07:00, 낮 07:00-17:00, 노을 17:00-19:30, 밤 그 외 */
export function skyPhaseOf(date: Date): SkyPhase {
  const minutes = date.getHours() * 60 + date.getMinutes()
  if (minutes >= 5 * 60 && minutes < 7 * 60) return 'dawn'
  if (minutes >= 7 * 60 && minutes < 17 * 60) return 'day'
  if (minutes >= 17 * 60 && minutes < 19 * 60 + 30) return 'dusk'
  return 'night'
}

export const SKY_LABEL: Record<SkyPhase, string> = {
  dawn: '새벽',
  day: '낮',
  dusk: '노을',
  night: '밤',
}
