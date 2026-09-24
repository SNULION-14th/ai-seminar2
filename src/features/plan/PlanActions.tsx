// 체크리스트·.ics 저장·계획 JSON 복사 (PLAN-07, PLAN-08, PLAN-10)
import { ClipboardCopy, Download, ListChecks } from 'lucide-react'
import { useState } from 'react'
import type { TripPlan } from '../../domain/types'
import { ChecklistPanel } from './ChecklistPanel'
import { downloadIcsFile } from './ics'
import { buildReadablePlanJson } from './planJson'
import styles from './PlanActions.module.css'

interface PlanActionsProps {
  plan: TripPlan
  onToggleChecklistItem: (item: string) => void
  onAddChecklistItem: (item: string) => void
  onRemoveChecklistItem: (item: string) => void
}

type CopyStatus = 'idle' | 'copied' | 'manual'

export function PlanActions({
  plan,
  onToggleChecklistItem,
  onAddChecklistItem,
  onRemoveChecklistItem,
}: PlanActionsProps) {
  const [showChecklist, setShowChecklist] = useState(false)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const [manualJson, setManualJson] = useState('')

  const handleCopyJson = async () => {
    const json = buildReadablePlanJson(plan)
    try {
      if (!navigator.clipboard) throw new Error('클립보드를 지원하지 않아요')
      await navigator.clipboard.writeText(json)
      setCopyStatus('copied')
      setManualJson('')
    } catch {
      // 클립보드 API를 못 쓰는 환경(비보안 컨텍스트 등)이면 직접 복사할 수 있게 보여준다
      setManualJson(json)
      setCopyStatus('manual')
    }
  }

  return (
    <div className={styles.actions}>
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => setShowChecklist((v) => !v)}
          aria-expanded={showChecklist}
        >
          <ListChecks size={18} aria-hidden="true" />
          체크리스트
        </button>
        <button type="button" className={styles.actionButton} onClick={() => downloadIcsFile(plan)}>
          <Download size={18} aria-hidden="true" />
          .ics 저장
        </button>
        <button type="button" className={styles.actionButton} onClick={handleCopyJson}>
          <ClipboardCopy size={18} aria-hidden="true" />
          계획 JSON 복사
        </button>
      </div>

      {copyStatus === 'copied' && (
        <p className={styles.status} role="status">
          계획을 JSON으로 복사했어요.
        </p>
      )}
      {copyStatus === 'manual' && (
        <div className={styles.manualCopy}>
          <p className={styles.status} role="status">
            자동 복사가 안 돼서 아래 내용을 직접 복사해 주세요.
          </p>
          <textarea
            className={styles.manualTextarea}
            readOnly
            value={manualJson}
            aria-label="계획 JSON"
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      )}

      {showChecklist && (
        <ChecklistPanel
          checklist={plan.checklist}
          onToggle={onToggleChecklistItem}
          onAdd={onAddChecklistItem}
          onRemove={onRemoveChecklistItem}
        />
      )}
    </div>
  )
}
