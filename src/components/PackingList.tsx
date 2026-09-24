import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import type { PackItem } from '../types'

interface Props {
  items: PackItem[]
  checked: Set<string>
  onToggle: (id: string) => void
  onAdd: (label: string) => void
  onRemove: (id: string) => void
}

export function PackingList({ items, checked, onToggle, onAdd, onRemove }: Props) {
  const [draft, setDraft] = useState('')
  const done = items.filter((i) => checked.has(i.id)).length

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const label = draft.trim()
    if (!label) return
    onAdd(label)
    setDraft('')
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>짐 체크리스트</h2>
        <span className="count">
          {done}/{items.length}
        </span>
      </div>
      <div className="progress">
        <div style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
      </div>
      <ul className="pack">
        {items.map((item) => (
          <li key={item.id} className={checked.has(item.id) ? 'done' : ''}>
            <label>
              <input type="checkbox" checked={checked.has(item.id)} onChange={() => onToggle(item.id)} />
              <span>{item.label}</span>
            </label>
            {item.auto ? (
              <span className="reason">{item.reason}</span>
            ) : (
              <button className="icon" aria-label={`${item.label} 삭제`} onClick={() => onRemove(item.id)}>
                <X size={16} />
              </button>
            )}
          </li>
        ))}
      </ul>
      <form className="add" onSubmit={submit}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="직접 추가 (예: 카메라)" />
        <button type="submit" aria-label="추가">
          <Plus size={18} />
        </button>
      </form>
    </section>
  )
}
