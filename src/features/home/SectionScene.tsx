// DS-01 구간별 배경 풍경. 산·강 실루엣은 코드로 만든 SVG path다 (design-system.md §4).
import type { SectionId } from '../../domain/types'
import styles from './Home.module.css'

interface SectionSceneProps {
  id: SectionId
  active: boolean
}

// 레이어별 패럴랙스 세기: far < mid < near
const layer = (depth: 'far' | 'mid' | 'near') => `${styles.layer} ${styles[depth]}`

function Scene({ id }: { id: SectionId }) {
  switch (id) {
    case 'ara': // 서해 갑문과 넓은 물길
      return (
        <>
          <path className={layer('far')} d="M0 170Q60 150 120 165T240 160T400 168V240H0Z" />
          <g className={layer('mid')}>
            <rect className={styles.structure} x="292" y="118" width="12" height="62" rx="3" />
            <rect className={styles.structure} x="336" y="118" width="12" height="62" rx="3" />
            <rect className={styles.structure} x="286" y="112" width="68" height="10" rx="4" />
          </g>
          <g className={layer('near')}>
            <path className={styles.water} d="M0 178H400V240H0Z" />
            <path className={styles.ripple} d="M24 200q12-6 24 0M110 214q12-6 24 0M210 198q12-6 24 0M300 220q12-6 24 0" />
          </g>
        </>
      )
    case 'hangang': // 낮은 산과 다리가 이어진 큰 강
      return (
        <>
          <path className={layer('far')} d="M0 150Q50 120 100 140T200 130T300 138T400 125V240H0Z" />
          <path className={layer('mid')} d="M0 178Q80 160 160 172T320 168T400 170V240H0Z" />
          <g className={layer('near')}>
            <path className={styles.water} d="M0 192H400V240H0Z" />
            <path className={styles.bridge} d="M-10 194Q40 168 90 194T190 194T290 194T390 194T490 194" />
          </g>
        </>
      )
    case 'namhan': // 부드럽게 겹친 언덕과 굽이치는 강
      return (
        <>
          <path className={layer('far')} d="M0 140C60 90 120 130 180 110S300 80 400 120V240H0Z" />
          <path className={layer('mid')} d="M0 175C70 140 140 170 210 150S330 140 400 160V240H0Z" />
          <path className={`${layer('near')} ${styles.water}`} d="M0 215C100 195 220 232 400 205V240H0Z" />
        </>
      )
    case 'saejae': // 이화령: 가장 높은 고개
      return (
        <>
          <path className={layer('far')} d="M0 150L40 110L70 130L120 60L160 100L200 70L250 120L290 50L340 105L400 80V240H0Z" />
          <g className={layer('mid')}>
            <path d="M0 185L50 140L90 165L150 110L210 160L260 125L320 170L360 140L400 160V240H0Z" />
            <path className={styles.road} d="M150 200L176 184L152 170L178 156L160 142" />
          </g>
          <path className={layer('near')} d="M0 215Q100 190 200 212T400 205V240H0Z" />
        </>
      )
    case 'nakdong': // 낙동강을 따라 바다로
      return (
        <>
          <circle className={`${layer('far')} ${styles.sun}`} cx="320" cy="120" r="22" />
          <path className={layer('far')} d="M0 165Q80 140 160 158T320 150T400 160V240H0Z" />
          <path className={`${layer('mid')} ${styles.water}`} d="M0 190C120 178 240 200 400 184V240H0Z" />
          <path className={`${layer('near')} ${styles.reed}`} d="M30 240V205M40 240V198M52 240V210M350 240V200M362 240V192M372 240V206" />
        </>
      )
  }
}

export function SectionScene({ id, active }: SectionSceneProps) {
  return (
    <svg
      className={`${styles.scene} ${active ? styles.sceneActive : ''}`}
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <Scene id={id} />
    </svg>
  )
}
