import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { CITIES } from './data/cities'
import { addDays, diffDays, fetchTripWeather, toISO } from './lib/weather'
import { buildPackingList } from './lib/packing'
import { loadState, saveState, type SavedState } from './lib/storage'
import type { PackItem, WeatherResult } from './types'
import { TripHeader } from './components/TripHeader'
import { WeatherStrip } from './components/WeatherStrip'
import { PackingList } from './components/PackingList'
import { PlaceList } from './components/PlaceList'

const MAX_DAYS = 7
const saved = loadState()
const today = toISO(new Date())

type Fetched = { key: string; result: WeatherResult | null; error: string | null }

function App() {
  const [cityId, setCityId] = useState(saved.cityId ?? CITIES[0].id)
  const [start, setStart] = useState(saved.start ?? addDays(today, 3))
  const [end, setEnd] = useState(saved.end ?? addDays(today, 5))
  const [checked, setChecked] = useState<Set<string>>(new Set(saved.checked ?? []))
  const [custom, setCustom] = useState<SavedState['custom']>(saved.custom ?? [])
  const [picked, setPicked] = useState<Set<string>>(new Set(saved.picked ?? []))
  const [fetched, setFetched] = useState<Fetched | null>(null)

  const city = CITIES.find((c) => c.id === cityId) ?? CITIES[0]
  const span = diffDays(start, end)
  const rangeError =
    !start || !end
      ? '날짜를 선택해 주세요'
      : span < 0
        ? '도착일이 출발일보다 빨라요'
        : span >= MAX_DAYS
          ? `최대 ${MAX_DAYS}일까지 볼 수 있어요`
          : null

  const requestKey = rangeError ? null : `${city.id}|${start}|${end}`

  useEffect(() => {
    if (!requestKey) return
    let alive = true
    fetchTripWeather(city.lat, city.lon, start, end)
      .then((result) => alive && setFetched({ key: requestKey, result, error: null }))
      .catch((e: Error) => alive && setFetched({ key: requestKey, result: null, error: e.message }))
    return () => {
      alive = false
    }
  }, [requestKey, city.lat, city.lon, start, end])

  const current = fetched && fetched.key === requestKey ? fetched : null
  const loading = requestKey !== null && current === null
  const weather = current?.result ?? null

  const packItems: PackItem[] = useMemo(
    () => [
      ...buildPackingList(weather?.days ?? []),
      ...custom.map((c) => ({ ...c, reason: '', auto: false })),
    ],
    [weather, custom],
  )

  useEffect(() => {
    saveState({ cityId, start, end, checked: [...checked], custom, picked: [...picked] })
  }, [cityId, start, end, checked, custom, picked])

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  return (
    <div className="app">
      <TripHeader
        cities={CITIES}
        cityId={cityId}
        start={start}
        end={end}
        error={rangeError}
        onCity={setCityId}
        onStart={setStart}
        onEnd={setEnd}
      />
      <main>
        <WeatherStrip result={weather} loading={loading} error={current?.error ?? null} />
        <div className="grid">
          <PackingList
            items={packItems}
            checked={checked}
            onToggle={(id) => setChecked((s) => toggle(s, id))}
            onAdd={(label) => setCustom((c) => [...c, { id: `custom-${Date.now()}`, label }])}
            onRemove={(id) => {
              setCustom((c) => c.filter((x) => x.id !== id))
              setChecked((s) => {
                const next = new Set(s)
                next.delete(id)
                return next
              })
            }}
          />
          <PlaceList city={city} picked={picked} onToggle={(id) => setPicked((s) => toggle(s, id))} />
        </div>
      </main>
    </div>
  )
}

export default App
