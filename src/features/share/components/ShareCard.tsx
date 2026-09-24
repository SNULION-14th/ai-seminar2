import { forwardRef } from 'react'
import { RiverLine } from '../../../components'
import { CENTERS } from '../../../data/centers'
import { ROUTE } from '../../../data/route'
import styles from './ShareCard.module.css'

export interface ShareCardData {
  nickname: string
  percent: number
  stampCount: number
  totalCenters: number
  distanceKm: number
  dayCount: number
  period: string | null
  progressKm: number
  stampedIds: string[]
}

interface ShareCardProps {
  data: ShareCardData
  /** 한지 라이트(기본) / 밤하늘 다크. 다크는 tokens.css의 [data-sky='night'] 오버라이드를 쓴다 */
  template?: 'paper' | 'night'
}

/**
 * 공유 카드 — 1080×1350(4:5) PNG로 캡처될 실제 크기의 DOM 카드 (SHR-02).
 * html-to-image가 캡처하는 원본 노드다. 미리보기에서는 부모가 CSS transform으로
 * 화면에 맞게 축소해서 보여 준다.
 */
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  { data, template = 'paper' },
  ref,
) {
  const {
    nickname,
    percent,
    stampCount,
    totalCenters,
    distanceKm,
    dayCount,
    period,
    progressKm,
    stampedIds,
  } = data
  const finished = percent >= 100

  return (
    <div ref={ref} className={styles.card} data-sky={template === 'night' ? 'night' : undefined}>
      <div className={styles.watermarkRow}>
        <span className={styles.watermark}>강따라 633</span>
        <span className={styles.tagline}>인천 → 부산 자전거 국토종주</span>
      </div>

      <div className={styles.body}>
        <h2 className={styles.greeting}>
          {nickname || '익명의 라이더'} 님{finished ? '이 완주했어요' : '의 국토종주 기록'}
        </h2>

        <div>
          <span className={`${styles.percent} num`}>{Math.round(percent)}</span>
          <span className={styles.percentLabel}>%</span>
        </div>

        <div className={styles.riverWrap}>
          <RiverLine
            points={ROUTE}
            progressKm={progressKm}
            centers={CENTERS}
            stampedIds={stampedIds}
            width={640}
            height={520}
          />
        </div>

        <div className={styles.statGrid}>
          <StatCell value={`${distanceKm.toFixed(1)}km`} label="총거리" />
          <StatCell value={`${dayCount}일`} label="라이딩 일수" />
          <StatCell value={`${stampCount}/${totalCenters}`} label="도장" />
          <StatCell value={period ?? '-'} label="기간" />
        </div>
      </div>

      <p className={styles.footer}>gangttara633.app</p>
    </div>
  )
})

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className={`${styles.statValue} num`}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}
