export type PlaceCategory = 'sight' | 'food' | 'cafe' | 'night' | 'market'

export interface Place {
  id: string
  name: string
  category: PlaceCategory
  note: string
}

export interface City {
  id: string
  name: string
  nameEn: string
  country: string
  lat: number
  lon: number
  places: Place[]
}

export interface DailyWeather {
  date: string // YYYY-MM-DD (여행 날짜 기준)
  code: number // WMO weather code
  tMax: number
  tMin: number
  precipProb: number | null // forecast only
  precipSum: number
}

export type WeatherSource = 'forecast' | 'last-year'

export interface WeatherResult {
  source: WeatherSource
  days: DailyWeather[]
}

export interface PackItem {
  id: string
  label: string
  reason: string
  auto: boolean
}
