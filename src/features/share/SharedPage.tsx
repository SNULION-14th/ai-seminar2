import { AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { RiverLine } from '../../components'
import { CENTERS } from '../../data/centers'
import { ROUTE } from '../../data/route'
import { progress } from '../../domain/progress'
import { decodeSharePayload } from '../../domain/share-codec'
import type { Stamp } from '../../domain/types'
import { SharedDayList } from './components/SharedDayList'
import { StampBoard } from './components/StampBoard'
import { formatPeriod, furthestStampedKm } from './journal-view'
import styles from './SharedPage.module.css'

/**
 * 공유 페이지(#/s/:payload, SHR-05). 해시 payload는 신뢰할 수 없는 입력이므로
 * zod로 검증한 share-codec을 거쳐서만 읽는다. 스토어를 쓰지 않으므로 받은 사람
 * 기기의 로컬 데이터(계획/기록)는 전혀 건드리지 않는다.
 */
export function SharedPage() {
  const { payload } = useParams()
  const decoded = useMemo(() => decodeSharePayload(payload), [payload])

  // decoded가 null이어도 훅 호출 순서는 항상 같아야 한다(rules-of-hooks). 빈 배열로 안전하게 계산한다.
  const stampedCenterIds = useMemo(() => new Set(decoded?.stampCenterIds ?? []), [decoded])
  const progressKm = useMemo(() => furthestStampedKm(stampedCenterIds), [stampedCenterIds])
  const { percent, stampCount, totalCenters } = useMemo(() => {
    const asStamps: Stamp[] = (decoded?.stampCenterIds ?? []).map((centerId) => ({
      centerId,
      stampedAt: '',
      method: 'manual',
    }))
    return progress(asStamps, [])
  }, [decoded])

  if (!decoded) return <BrokenLink />

  const distanceKm = decoded.days.reduce((sum, d) => sum + d.distanceKm, 0)
  const nickname = decoded.nickname || '익명의 라이더'
  const period = formatPeriod(decoded.days.map((d) => d.date))

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className="page-title">{nickname} 님의 강따라 633</h1>
        <p className="page-lead">
          {Math.round(percent)}% 달렸어요{period ? ` · ${period}` : ''}
        </p>
        <div className={styles.statRow}>
          <span className="num">
            도장 {stampCount}/{totalCenters}
          </span>
          <span className="num">{distanceKm.toFixed(1)}km</span>
        </div>
      </header>

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
        <StampBoard stampedCenterIds={stampedCenterIds} />
      </div>

      {decoded.days.length > 0 ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>일자별 거리</h2>
          <SharedDayList days={decoded.days} />
        </div>
      ) : null}

      <Link to="/plan" className={styles.cta}>
        나도 계획 세우기
      </Link>
    </section>
  )
}

function BrokenLink() {
  return (
    <section className={styles.brokenWrap}>
      <AlertTriangle size={40} className={styles.brokenIcon} aria-hidden="true" />
      <h1 className="page-title">손상된 링크예요</h1>
      <p className="page-lead">
        링크가 손상되었거나 잘못됐어요. 공유한 분에게 링크를 다시 받아 보세요.
      </p>
      <Link to="/" className={styles.cta}>
        강따라 633 홈으로
      </Link>
    </section>
  )
}
