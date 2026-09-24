// 실제 GPS 위치 수집 — TRK-02, TRK-13
// navigator.geolocation.watchPosition으로 위치를 구독하고, 지원하지 않거나 권한이 거부되면
// 크래시 없이 상태로 알린다. 필터링(정확도·샘플링)은 store의 addPoint → domain/tracking.ts가 한다.
import { useEffect, useRef, useState } from 'react'
import type { GpsCandidate } from '../../domain/tracking'

export type GeolocationStatus = 'idle' | 'watching' | 'unsupported' | 'denied' | 'error'

export interface UseGeolocationResult {
  status: GeolocationStatus
  /** 마지막으로 받은 위치의 정확도(m). 화면에 참고 표시용 */
  lastAccuracy: number | null
}

interface WatchState {
  phase: 'watching' | 'denied' | 'error'
  lastAccuracy: number | null
}

const INITIAL_WATCH_STATE: WatchState = { phase: 'watching', lastAccuracy: null }

/**
 * enabled가 true인 동안 위치를 구독해 onPoint로 넘긴다.
 * geolocation API가 없거나(구형 브라우저), 사용자가 권한을 거부하면 status로만 알리고 앱은 그대로 동작한다.
 */
export function useGeolocation(enabled: boolean, onPoint: (candidate: GpsCandidate) => void): UseGeolocationResult {
  const supported = typeof navigator !== 'undefined' && !!navigator.geolocation
  const [watch, setWatch] = useState<WatchState>(INITIAL_WATCH_STATE)

  // 최신 onPoint를 구독 콜백에서 쓰기 위한 ref. 렌더 중이 아니라 effect에서만 갱신한다.
  const onPointRef = useRef(onPoint)
  useEffect(() => {
    onPointRef.current = onPoint
  })

  useEffect(() => {
    if (!enabled || !supported) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setWatch({ phase: 'watching', lastAccuracy: pos.coords.accuracy })
        onPointRef.current({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: pos.coords.accuracy,
          t: pos.timestamp,
        })
      },
      (err) => {
        setWatch((s) => ({ ...s, phase: err.code === err.PERMISSION_DENIED ? 'denied' : 'error' }))
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [enabled, supported])

  const status: GeolocationStatus = !enabled ? 'idle' : !supported ? 'unsupported' : watch.phase

  return { status, lastAccuracy: watch.lastAccuracy }
}
