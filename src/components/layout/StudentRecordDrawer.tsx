import { X } from 'lucide-react'
import { capitalize } from '../../date'
import type { StudyStats, Subject, UserProfile } from '../../types/models'

export function StudentRecordDrawer({ open, profile, subjects, stats, housePoints, assignmentsCompleted, onClose }: {
  open: boolean
  profile: UserProfile
  subjects: Subject[]
  stats: StudyStats
  housePoints: number
  assignmentsCompleted: number
  onClose: () => void
}) {
  if (!open) return null
  const initials = profile.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="student-drawer parchment" role="dialog" aria-modal="true" aria-labelledby="record-title">
        <button type="button" className="icon-button drawer-close" aria-label="Close Student Record" onClick={onClose}><X size={18} /></button>
        <span className="eyebrow">HOGWARTS SCHOOL OF WITCHCRAFT AND WIZARDRY</span>
        <h2 id="record-title">Student Record</h2>
        <div className="record-identity">
          <span className={`record-monogram house-${profile.house}`}>{initials}</span>
          <div><strong>{profile.name}</strong><span>{profile.email}</span><small>{capitalize(profile.house)} · Year {profile.year}</small></div>
        </div>
        <p className="library-card">● LIBRARY CARD · NO. 0714</p>
        <section className="record-section"><span className="eyebrow">CURRENT SUBJECTS</span><div className="subject-tags">{subjects.map((subject) => <span key={subject.id} style={{ borderColor: subject.color }}>{subject.name}</span>)}</div></section>
        <section className="record-section"><span className="eyebrow">THIS WEEK</span><div className="record-stats"><div><strong>{assignmentsCompleted}</strong><span>Assignments</span></div><div><strong>{stats.studySessions}</strong><span>Sessions</span></div><div><strong>{stats.focusedMinutes}</strong><span>Focused min</span></div></div></section>
        <div className="record-highlight"><div><span>HOUSE POINTS</span><strong>{housePoints}</strong></div><div><span>STUDY STREAK</span><strong>{stats.streak} days</strong></div></div>
        <p className="record-note">Academic standing updated from this week’s completed work and Library sessions.</p>
      </aside>
    </div>
  )
}
