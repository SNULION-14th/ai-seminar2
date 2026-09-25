export interface Assignment {
  id: string
  title: string
  course: string
  deadline: string // ISO string format: YYYY-MM-DDTHH:mm
  completed: boolean
  createdAt: number
}

export type FilterType = 'all' | 'in-progress' | 'completed'
export type SortType = 'deadline-asc' | 'deadline-desc' | 'created-desc'
