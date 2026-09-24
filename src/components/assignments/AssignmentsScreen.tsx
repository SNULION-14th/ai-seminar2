import { useMemo, useState, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { fromDateKey, toDateKey, uid } from '../../date'
import type { Assignment, Priority, Subject, UserProfile } from '../../types/models'
import { Modal } from '../layout/Modal'

const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export function AssignmentsScreen({ profile, subjects, assignments, sessions, housePoints, onSubjectsChange, onAssignmentsChange, onAwardPoints }: {
  profile: UserProfile
  subjects: Subject[]
  assignments: Assignment[]
  sessions: number
  housePoints: number
  onSubjectsChange: (subjects: Subject[]) => void
  onAssignmentsChange: (assignments: Assignment[]) => void
  onAwardPoints: (amount: number) => void
}) {
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()))
  const [visibleMonth, setVisibleMonth] = useState(() => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1) })
  const [assignmentSubject, setAssignmentSubject] = useState<string | null>(null)
  const [addingSubject, setAddingSubject] = useState(false)
  const selectedAssignments = assignments.filter((assignment) => assignment.date === selectedDate)
  const completedThisMonth = assignments.filter((assignment) => assignment.completed && assignment.date.startsWith(toDateKey(visibleMonth).slice(0, 7))).length

  const toggleAssignment = (assignment: Assignment) => {
    const completingFirstTime = !assignment.completed && !assignment.pointsAwarded
    onAssignmentsChange(assignments.map((item) => item.id === assignment.id ? { ...item, completed: !item.completed, pointsAwarded: item.pointsAwarded || completingFirstTime } : item))
    if (completingFirstTime) onAwardPoints(5)
  }

  return (
    <div className="screen great-hall-screen assignments-screen">
      <ScreenHeading eyebrow="ACADEMIC PLANNER" title="Assignments" action={<button className="header-action" type="button" onClick={() => setAssignmentSubject('') }><Plus size={14} /> Add Assignment</button>} />
      <div className="assignment-layout">
        <section className="parchment calendar-panel">
          <div className="mini-profile"><span className={`mini-monogram house-${profile.house}`}>{profile.name.slice(0, 2).toUpperCase()}</span><span><strong>{profile.name}</strong><small>{profile.house} · {ordinal(profile.year)} Year</small></span></div>
          <div className="calendar-heading"><button type="button" aria-label="Previous month" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}><ChevronLeft size={15} /></button><strong>{visibleMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase()}</strong><button type="button" aria-label="Next month" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}><ChevronRight size={15} /></button></div>
          <MonthCalendar month={visibleMonth} selectedDate={selectedDate} assignments={assignments} subjects={subjects} onSelect={setSelectedDate} />
          <div className="month-summary"><span className="eyebrow">THIS MONTH</span><strong>{completedThisMonth} assignments completed</strong><p>{sessions} study sessions</p><p>+{housePoints} house points</p></div>
        </section>
        <section className="parchment ledger-panel">
          <header className="ledger-date"><span>{fromDateKey(selectedDate).toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()}</span><h2>{fromDateKey(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</h2></header>
          <div className="subject-sections">
            {subjects.map((subject) => {
              const items = selectedAssignments.filter((assignment) => assignment.subjectId === subject.id)
              const completed = items.filter((item) => item.completed).length
              return <section className="subject-section" key={subject.id}>
                <header><span className="subject-swatch" style={{ background: subject.color }} /><strong>{subject.name.toUpperCase()}</strong><span>{completed} / {items.length}</span><button type="button" aria-label={`Add assignment to ${subject.name}`} onClick={() => setAssignmentSubject(subject.id)}><Plus size={13} /></button></header>
                {items.map((assignment) => <div className={`assignment-row priority-${assignment.priority}`} key={assignment.id}>
                  <label><input type="checkbox" checked={assignment.completed} onChange={() => toggleAssignment(assignment)} /><span>{assignment.title}</span></label>
                  <div>{assignment.dueTime && <time>{assignment.dueTime}</time>}<button type="button" aria-label={`Delete ${assignment.title}`} onClick={() => onAssignmentsChange(assignments.filter((item) => item.id !== assignment.id))}><Trash2 size={14} /></button></div>
                </div>)}
              </section>
            })}
            {!selectedAssignments.length && <div className="empty-state"><span>Nothing is due on this date.</span><p>A clear page leaves room for deeper study.</p><button type="button" onClick={() => setAssignmentSubject('')}><Plus size={14} /> Add an assignment</button></div>}
          </div>
          <button className="add-subject" type="button" onClick={() => setAddingSubject(true)}>+ Add subject</button>
          <footer>{selectedAssignments.filter((item) => item.completed).length} of {selectedAssignments.length} completed today</footer>
        </section>
      </div>
      {assignmentSubject !== null && <AssignmentModal selectedDate={selectedDate} initialSubject={assignmentSubject} subjects={subjects} onClose={() => setAssignmentSubject(null)} onSubmit={(assignment) => { onAssignmentsChange([...assignments, assignment]); setAssignmentSubject(null) }} />}
      {addingSubject && <SubjectModal onClose={() => setAddingSubject(false)} onSubmit={(subject) => { onSubjectsChange([...subjects, subject]); setAddingSubject(false) }} />}
    </div>
  )
}

function MonthCalendar({ month, selectedDate, assignments, subjects, onSelect }: { month: Date; selectedDate: string; assignments: Assignment[]; subjects: Subject[]; onSelect: (date: string) => void }) {
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)] as (number | null)[]
  }, [month])
  return <div className="calendar-grid">
    {weekdays.map((day) => <span className="weekday" key={day}>{day.slice(0, 1)}</span>)}
    {cells.map((day, index) => {
      if (!day) return <span key={`blank-${index}`} />
      const date = toDateKey(new Date(month.getFullYear(), month.getMonth(), day))
      const dateAssignments = assignments.filter((assignment) => assignment.date === date)
      return <button type="button" key={date} className={selectedDate === date ? 'selected' : ''} onClick={() => onSelect(date)} aria-label={`Select ${date}`}><span>{day}</span><i>{dateAssignments.slice(0, 3).map((assignment) => <b key={assignment.id} style={{ background: subjects.find((subject) => subject.id === assignment.subjectId)?.color }} />)}</i></button>
    })}
  </div>
}

function AssignmentModal({ selectedDate, initialSubject, subjects, onClose, onSubmit }: { selectedDate: string; initialSubject: string; subjects: Subject[]; onClose: () => void; onSubmit: (assignment: Assignment) => void }) {
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState(initialSubject || subjects[0]?.id || '')
  const [dueTime, setDueTime] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [error, setError] = useState('')
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const trimmed = String(values.get('title')).trim()
    if (!trimmed) return setError('Enter an assignment title.')
    const submittedSubject = String(values.get('subjectId'))
    if (!submittedSubject) return setError('Create a subject before adding an assignment.')
    const submittedDueTime = String(values.get('dueTime'))
    onSubmit({ id: uid(), title: trimmed, subjectId: submittedSubject, date: selectedDate, dueTime: submittedDueTime || undefined, priority: String(values.get('priority')) as Priority, completed: false, pointsAwarded: false })
  }
  return <Modal title="Add Assignment" onClose={onClose}><form className="modal-form" onSubmit={submit}>
    <p className="modal-context">{fromDateKey(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    <label>Title<input name="title" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></label>
    <label>Subject<select name="subjectId" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>{subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></label>
    <div className="form-row"><label>Due Time<input name="dueTime" type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} /></label><label>Priority<select name="priority" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div>
    {error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-action" onClick={onClose}>Cancel</button><button className="primary-action" type="submit">Add Assignment</button></div>
  </form></Modal>
}

function SubjectModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (subject: Subject) => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#7460a8')
  return <Modal title="Add Subject" onClose={onClose}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); const trimmed = name.trim(); if (trimmed) onSubmit({ id: uid(), name: trimmed, color }) }}><label>Name<input value={name} onChange={(event) => setName(event.target.value)} autoFocus required /></label><label>Colour<span className="color-field"><input type="color" value={color} onChange={(event) => setColor(event.target.value)} /><span>{color.toUpperCase()}</span></span></label><div className="modal-actions"><button type="button" className="secondary-action" onClick={onClose}>Cancel</button><button className="primary-action" type="submit">Add Subject</button></div></form></Modal>
}

export function ScreenHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <header className="screen-heading"><div><span>{eyebrow}</span><h1>{title}</h1></div>{action}</header>
}

function ordinal(year: number) {
  return ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh'][year - 1]
}
