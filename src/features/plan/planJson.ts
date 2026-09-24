// "계획 JSON 복사" (PLAN-10). Google Calendar MCP 데모용 (mcp.md §3)
import { getCenter } from '../../data/centers'
import type { TripPlan } from '../../domain/types'

/** 활성 계획을 센터 ID 대신 한글 이름이 들어간, 사람이 읽을 수 있는 JSON 문자열로 만든다 */
export function buildReadablePlanJson(plan: TripPlan): string {
  const readable = {
    출발일: plan.startDate,
    페이스: plan.pace,
    일정: plan.days.map((d) => ({
      날짜: d.date,
      출발: getCenter(d.fromCenterId)?.name ?? d.fromCenterId,
      도착: getCenter(d.toCenterId)?.name ?? d.toCenterId,
      거리_km: d.distanceKm,
      상승고도_m: d.climbM,
      숙박: d.stayTown ?? null,
    })),
  }
  return JSON.stringify(readable, null, 2)
}
