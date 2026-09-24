import { useCallback, useState } from 'react'
import { BookOpen, Pause, Play, RotateCcw, Square } from 'lucide-react'
import { capitalize } from '../../date'
import { usePomodoro } from '../../hooks/usePomodoro'
import type { Assignment, StudyStats, UserProfile } from '../../types/models'
import { ScreenHeading } from '../assignments/AssignmentsScreen'

export function LibraryScreen({ profile, assignments, stats, housePoints, onStatsChange, onAwardPoints }: {
  profile: UserProfile
  assignments: Assignment[]
  stats: StudyStats
  housePoints: number
  onStatsChange: (stats: StudyStats) => void
  onAwardPoints: (amount: number) => void
}) {
  const available = assignments.filter((assignment) => !assignment.completed)
  const [currentAssignment, setCurrentAssignment] = useState(available[0]?.id ?? '')
  const handleComplete = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10)
    onStatsChange({ ...stats, studySessions: stats.studySessions + 1, focusedMinutes: stats.focusedMinutes + 25, streak: Math.max(1, stats.streak), sessionDates: [...stats.sessionDates, today] })
    onAwardPoints(10)
  }, [onAwardPoints, onStatsChange, stats])
  const timer = usePomodoro(handleComplete)
  const isActive = timer.status !== 'idle'
  const selected = assignments.find((assignment) => assignment.id === currentAssignment)
  const minutes = Math.floor(timer.secondsLeft / 60)
  const seconds = timer.secondsLeft % 60

  return (
    <div className={`screen library-screen ${isActive ? 'library-active' : ''}`}>
      <div className="library-environment" aria-hidden="true"><div className="library-stars" /><div className="library-shelves left" /><div className="library-shelves right" /><div className="library-candles">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div><div className="library-floor" /></div>
      {!isActive && <ScreenHeading eyebrow="LIBRARY" title="Study Session" />}
      {isActive && <p className="active-kicker">LIBRARY · ACTIVE SESSION</p>}
      <div className="library-content">
        <section className="focus-zone">
          {!isActive && <div className="timer-tabs"><button type="button" className={timer.mode === 'study' ? 'active' : ''} onClick={() => timer.setMode('study')}>Study 25 min</button><button type="button" className={timer.mode === 'break' ? 'active' : ''} onClick={() => timer.setMode('break')}>Break 5 min</button></div>}
          <div className={`timer-ring ${isActive ? 'active' : ''}`}>
            <time aria-live="polite">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</time>
            <span>{timer.mode === 'study' ? 'STUDY' : 'BREAK'}</span>
          </div>
          <label className="current-assignment"><span>Current Assignment</span>{isActive ? <strong>{selected?.title ?? 'Independent study'}</strong> : <select value={currentAssignment} onChange={(event) => setCurrentAssignment(event.target.value)}><option value="">Independent study</option>{available.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.title}</option>)}</select>}</label>
          <div className="timer-actions">
            {timer.status === 'idle' && <button type="button" className="primary-action" onClick={timer.start}><Play size={14} /> Start</button>}
            {timer.status === 'running' && <button type="button" className="primary-action" onClick={timer.pause}><Pause size={14} /> Pause</button>}
            {timer.status === 'paused' && <button type="button" className="primary-action" onClick={timer.resume}><Play size={14} /> Resume</button>}
            {!isActive && <button type="button" className="secondary-action" onClick={timer.reset}><RotateCcw size={14} /> Reset</button>}
            {isActive && <button type="button" className="secondary-action" onClick={timer.end}><Square size={13} /> End Session</button>}
          </div>
        </section>
        {!isActive && <aside className="library-stats"><StatCard label="Today’s Sessions" value={String(stats.studySessions)} /><StatCard label="Focused Today" value={`${stats.focusedMinutes} min`} /><div className="house-meter"><span>House Points</span><div className={`hourglass house-${profile.house}`}><i style={{ height: `${Math.min(100, housePoints / 2)}%` }} /></div><strong>{housePoints}</strong><small>{capitalize(profile.house)}</small></div></aside>}
      </div>
      {isActive && <div className="active-bookmark"><BookOpen size={14} /> Quiet focus is in progress</div>}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>
}
