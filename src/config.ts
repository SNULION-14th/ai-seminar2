import type { SourceId } from './sources/types'

export const LOCATION = { name: '서울', lat: 37.5665, lon: 126.978 }

export interface SourceMeta {
  id: SourceId
  name: string
  logo: string
  /** 로고만으로 모델을 알기 어려운 경우 로고 옆에 붙이는 짧은 이름 */
  tag?: string
  /** 소스 구분색. 행의 점과 강수확률 그래프 선에 같이 쓴다. */
  color: string
}

export const SOURCES: SourceMeta[] = [
  { id: 'kma', name: '기상청', logo: '/logos/kma.svg', color: '#2563EB' },
  { id: 'ecmwf', name: 'ECMWF', logo: '/logos/ecmwf.svg', color: '#16A34A' },
  { id: 'gfs', name: 'NOAA GFS', logo: '/logos/noaa.svg', tag: 'GFS', color: '#7C3AED' },
  { id: 'icon', name: 'DWD ICON', logo: '/logos/dwd.png', tag: 'ICON', color: '#F97316' },
]

export const HOURS = 24
export const REFRESH_MS = 30 * 60 * 1000
