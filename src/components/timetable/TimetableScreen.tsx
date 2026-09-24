import { useState, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { addDays, fromDateKey, toDateKey, uid } from '../../date'
import type { Schedule } from '../../types/models'
import { ScreenHeading } from '../assignments/AssignmentsScreen'
import { Modal } from '../layout/Modal'

const hours = Array.from({ length: 14 }, (_, index) => index + 8)
const categoryColors: Record<string, string> = {
  Lecture: '#8b4a45',
  Study: '#3d6f59',
  Meeting: '#526377',
  Personal: '#8a6a2b',
}

export function TimetableScreen({ schedules, onSchedulesChange }: { schedules: Schedule[]; onSchedulesChange: (schedules: Schedule[]) => void }) {
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()))
  const [editing, setEditing] = useState<Schedule | null | 'new'>(null)
  const selected = fromDateKey(selectedDate)
  const monday = addDays(selected, -((selected.getDay() + 6) % 7))
  const week = Array.from({ length: 7 }, (_, index) => addDays(monday, index))
  const daySchedules = schedules.filter((schedule) => schedule.date === selectedDate)
  const shiftWeek = (amount: number) => setSelectedDate(toDateKey(addDays(selected, amount * 7)))

  return (
    <div className="screen great-hall-screen timetable-screen">
      <ScreenHeading eyebrow={selected.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase()} title="Timetable" action={<button type="button" className="header-action" onClick={() => setEditing('new')}><Plus size={14} /> Add Schedule</button>} />
      <div className="week-selector">
        {week.map((day) => { const key = toDateKey(day); return <button type="button" key={key} className={key === selectedDate ? 'selected' : ''} onClick={() => setSelectedDate(key)}><span>{day.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}</span><strong>{day.getDate()}</strong></button> })}
      </div>
      <section className="parchment timeline">
        <div className="timeline-hours">{hours.map((hour) => <span key={hour} style={{ top: `${((hour - 8) / 14) * 100}%` }}>{String(hour).padStart(2, '0')}:00</span>)}</div>
        <div className="timeline-body">
          {hours.map((hour) => <i key={hour} style={{ top: `${((hour - 8) / 14) * 100}%` }} />)}
          {daySchedules.map((schedule) => {
            const top = (minutes(schedule.startTime) - 8 * 60) / (14 * 60) * 100
            const height = Math.max(5, (minutes(schedule.endTime) - minutes(schedule.startTime)) / (14 * 60) * 100)
            return <button type="button" key={schedule.id} className="schedule-block" style={{ top: `${top}%`, height: `${height}%`, borderColor: categoryColors[schedule.category] ?? '#6a5420', background: `${categoryColors[schedule.category] ?? '#6a5420'}24` }} onClick={() => setEditing(schedule)}><strong>{schedule.title}</strong><span>{schedule.startTime} – {schedule.endTime} · {schedule.category}</span></button>
          })}
          {!daySchedules.length && <div className="timeline-empty">No entries for this day.<button type="button" onClick={() => setEditing('new')}>Plan a study block</button></div>}
        </div>
      </section>
      <div className="timeline-controls"><button type="button" onClick={() => shiftWeek(-1)}><ChevronLeft size={14} /> Prev</button><button type="button" onClick={() => setSelectedDate(toDateKey(new Date()))}>Today</button><button type="button" onClick={() => shiftWeek(1)}>Next <ChevronRight size={14} /></button></div>
      {editing && <ScheduleModal selectedDate={selectedDate} schedule={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onDelete={(id) => { onSchedulesChange(schedules.filter((schedule) => schedule.id !== id)); setEditing(null) }} onSubmit={(schedule) => { onSchedulesChange(editing === 'new' ? [...schedules, schedule] : schedules.map((item) => item.id === schedule.id ? schedule : item)); setEditing(null) }} />}
    </div>
  )
}

function ScheduleModal({ selectedDate, schedule, onClose, onSubmit, onDelete }: { selectedDate: string; schedule?: Schedule; onClose: () => void; onSubmit: (schedule: Schedule) => void; onDelete: (id: string) => void }) {
  const [title, setTitle] = useState(schedule?.title ?? '')
  const [date, setDate] = useState(schedule?.date ?? selectedDate)
  const [startTime, setStartTime] = useState(schedule?.startTime ?? '09:00')
  const [endTime, setEndTime] = useState(schedule?.endTime ?? '10:00')
  const [category, setCategory] = useState(schedule?.category ?? 'Lecture')
  const [error, setError] = useState('')
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const submittedStart = String(values.get('startTime'))
    const submittedEnd = String(values.get('endTime'))
    const trimmed = String(values.get('title')).trim()
    if (!trimmed) return setError('Enter a schedule title.')
    if (minutes(submittedEnd) <= minutes(submittedStart)) return setError('End time must be after start time.')
    onSubmit({ id: schedule?.id ?? uid(), title: trimmed, date: String(values.get('date')), startTime: submittedStart, endTime: submittedEnd, category: String(values.get('category')) })
  }
  return <Modal title={schedule ? 'Edit Schedule' : 'Add Schedule'} onClose={onClose}><form className="modal-form" onSubmit={submit}><label>Title<input name="title" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></label><label>Date<input name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><div className="form-row"><label>Start Time<input name="startTime" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label><label>End Time<input name="endTime" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label></div><label>Category<select name="category" value={category} onChange={(event) => setCategory(event.target.value)}>{Object.keys(categoryColors).map((item) => <option key={item}>{item}</option>)}</select></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions">{schedule && <button type="button" className="danger-action" onClick={() => onDelete(schedule.id)}>Delete</button>}<button type="button" className="secondary-action" onClick={onClose}>Cancel</button><button type="submit" className="primary-action">Save Schedule</button></div></form></Modal>
}

function minutes(time: string) {
  const [hoursValue, minutesValue] = time.split(':').map(Number)
  return hoursValue * 60 + minutesValue
}
