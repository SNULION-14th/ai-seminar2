// 인증센터 반경 150m 진입 시 자동으로 뜨는 도장 확인 시트 — TRK-06.
import { Stamp } from '../../components'
import type { CertCenter } from '../../domain/types'
import styles from './StampSheet.module.css'

export interface StampSheetProps {
  center: CertCenter
  /** 아직 확인 전이면 false, "찍을게요"를 눌러 저장한 뒤면 true (Stamp가 쿵 애니메이션을 재생한다) */
  stamped: boolean
  stampedAt?: string
  onConfirm: () => void
  onDismiss: () => void
  /** 도장 애니메이션이 끝나면 호출된다. 시트를 닫는 데 쓴다 */
  onAnimationEnd: () => void
}

export function StampSheet({ center, stamped, stampedAt, onConfirm, onDismiss, onAnimationEnd }: StampSheetProps) {
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={`${center.name} 도장 찍기`}>
      <div className={styles.sheet}>
        <Stamp
          name={center.name}
          stamped={stamped}
          date={stampedAt}
          animate
          size="lg"
          onStamped={onAnimationEnd}
        />
        {stamped ? (
          <p className={styles.title}>도장을 찍었어요!</p>
        ) : (
          <>
            <h2 className={styles.title}>{center.name}에 도착했어요</h2>
            <p>도장을 찍을까요?</p>
            <div className={styles.actions}>
              <button type="button" className={styles.dismissButton} onClick={onDismiss}>
                나중에
              </button>
              <button type="button" className={styles.confirmButton} onClick={onConfirm}>
                찍을게요
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
