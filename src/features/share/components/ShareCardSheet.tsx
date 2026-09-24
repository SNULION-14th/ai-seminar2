import { Loader2, Share2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { progress } from '../../../domain/progress'
import { encodeSharePayload } from '../../../domain/share-codec'
import type { Ride, Stamp } from '../../../domain/types'
import { concatRideTracks, formatPeriod, furthestStampedKm, groupRidesByDay } from '../journal-view'
import { captureCardPng, shareCard } from '../share-io'
import { ShareCard, type ShareCardData } from './ShareCard'
import styles from './ShareCardSheet.module.css'

const CARD_WIDTH = 1080
const CARD_HEIGHT = 1350
const PREVIEW_WIDTH = 300
const PREVIEW_SCALE = PREVIEW_WIDTH / CARD_WIDTH

type Template = 'paper' | 'night'
type Status = { kind: 'idle' | 'generating' | 'done' | 'error'; message?: string }

interface ShareCardSheetProps {
  stamps: readonly Stamp[]
  rides: readonly Ride[]
  onClose: () => void
}

/**
 * 공유 카드 시트 (SHR-02, 03, 06, 07). 닉네임·정밀 궤적 숨기기·템플릿을 고르고
 * 미리 본 뒤 카드를 캡처해서 공유 링크와 함께 공유한다.
 */
export function ShareCardSheet({ stamps, rides, onClose }: ShareCardSheetProps) {
  const [nickname, setNickname] = useState('')
  const [hideTrack, setHideTrack] = useState(true) // SHR-07: 기본 ON
  const [template, setTemplate] = useState<Template>('paper')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const stampedCenterIds = new Set(stamps.map((s) => s.centerId))
  const { percent, stampCount, totalCenters, distanceKm } = progress(stamps, rides)
  const days = groupRidesByDay(rides)
  const period = formatPeriod(days.map((d) => d.date))

  const cardData: ShareCardData = {
    nickname: nickname.trim(),
    percent,
    stampCount,
    totalCenters,
    distanceKm,
    dayCount: days.length,
    period,
    progressKm: furthestStampedKm(stampedCenterIds),
    stampedIds: [...stampedCenterIds],
  }

  async function handleShare() {
    if (!cardRef.current) return
    setStatus({ kind: 'generating' })
    try {
      const blob = await captureCardPng(cardRef.current)
      const encoded = encodeSharePayload({
        nickname: nickname.trim(),
        stampCenterIds: stamps.map((s) => s.centerId),
        days,
        track: hideTrack ? undefined : concatRideTracks(rides),
      })
      const url = `${window.location.origin}${window.location.pathname}#/s/${encoded}`
      const result = await shareCard({
        blob,
        url,
        title: '강따라 633',
        text: `${cardData.nickname || '익명의 라이더'}의 국토종주 기록을 확인해 보세요`,
      })
      setStatus({
        kind: 'done',
        message:
          result === 'downloaded'
            ? '이미지를 저장하고 링크를 복사했어요.'
            : '공유했어요.',
      })
    } catch {
      setStatus({ kind: 'error', message: '카드를 만들지 못했어요. 다시 시도해 주세요.' })
    }
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="공유 카드 만들기"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.headRow}>
          <h2 className="page-title">공유 카드 만들기</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            <X size={24} />
          </button>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>닉네임 (선택, 비우면 "익명의 라이더")</span>
          <input
            className={styles.input}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={40}
            placeholder="예: 한준"
          />
        </label>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={hideTrack}
            onChange={(e) => setHideTrack(e.target.checked)}
          />
          <span>출발/도착 지점 정밀 궤적 숨기기</span>
        </label>

        <div className={styles.templateRow}>
          <button
            type="button"
            className={
              template === 'paper' ? `${styles.templateBtn} ${styles.templateBtnActive}` : styles.templateBtn
            }
            onClick={() => setTemplate('paper')}
          >
            한지 라이트
          </button>
          <button
            type="button"
            className={
              template === 'night' ? `${styles.templateBtn} ${styles.templateBtnActive}` : styles.templateBtn
            }
            onClick={() => setTemplate('night')}
          >
            밤하늘 다크
          </button>
        </div>

        <div
          className={styles.previewFrame}
          style={{ width: PREVIEW_WIDTH, height: PREVIEW_WIDTH * (CARD_HEIGHT / CARD_WIDTH) }}
        >
          <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
            <ShareCard ref={cardRef} data={cardData} template={template} />
          </div>
        </div>

        <p
          className={status.kind === 'error' ? `${styles.status} ${styles.statusError}` : styles.status}
          role="status"
        >
          {status.message ?? ''}
        </p>

        <button
          type="button"
          className={styles.shareBtn}
          onClick={handleShare}
          disabled={status.kind === 'generating'}
        >
          {status.kind === 'generating' ? (
            <Loader2 size={20} className={styles.spin} aria-hidden="true" />
          ) : (
            <Share2 size={20} aria-hidden="true" />
          )}
          공유하기
        </button>
      </div>
    </div>
  )
}
