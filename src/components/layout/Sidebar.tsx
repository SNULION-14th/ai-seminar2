import { BookOpen, Clock3, Hourglass, LogOut, ScrollText } from 'lucide-react'
import { capitalize } from '../../date'
import type { UserProfile, View } from '../../types/models'

const navItems: { id: View; label: string; icon: typeof ScrollText }[] = [
  { id: 'assignments', label: 'Assignments', icon: ScrollText },
  { id: 'timetable', label: 'Timetable', icon: Clock3 },
  { id: 'library', label: 'Library', icon: BookOpen },
  { id: 'house-points', label: 'House Points', icon: Hourglass },
]

export function Sidebar({ profile, view, onNavigate, onProfile, onLogout }: {
  profile: UserProfile
  view: View
  onNavigate: (view: View) => void
  onProfile: () => void
  onLogout: () => void
}) {
  const initials = profile.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return (
    <aside className="sidebar">
      <div className="side-brand"><span>Studyin</span><strong>Hogwart</strong></div>
      <button type="button" className="profile-button" onClick={onProfile}>
        <span className={`profile-monogram house-${profile.house}`}>{initials}</span>
        <span><strong>{profile.name}</strong><small>{capitalize(profile.house)} · Year {profile.year}</small></span>
      </button>
      <button type="button" className="mobile-logout" aria-label="Log out" onClick={onLogout}><LogOut size={15} /></button>
      <nav aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          return <button type="button" key={item.id} className={view === item.id ? 'active' : ''} aria-current={view === item.id ? 'page' : undefined} onClick={() => onNavigate(item.id)}><Icon size={15} /><span>{item.label}</span></button>
        })}
      </nav>
      <div className="sidebar-footer">
        <p>{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' }).format(new Date())}</p>
        <span>LIBRARY · RESTRICTED SECTION</span>
        <button type="button" onClick={onLogout}><LogOut size={13} /> Log out</button>
      </div>
    </aside>
  )
}
