import { CHART_BOTTOM, chartY, hourLabel } from '../lib/chart'
import type { TimelineSlot } from '../lib/time'

export interface ChartLine {
  id: string
  color: string
  values: (number | null)[]
}

/** 소스별 강수확률을 한 그래프에 꺾은선으로 겹쳐 그린다. 값이 없는 시간은 선을 끊는다. */
export function PrecipChart({
  lines,
  timeline,
  col,
  height,
}: {
  lines: ChartLine[]
  timeline: TimelineSlot[]
  col: number
  height: number
}) {
  const width = col * timeline.length
  const x = (i: number) => i * col + col / 2
  const y = (p: number) => chartY(p, height)

  return (
    <svg className="chart" width={width} height={height} role="img" aria-label="소스별 강수확률 그래프">
      {[100, 50, 0].map((p) => (
        <line
          key={p}
          x1={0}
          x2={width}
          y1={y(p)}
          y2={y(p)}
          stroke="var(--line)"
          strokeDasharray={p === 0 ? undefined : '4 4'}
        />
      ))}
      {lines.map((line) => {
        let d = ''
        let pen = false
        line.values.forEach((v, i) => {
          if (v == null) {
            pen = false
            return
          }
          d += `${pen ? 'L' : 'M'}${x(i)} ${y(v)}`
          pen = true
        })
        return (
          <g key={line.id}>
            <path d={d} fill="none" stroke={line.color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
            {line.values.map((v, i) =>
              v == null ? null : (
                <circle key={i} cx={x(i)} cy={y(v)} r={4} fill="var(--bg)" stroke={line.color} strokeWidth={2.5} />
              ),
            )}
          </g>
        )
      })}
      {timeline.map((slot, i) => (
        <text key={slot.key} x={x(i)} y={height - CHART_BOTTOM + 30} textAnchor="middle" className="chart-hour">
          {hourLabel(slot, i)}
        </text>
      ))}
    </svg>
  )
}
