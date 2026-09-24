import type { House, UserProfile } from '../../types/models'
import { capitalize } from '../../date'
import { ScreenHeading } from '../assignments/AssignmentsScreen'

const baseline: Record<House, number> = { ravenclaw: 145, gryffindor: 132, hufflepuff: 118, slytherin: 108 }
const change: Record<House, number> = { ravenclaw: 35, gryffindor: 20, hufflepuff: 15, slytherin: 12 }

export function HousePointsScreen({ profile, housePoints }: { profile: UserProfile; housePoints: number }) {
  const points = { ...baseline, [profile.house]: housePoints }
  const standings = (Object.entries(points) as [House, number][]).sort((a, b) => b[1] - a[1])
  const max = Math.max(...standings.map(([, score]) => score))
  return (
    <div className="screen great-hall-screen points-screen">
      <ScreenHeading eyebrow="ACADEMIC YEAR 2026–27" title="House Points" />
      <p className="points-subtitle">House Cup standings — {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</p>
      <section className="standings">
        {standings.map(([house, score], index) => <div className={`standing house-${house}`} key={house}><span className="rank">{index + 1}</span><strong>{capitalize(house)}</strong><small>+{house === profile.house ? Math.max(change[house], housePoints - baseline[house] + change[house]) : change[house]} this week</small><div className="points-bar"><i style={{ width: `${(score / max) * 100}%` }} /></div><b>{score}</b></div>)}
      </section>
      <section className="points-rules"><span className="eyebrow">POINTS AWARDED</span><div><p>Assignment completed</p><strong>+5</strong></div><div><p>Study session completed</p><strong>+10</strong></div><small>Points recognise consistent academic work. Reopening and re-completing the same assignment does not grant points again.</small></section>
      <div className="hall-arches" aria-hidden="true" />
    </div>
  )
}
