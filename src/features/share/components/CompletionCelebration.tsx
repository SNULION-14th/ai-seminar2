import { RiverLine } from '../../../components'
import { CENTERS } from '../../../data/centers'
import { ROUTE } from '../../../data/route'
import { TOTAL_KM } from '../../../data/sections'
import styles from './CompletionCelebration.module.css'

interface CompletionCelebrationProps {
  onDone: () => void
}

const ALL_CENTER_IDS = CENTERS.map((c) => c.id)

/**
 * 완주 연출 (SHR-08) — 마지막 도장(낙동강하굿둑)을 찍으면 강줄기가 끝까지 채워진 모습과
 * 바다로 흘러드는 표시를 보여 준 뒤 공유 카드 만들기로 안내한다.
 */
export function CompletionCelebration({ onDone }: CompletionCelebrationProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="완주 연출">
      <h1 className={`page-title ${styles.title}`}>완주했어요!</h1>
      <p className={styles.subtitle}>633km를 모두 달려 강물이 바다에 닿았어요</p>

      <div className={styles.riverWrap}>
        <RiverLine points={ROUTE} progressKm={TOTAL_KM} centers={CENTERS} stampedIds={ALL_CENTER_IDS} />
        <span className={styles.mouth} aria-hidden="true">
          <span className={styles.pulse} />
        </span>
      </div>

      <button type="button" className={styles.cta} onClick={onDone}>
        공유 카드 만들기
      </button>
    </div>
  )
}
