import { useState } from 'react'
import './App.css'
import { addDays, toDateKey } from './date'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { Assignment, AuthRecord, Schedule, StudyStats, Subject, UserProfile, View } from './types/models'
import { AuthScreen } from './components/auth/AuthScreen'
import { Sidebar } from './components/layout/Sidebar'
import { StudentRecordDrawer } from './components/layout/StudentRecordDrawer'
import { AssignmentsScreen } from './components/assignments/AssignmentsScreen'
import { TimetableScreen } from './components/timetable/TimetableScreen'
import { LibraryScreen } from './components/library/LibraryScreen'
import { HousePointsScreen } from './components/house-points/HousePointsScreen'

const today = toDateKey(new Date())

const seedSubjects: Subject[] = [
  { id: 'cell-biology', name: 'Cell Biology', color: '#9b4747' },
  { id: 'genomics', name: 'Genomics', color: '#4a6aaa' },
  { id: 'programming', name: 'Programming', color: '#43735c' },
  { id: 'laboratory', name: 'Laboratory', color: '#a7863f' },
]

const seedAssignments: Assignment[] = [
  { id: 'a1', title: 'Review Chapter 11', subjectId: 'cell-biology', date: today, dueTime: '14:00', priority: 'high', completed: false, pointsAwarded: false },
  { id: 'a2', title: 'Prepare mitosis notes', subjectId: 'cell-biology', date: today, priority: 'medium', completed: false, pointsAwarded: false },
  { id: 'a3', title: 'Read genomics paper', subjectId: 'genomics', date: today, priority: 'medium', completed: true, pointsAwarded: true },
  { id: 'a4', title: 'Summarise Figure 3', subjectId: 'genomics', date: today, priority: 'low', completed: false, pointsAwarded: false },
  { id: 'a5', title: 'Practice SQL', subjectId: 'programming', date: today, dueTime: '20:00', priority: 'medium', completed: true, pointsAwarded: true },
  { id: 'a6', title: 'Backend assignment', subjectId: 'programming', date: today, priority: 'high', completed: false, pointsAwarded: false },
  { id: 'a7', title: 'Prepare lab report', subjectId: 'laboratory', date: toDateKey(addDays(new Date(), 2)), dueTime: '17:00', priority: 'high', completed: false, pointsAwarded: false },
]

const seedSchedules: Schedule[] = [
  { id: 's1', title: 'Cell Biology', date: today, startTime: '09:00', endTime: '10:15', category: 'Lecture' },
  { id: 's2', title: 'Nursing Seminar', date: today, startTime: '11:00', endTime: '12:00', category: 'Meeting' },
  { id: 's3', title: 'Team Meeting', date: today, startTime: '14:00', endTime: '15:30', category: 'Study' },
  { id: 's4', title: 'SQL Practice', date: today, startTime: '16:30', endTime: '17:30', category: 'Personal' },
]

function App() {
  const [auth, setAuth] = useLocalStorage<AuthRecord | null>('studyinhogwart.auth', null)
  const [profile, setProfile] = useLocalStorage<UserProfile>('studyinhogwart.profile', { name: 'Ye Eun', email: 'student@studyinhogwart.local', house: 'ravenclaw', year: 3 })
  const [subjects, setSubjects] = useLocalStorage<Subject[]>('studyinhogwart.subjects', seedSubjects)
  const [assignments, setAssignments] = useLocalStorage<Assignment[]>('studyinhogwart.assignments', seedAssignments)
  const [schedules, setSchedules] = useLocalStorage<Schedule[]>('studyinhogwart.schedules', seedSchedules)
  const [studyStats, setStudyStats] = useLocalStorage<StudyStats>('studyinhogwart.studyStats', { studySessions: 2, focusedMinutes: 50, streak: 4, sessionDates: [] })
  const [housePoints, setHousePoints] = useLocalStorage<number>('studyinhogwart.housePoints', 145)
  const [view, setView] = useState<View>('assignments')
  const [recordOpen, setRecordOpen] = useState(false)

  if (!auth?.loggedIn) {
    return <AuthScreen auth={auth} onBack={() => undefined} onLogin={(email, password, remembered) => {
      if (!auth) return 'No account found. Create a student record first.'
      if (email.toLowerCase() !== auth.email.toLowerCase() || password !== auth.password) return 'Email or password is incorrect.'
      setAuth({ ...auth, remembered, loggedIn: true })
      return null
    }} onSignUp={(newProfile, password) => {
      setProfile(newProfile)
      setAuth({ email: newProfile.email, password, remembered: true, loggedIn: true })
    }} />
  }

  const completed = assignments.filter((assignment) => assignment.completed).length
  return (
    <div className={`app-shell house-theme-${profile.house}`}>
      <Sidebar profile={profile} view={view} onNavigate={setView} onProfile={() => setRecordOpen(true)} onLogout={() => setAuth({ ...auth, loggedIn: false })} />
      <main className="app-main">
        {view === 'assignments' && <AssignmentsScreen profile={profile} subjects={subjects} assignments={assignments} sessions={studyStats.studySessions} housePoints={housePoints} onSubjectsChange={setSubjects} onAssignmentsChange={setAssignments} onAwardPoints={(amount) => setHousePoints((points) => points + amount)} />}
        {view === 'timetable' && <TimetableScreen schedules={schedules} onSchedulesChange={setSchedules} />}
        {view === 'library' && <LibraryScreen profile={profile} assignments={assignments} stats={studyStats} housePoints={housePoints} onStatsChange={setStudyStats} onAwardPoints={(amount) => setHousePoints((points) => points + amount)} />}
        {view === 'house-points' && <HousePointsScreen profile={profile} housePoints={housePoints} />}
      </main>
      <StudentRecordDrawer open={recordOpen} profile={profile} subjects={subjects} stats={studyStats} housePoints={housePoints} assignmentsCompleted={completed} onClose={() => setRecordOpen(false)} />
    </div>
  )
}

export default App
