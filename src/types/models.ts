export type House = 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff'

export interface UserProfile {
  name: string
  email: string
  house: House
  year: number
}

export interface AuthRecord {
  email: string
  password: string
  remembered: boolean
  loggedIn: boolean
}

export interface Subject {
  id: string
  name: string
  color: string
}

export type Priority = 'low' | 'medium' | 'high'

export interface Assignment {
  id: string
  title: string
  subjectId: string
  date: string
  dueTime?: string
  priority: Priority
  completed: boolean
  pointsAwarded: boolean
}

export interface Schedule {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  category: string
}

export interface StudyStats {
  studySessions: number
  focusedMinutes: number
  streak: number
  sessionDates: string[]
}

export type View = 'assignments' | 'timetable' | 'library' | 'house-points'

