// 준비물 체크리스트 패널 (PLAN-07)
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { DEFAULT_CHECKLIST_ITEMS } from './checklistDefaults'
import styles from './ChecklistPanel.module.css'

interface ChecklistPanelProps {
  checklist: Record<string, boolean>
  onToggle: (item: string) => void
  onAdd: (item: string) => void
  onRemove: (item: string) => void
}

export function ChecklistPanel({ checklist, onToggle, onAdd, onRemove }: ChecklistPanelProps) {
  const [newItem, setNewItem] = useState('')

  const defaultItems = DEFAULT_CHECKLIST_ITEMS.filter((item) => item in checklist)
  const customItems = Object.keys(checklist).filter(
    (item) => !(DEFAULT_CHECKLIST_ITEMS as readonly string[]).includes(item),
  )

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!newItem.trim()) return
    onAdd(newItem)
    setNewItem('')
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>준비물 체크리스트</h3>
      <ul className={styles.list}>
        {[...defaultItems, ...customItems].map((item) => (
          <li key={item} className={styles.item}>
            <label className={styles.itemLabel}>
              <input
                type="checkbox"
                checked={checklist[item] ?? false}
                onChange={() => onToggle(item)}
              />
              <span>{item}</span>
            </label>
            {customItems.includes(item) && (
              <button
                type="button"
                className={styles.remove}
                onClick={() => onRemove(item)}
                aria-label={`${item} 삭제`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <form className={styles.addForm} onSubmit={handleAdd}>
        <input
          type="text"
          className={styles.addInput}
          placeholder="준비물 추가"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          aria-label="준비물 이름"
        />
        <button type="submit" className={styles.addButton}>
          추가
        </button>
      </form>
    </div>
  )
}
