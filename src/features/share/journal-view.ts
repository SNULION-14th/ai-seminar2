// 기록 화면(#/journal)·공유 카드/페이지에서 쓰는 순수 헬퍼. domain/progress.ts와 같은 규칙으로
// "달린 구간"을 판정한다. (SHR-01, SHR-02) React·DOM은 쓰지 않는다.
import { CENTERS } from '../../data/centers'
import type { ShareDayDistance } from '../../domain/share-codec'
import type { CertCenter, LatLng, Ride } from '../../domain/types'

/**
 * 가장 멀리 찍은 인증센터의 누적 km. ui-kit RiverLine의 progressKm(여기까지 컬러)에 그대로 넘긴다.
 * 찍은 도장이 없으면 0.
 */
export function furthestStampedKm(
  stampedCenterIds: ReadonlySet<string>,
  centers: readonly CertCenter[] = CENTERS,
): number {
  return centers.reduce(
    (max, c) => (stampedCenterIds.has(c.id) ? Math.max(max, c.kmFromStart) : max),
    0,
  )
}

/** "3시간 12분" / "42분"처럼 라이딩 시간을 한국어로 짧게 표현한다 */
export function formatMovingTime(sec: number): string {
  const totalMinutes = Math.round(sec / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours <= 0) return `${minutes}분`
  if (minutes === 0) return `${hours}시간`
  return `${hours}시간 ${minutes}분`
}

const journalDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
})

/** ISO 날짜/일시를 "10월 3일 (토)"처럼 표현한다 */
export function formatJournalDate(iso: string): string {
  return journalDateFormatter.format(new Date(iso))
}

/** 라이드를 시작 날짜(YYYY-MM-DD, 기기 로컬 시각) 기준으로 묶어 일자별 거리 합을 만든다 (SHR-04) */
export function groupRidesByDay(rides: readonly Ride[]): ShareDayDistance[] {
  const byDate = new Map<string, number>()
  for (const ride of rides) {
    const date = ride.startedAt.slice(0, 10)
    byDate.set(date, (byDate.get(date) ?? 0) + ride.distanceKm)
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, distanceKm]) => ({ date, distanceKm }))
}

/** 모든 라이드의 GPS 점을 시간순으로 이어 붙인다. SHR-07에서 정밀 궤적을 포함하기로 했을 때만 쓴다 */
export function concatRideTracks(rides: readonly Ride[]): LatLng[] {
  return [...rides]
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .flatMap((ride) => ride.track.map(({ lat, lng }): LatLng => ({ lat, lng })))
}

/** 날짜 목록에서 "10월 3일 (토)" 또는 "10월 3일 (토) ~ 10월 7일 (수)"처럼 기간을 표현한다 */
export function formatPeriod(dates: readonly string[]): string | null {
  if (dates.length === 0) return null
  const sorted = [...dates].sort()
  const start = sorted[0]
  const end = sorted[sorted.length - 1]
  return start === end ? formatJournalDate(start) : `${formatJournalDate(start)} ~ ${formatJournalDate(end)}`
}
