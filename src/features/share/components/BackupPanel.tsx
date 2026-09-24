import { Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { selectPlan, usePlanStore } from '../../../store/plan'
import { selectRides, useRidesStore } from '../../../store/ride'
import { selectStamps, useStampsStore } from '../../../store/stamps'
import { buildBackup, parseBackup } from '../backup'
import { downloadBlob } from '../share-io'
import styles from './BackupPanel.module.css'

type Status = { kind: 'idle' | 'done' | 'error'; message?: string }

/** 데이터 백업 내보내기/가져오기 (SHR-09) */
export function BackupPanel() {
  const plan = usePlanStore(selectPlan)
  const stamps = useStampsStore(selectStamps)
  const rides = useRidesStore(selectRides)
  const setPlan = usePlanStore((s) => s.setPlan)
  const clearPlan = usePlanStore((s) => s.clearPlan)
  const replaceStamps = useStampsStore((s) => s.replaceStamps)
  const replaceRides = useRidesStore((s) => s.replaceRides)

  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const backup = buildBackup({ plan, stamps, rides })
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `gangttara633-backup-${backup.exportedAt.slice(0, 10)}.json`)
    setStatus({ kind: 'done', message: '백업 파일을 저장했어요.' })
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text()
      const parsed = parseBackup(JSON.parse(text))
      if (!parsed) {
        setStatus({ kind: 'error', message: '올바른 백업 파일이 아니에요.' })
        return
      }
      if (parsed.plan) setPlan(parsed.plan)
      else clearPlan()
      replaceStamps(parsed.stamps)
      replaceRides(parsed.rides)
      setStatus({ kind: 'done', message: '백업을 가져왔어요.' })
    } catch {
      setStatus({ kind: 'error', message: '올바른 백업 파일이 아니에요.' })
    }
  }

  return (
    <div>
      <div className={styles.row}>
        <button type="button" className={styles.btn} onClick={handleExport}>
          <Download size={18} aria-hidden="true" />
          백업 내보내기
        </button>
        <button type="button" className={styles.btn} onClick={() => fileInputRef.current?.click()}>
          <Upload size={18} aria-hidden="true" />
          백업 가져오기
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="visually-hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void handleImportFile(file)
          }}
        />
      </div>
      <p className={status.kind === 'error' ? `${styles.status} ${styles.statusError}` : styles.status} role="status">
        {status.message ?? ''}
      </p>
    </div>
  )
}
