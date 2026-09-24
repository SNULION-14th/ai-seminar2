// 화면 켜짐 유지 — TRK-09. Screen Wake Lock API. 지원하지 않는 브라우저에서는 그냥 아무 일도 없다.
import { useEffect, useRef, useState } from 'react'

export interface UseWakeLockResult {
  /** 이 브라우저가 Wake Lock API를 지원하는지. false면 토글 UI 자체를 숨긴다 */
  supported: boolean
  /** 화면 켜짐 유지가 실제로 걸려 있는지 */
  active: boolean
}

/** enabled가 true인 동안 화면이 꺼지지 않게 한다. 탭이 백그라운드로 갔다 돌아오면 다시 건다. */
export function useWakeLock(enabled: boolean): UseWakeLockResult {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!enabled || !supported) return

    let cancelled = false

    async function acquire() {
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void sentinel.release()
          return
        }
        sentinelRef.current = sentinel
        setActive(true)
        sentinel.addEventListener('release', () => setActive(false))
      } catch {
        setActive(false)
      }
    }

    void acquire()

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void sentinelRef.current?.release()
      sentinelRef.current = null
    }
  }, [enabled, supported])

  return { supported, active }
}
