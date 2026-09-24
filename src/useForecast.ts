import { useEffect, useState } from 'react'
import { LOCATION, REFRESH_MS } from './config'
import { fetchKma, KmaNoKeyError } from './sources/kma'
import { fetchOpenMeteo } from './sources/openMeteo'
import type { SourceId, SourceState } from './sources/types'

const LOADING: Record<SourceId, SourceState> = {
  kma: { status: 'loading' },
  ecmwf: { status: 'loading' },
  gfs: { status: 'loading' },
  icon: { status: 'loading' },
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** 모든 소스를 병렬로 불러오고 REFRESH_MS마다 갱신한다. 소스 하나가 실패해도 나머지는 표시된다. */
export function useForecast() {
  const [now, setNow] = useState(() => new Date())
  const [states, setStates] = useState(LOADING)
  const [isDay, setIsDay] = useState<Map<string, boolean>>(() => new Map())

  useEffect(() => {
    let ctrl = new AbortController()

    const load = (at: Date) => {
      ctrl.abort()
      ctrl = new AbortController()
      const { signal } = ctrl
      const { lat, lon } = LOCATION

      fetchOpenMeteo(lat, lon, signal)
        .then(({ series, isDay }) => {
          setIsDay(isDay)
          setStates((s) => ({
            ...s,
            ecmwf: { status: 'ok', series: series.ecmwf },
            gfs: { status: 'ok', series: series.gfs },
            icon: { status: 'ok', series: series.icon },
          }))
        })
        .catch((e) => {
          if (signal.aborted) return
          const err: SourceState = { status: 'error', message: message(e) }
          setStates((s) => ({ ...s, ecmwf: err, gfs: err, icon: err }))
        })

      fetchKma(lat, lon, at, signal)
        .then((series) => setStates((s) => ({ ...s, kma: { status: 'ok', series } })))
        .catch((e) => {
          if (signal.aborted) return
          const kma: SourceState = e instanceof KmaNoKeyError ? { status: 'no-key' } : { status: 'error', message: message(e) }
          setStates((s) => ({ ...s, kma }))
        })
    }

    load(new Date())
    const timer = setInterval(() => {
      const at = new Date()
      setNow(at)
      load(at)
    }, REFRESH_MS)

    return () => {
      clearInterval(timer)
      ctrl.abort()
    }
  }, [])

  return { now, states, isDay }
}
