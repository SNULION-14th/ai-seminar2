import { Luggage } from 'lucide-react'
import type { City } from '../types'

interface Props {
  cities: City[]
  cityId: string
  start: string
  end: string
  error: string | null
  onCity: (id: string) => void
  onStart: (v: string) => void
  onEnd: (v: string) => void
}

export function TripHeader({ cities, cityId, start, end, error, onCity, onStart, onEnd }: Props) {
  return (
    <header className="header">
      <div className="brand">
        <Luggage size={26} strokeWidth={2.2} />
        <div>
          <h1>Trip Pocket</h1>
          <p>날씨 보고, 짐 싸고, 갈 곳 담기</p>
        </div>
      </div>
      <div className="controls">
        <label>
          도시
          <select value={cityId} onChange={(e) => onCity(e.target.value)}>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label>
          출발
          <input type="date" value={start} onChange={(e) => onStart(e.target.value)} />
        </label>
        <label>
          도착
          <input type="date" value={end} min={start} onChange={(e) => onEnd(e.target.value)} />
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
    </header>
  )
}
