import { useState } from 'react'
import { Check, ExternalLink, Plus } from 'lucide-react'
import type { City, PlaceCategory } from '../types'
import { CATEGORY_LABEL } from '../data/cities'

interface Props {
  city: City
  picked: Set<string>
  onToggle: (id: string) => void
}

type Filter = 'all' | 'picked' | PlaceCategory

export function PlaceList({ city, picked, onToggle }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const categories = Array.from(new Set(city.places.map((p) => p.category)))
  const visible = city.places.filter((p) =>
    filter === 'all' ? true : filter === 'picked' ? picked.has(p.id) : p.category === filter,
  )
  const pickedCount = city.places.filter((p) => picked.has(p.id)).length

  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'picked', label: `담은 곳 ${pickedCount}` },
    ...categories.map((c) => ({ key: c as Filter, label: CATEGORY_LABEL[c] })),
  ]

  return (
    <section className="card">
      <div className="card-head">
        <h2>{city.name}에서 가볼 곳</h2>
      </div>
      <div className="chips">
        {chips.map((c) => (
          <button key={c.key} className={filter === c.key ? 'chip on' : 'chip'} onClick={() => setFilter(c.key)}>
            {c.label}
          </button>
        ))}
      </div>
      <ul className="places">
        {visible.length === 0 && <li className="muted">아직 담은 곳이 없어요</li>}
        {visible.map((p) => {
          const on = picked.has(p.id)
          const q = encodeURIComponent(`${p.name} ${city.nameEn}`)
          return (
            <li key={p.id} className={on ? 'on' : ''}>
              <div>
                <span className={`tag ${p.category}`}>{CATEGORY_LABEL[p.category]}</span>
                <strong>{p.name}</strong>
                <small>{p.note}</small>
              </div>
              <div className="actions">
                <a
                  className="icon"
                  href={`https://www.google.com/maps/search/?api=1&query=${q}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${p.name} 지도 열기`}
                >
                  <ExternalLink size={16} />
                </a>
                <button className={on ? 'pick on' : 'pick'} onClick={() => onToggle(p.id)}>
                  {on ? <Check size={16} /> : <Plus size={16} />}
                  {on ? '담음' : '담기'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
