// DS-04 흐르는 진행률: 물결 SVG로 채워지는 진행률 바. 값이 바뀔 때만 잠깐 출렁인다 (TRK-04, SHR-01).
import type { ReactNode } from 'react'
import styles from './WaveProgress.module.css'

export interface WaveProgressProps {
  value: number // 0-100
  label?: string
  caption?: ReactNode
  showValue?: boolean
  size?: 'md' | 'lg'
}

// 한 주기 40 단위 물결 4주기(160). 절반(80)만큼 흘려도 이음매가 보이지 않는다.
const WAVE = 'M0 8 Q10 2 20 8 T40 8 T60 8 T80 8 T100 8 T120 8 T140 8 T160 8 V40 H0 Z'

export function WaveProgress({
  value,
  label = '전체 진행률',
  caption,
  showValue = true,
  size = 'md',
}: WaveProgressProps) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  const rounded = Math.round(pct)

  return (
    <div className={`${styles.root} ${styles[size]}`}>
      <div className={styles.row}>
        <div
          className={styles.track}
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={rounded}
          aria-valuetext={`${rounded}%`}
        >
          <div className={styles.fill} style={{ width: `${pct}%` }}>
            {/* key로 값이 바뀔 때마다 다시 마운트해 출렁임을 한 번 재생한다 */}
            <svg key={rounded} className={styles.waves} viewBox="0 0 160 40" preserveAspectRatio="none" aria-hidden="true">
              <path className={styles.back} d={WAVE} />
              <path className={styles.front} d={WAVE} />
            </svg>
          </div>
        </div>
        {showValue && (
          <span className={`${styles.value} num`} aria-hidden="true">
            {rounded}%
          </span>
        )}
      </div>
      {caption && <div className={styles.caption}>{caption}</div>}
    </div>
  )
}
