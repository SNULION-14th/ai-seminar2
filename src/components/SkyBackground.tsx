// DS-05 시간대 하늘: 트래킹 화면 배경이 기기 시계에 따라 새벽/낮/노을/밤으로 서서히 바뀐다.
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { SKY_PHASES, skyPhaseOf } from './sky'
import type { SkyPhase } from './sky'
import styles from './SkyBackground.module.css'

export type { SkyPhase } from './sky'

export interface SkyBackgroundProps {
  phase?: SkyPhase // 강제 지정 (시뮬레이션·테스트)
  now?: Date // 이 시각 기준으로 계산
  children?: ReactNode
  className?: string
}

const TICK_MS = 60_000

/** 기기 시계. phase나 now가 주어지면 타이머를 돌리지 않는다. */
function useClock(enabled: boolean): Date {
  const [clock, setClock] = useState(() => new Date())
  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => setClock(new Date()), TICK_MS)
    return () => window.clearInterval(id)
  }, [enabled])
  return clock
}

export function SkyBackground({ phase, now, children, className }: SkyBackgroundProps) {
  const clock = useClock(phase === undefined && now === undefined)
  const active = phase ?? skyPhaseOf(now ?? clock)

  return (
    <div className={`${styles.sky} ${className ?? ''}`} data-sky={active}>
      {SKY_PHASES.map((p) => (
        <div
          key={p}
          className={`${styles.layer} ${styles[p]} ${p === active ? styles.active : ''}`}
          aria-hidden="true"
        />
      ))}
      <div className={styles.content}>{children}</div>
    </div>
  )
}
