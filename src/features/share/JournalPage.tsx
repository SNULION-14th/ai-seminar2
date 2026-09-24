import { Share2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { RiverLine, WaveProgress } from '../../components'
import { CENTERS } from '../../data/centers'
import { ROUTE } from '../../data/route'
import { progress } from '../../domain/progress'
import { selectRides, useRidesStore } from '../../store/ride'
import { selectStamps, useStampsStore } from '../../store/stamps'
import { BackupPanel } from './components/BackupPanel'
import { CompletionCelebration } from './components/CompletionCelebration'
import { JournalTimeline } from './components/JournalTimeline'
import { ShareCardSheet } from './components/ShareCardSheet'
import { StampBoard } from './components/StampBoard'
import { hasCelebratedCompletion, markCompletionCelebrated } from './completion'
import styles from './JournalPage.module.css'
import { furthestStampedKm } from './journal-view'

/** 기록 화면(#/journal) — 누적 진행 지도, 도장판, 일지 타임라인 (SHR-01) */
export function JournalPage() {
  const stamps = useStampsStore(selectStamps)
  const rides = useRidesStore(selectRides)
  const [isShareOpen, setShareOpen] = useState(false)
  const [celebrationDismissed, setCelebrationDismissed] = useState(false)

  const stampedCenterIds = useMemo(() => new Set(stamps.map((s) => s.centerId)), [stamps])
  const stampedAtByCenter = useMemo(
    () => new Map(stamps.map((s) => [s.centerId, s.stampedAt])),
    [stamps],
  )
  const { percent, stampCount, totalCenters, distanceKm } = useMemo(
    () => progress(stamps, rides),
    [stamps, rides],
  )
  const progressKm = useMemo(() => furthestStampedKm(stampedCenterIds), [stampedCenterIds])

  // 완주 연출(SHR-08): 도장을 모두 찍은 순간을 딱 한 번만 축하한다.
  // localStorage 플래그(gt.completionCelebrated)가 이미 있으면 다시 보여 주지 않는다.
  const isComplete = totalCenters > 0 && stampCount === totalCenters
  const showCelebration = isComplete && !celebrationDismissed && !hasCelebratedCompletion()

  function handleCelebrationDone() {
    markCompletionCelebrated()
    setCelebrationDismissed(true)
    setShareOpen(true)
  }

  return (
    <section className={styles.page}>
      <div className={styles.headRow}>
        <h1 className="page-title">기록</h1>
        <button type="button" className={styles.shareTrigger} onClick={() => setShareOpen(true)}>
          <Share2 size={18} aria-hidden="true" />
          공유 카드 만들기
        </button>
      </div>

      <div className={styles.section}>
        <WaveProgress
          value={percent}
          caption={`도장 ${stampCount}/${totalCenters} · ${distanceKm.toFixed(1)}km`}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>누적 진행 지도</h2>
        <RiverLine
          points={ROUTE}
          progressKm={progressKm}
          centers={CENTERS}
          stampedIds={[...stampedCenterIds]}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>도장판</h2>
        <StampBoard stampedCenterIds={stampedCenterIds} stampedAtByCenter={stampedAtByCenter} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>일지</h2>
        <JournalTimeline rides={rides} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>데이터 백업</h2>
        <BackupPanel />
      </div>

      {showCelebration ? <CompletionCelebration onDone={handleCelebrationDone} /> : null}

      {isShareOpen ? (
        <ShareCardSheet stamps={stamps} rides={rides} onClose={() => setShareOpen(false)} />
      ) : null}
    </section>
  )
}
