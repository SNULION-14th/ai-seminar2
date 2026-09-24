// 도메인 타입 계약 — docs/specs/domain-data.md §4
// 이 파일은 계약 파일이다. 바꿔야 하면 [SPEC-Q]로 Lead에게 요청한다 (agent-team.md §3).

export type SectionId = 'ara' | 'hangang' | 'namhan' | 'saejae' | 'nakdong'

export interface Section {
  id: SectionId
  name: string // "새재자전거길"
  order: number
  distanceKm: number
  difficulty: 1 | 2 | 3 // 1 평지, 3 고개
}

export interface CertCenter {
  id: string // "ihwaryeong"
  name: string // "이화령휴게소"
  sectionId: SectionId
  lat: number
  lng: number
  kmFromStart: number // 인천 기점 누적 거리
  elevationM: number
  nearbyTown?: string // 숙박 거점 후보 "문경"
}

export interface RoutePoint {
  lat: number
  lng: number
  km: number
  ele: number
}

// ---- 사용자 데이터 (localStorage/IndexedDB) ----

export type Pace = 'relaxed' | 'normal' | 'hard'

export interface TripPlan {
  id: string
  startDate: string // ISO date
  days: DayPlan[]
  pace: Pace
  createdAt: string
  checklist: Record<string, boolean>
}

export interface DayPlan {
  dayIndex: number // 1부터
  date: string
  fromCenterId: string
  toCenterId: string
  distanceKm: number
  climbM: number // 누적 상승 고도
  stayTown?: string
}

export interface Ride {
  id: string
  startedAt: string
  endedAt?: string
  track: TrackPoint[] // 샘플링된 GPS 좌표
  distanceKm: number
  movingTimeSec: number
  source: 'gps' | 'simulated'
  memo?: string
}

export interface TrackPoint {
  lat: number
  lng: number
  t: number
  acc?: number
}

export interface Stamp {
  centerId: string
  stampedAt: string
  rideId?: string
  method: 'auto' | 'manual' // 반경 진입 자동 제안 후 확인 = auto
}

// ---- 도메인 함수 반환 타입 (domain-data.md §5) ----

export interface LatLng {
  lat: number
  lng: number
}

/** snapToRoute 결과 */
export interface RouteSnap {
  km: number // 경로상 투영 지점의 누적 km
  lat: number // 투영 지점 좌표
  lng: number
  offsetKm: number // 원래 좌표와 투영 지점 사이 직선거리
  offRoute: boolean // offsetKm가 OFF_ROUTE_THRESHOLD_KM(0.3)를 넘으면 true
}

/** nextCenter 결과 */
export interface NextCenter {
  center: CertCenter
  remainingKm: number
}

/** progress 결과 */
export interface Progress {
  percent: number // 0-100, 도장 기준 진행률
  stampCount: number // 찍은 인증센터 수 (중복 제외, 알 수 없는 ID 제외)
  totalCenters: number
  distanceKm: number // 모든 라이드의 누적 거리
}
