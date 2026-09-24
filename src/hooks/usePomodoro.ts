import { useCallback, useEffect, useRef, useState } from 'react'

type TimerMode = 'study' | 'break'

const DURATION = { study: 25 * 60, break: 5 * 60 }

export function usePomodoro(onStudyComplete: () => void) {
  const [mode, setModeState] = useState<TimerMode>('study')
  const [secondsLeft, setSecondsLeft] = useState(DURATION.study)
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle')
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onStudyComplete)

  useEffect(() => {
    onCompleteRef.current = onStudyComplete
  }, [onStudyComplete])

  useEffect(() => {
    if (status !== 'running') return
    const intervalId = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [status])

  useEffect(() => {
    if (secondsLeft !== 0 || completedRef.current) return
    completedRef.current = true
    setStatus('idle')
    if (mode === 'study') onCompleteRef.current()
  }, [mode, secondsLeft])

  const reset = useCallback(() => {
    completedRef.current = false
    setStatus('idle')
    setSecondsLeft(DURATION[mode])
  }, [mode])

  const setMode = useCallback((nextMode: TimerMode) => {
    completedRef.current = false
    setModeState(nextMode)
    setStatus('idle')
    setSecondsLeft(DURATION[nextMode])
  }, [])

  return {
    mode,
    secondsLeft,
    status,
    setMode,
    start: () => setStatus('running'),
    pause: () => setStatus('paused'),
    resume: () => setStatus('running'),
    reset,
    end: reset,
  }
}

