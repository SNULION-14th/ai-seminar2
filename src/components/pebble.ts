// DS-06 조약돌 핸들의 순수 계산. React·DOM을 쓰지 않는다.

export interface PebbleStop {
  id: string // 인증센터 id
  km: number
  label?: string
}

/** km에 가장 가까운 stop의 인덱스. stops가 비어 있으면 -1 */
export function nearestStopIndex(km: number, stops: readonly PebbleStop[]): number {
  let best = -1
  let bestDist = Infinity
  stops.forEach((s, i) => {
    const d = Math.abs(s.km - km)
    if (d < bestDist) {
      best = i
      bestDist = d
    }
  })
  return best
}

/** 오버레이 안의 x 비율(0-1)을 domain km로 바꾼다 */
export function ratioToKm(ratio: number, domain: readonly [number, number]): number {
  const r = Math.max(0, Math.min(1, ratio))
  return domain[0] + (domain[1] - domain[0]) * r
}
