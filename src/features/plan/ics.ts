// .ics 내보내기 (PLAN-08). 일자마다 종일 이벤트 1개.
import { getCenter } from '../../data/centers'
import type { TripPlan } from '../../domain/types'

/** RFC5545 텍스트 이스케이프 */
function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

/** YYYY-MM-DD → YYYYMMDD */
function toIcsDate(iso: string): string {
  return iso.replaceAll('-', '')
}

/** YYYY-MM-DD에 하루를 더한다 (전일 이벤트의 DTEND는 다음날 자정, exclusive) */
function nextDayIso(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + 1)
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function dtStampNow(): string {
  return `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
}

/** 활성 계획을 .ics(VCALENDAR) 텍스트로 만든다. 일자마다 종일 VEVENT 1개, 설명에 구간/거리/숙박 거점. */
export function buildIcsContent(plan: TripPlan): string {
  const dtstamp = dtStampNow()
  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//gangttara633//plan//KO', 'CALSCALE:GREGORIAN']

  for (const day of plan.days) {
    const from = getCenter(day.fromCenterId)?.name ?? day.fromCenterId
    const to = getCenter(day.toCenterId)?.name ?? day.toCenterId
    const summary = `DAY ${day.dayIndex} · ${from} → ${to}`
    const descriptionParts = [
      `${from} → ${to}`,
      `${day.distanceKm}km · 누적 상승고도 ${day.climbM}m`,
    ]
    if (day.stayTown) descriptionParts.push(`숙박: ${day.stayTown}`)

    lines.push(
      'BEGIN:VEVENT',
      `UID:${plan.id}-day${day.dayIndex}@gangttara633`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(day.date)}`,
      `DTEND;VALUE=DATE:${toIcsDate(nextDayIso(day.date))}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(descriptionParts.join('\n'))}`,
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

/** buildIcsContent 결과를 파일로 내려받는다 (브라우저 전용 부수 효과) */
export function downloadIcsFile(plan: TripPlan, filename = `강따라633-계획-${plan.startDate}.ics`) {
  const content = buildIcsContent(plan)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
