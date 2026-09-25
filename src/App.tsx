import { useState, useEffect, useMemo, useId } from 'react'
import {
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Trash2,
  Plus,
  AlertCircle,
  BookOpen,
  Filter,
  ListTodo,
  RefreshCw,
  Check,
} from 'lucide-react'
import type { Assignment, FilterType, SortType } from './types'
import './App.css'

const STORAGE_KEY = 'assignment_tracker_assignments_v1'

const INITIAL_SAMPLES: Assignment[] = [
  {
    id: 'sample-1',
    title: '운영체제 Pintos 프로젝트 1 - Threads 구현',
    course: '운영체제',
    deadline: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString().slice(0, 16), // 36 hours ago (Overdue)
    completed: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
  },
  {
    id: 'sample-2',
    title: 'React 커스텀 훅 및 상태 관리 과제 제출',
    course: '웹 프론트엔드',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString().slice(0, 16), // ~tomorrow
    completed: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'sample-3',
    title: '알고리즘 4주차 Dynamic Programming 문제 풀이',
    course: '알고리즘',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString().slice(0, 16), // ~4 days later
    completed: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
]

function App() {
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load assignments from localStorage:', e)
    }
    return INITIAL_SAMPLES
  })

  const [title, setTitle] = useState('')
  const [course, setCourse] = useState('')
  const [deadline, setDeadline] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('deadline-asc')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  const courseInputId = useId()
  const titleInputId = useId()
  const deadlineInputId = useId()
  const sortSelectId = useId()

  // Save to localStorage whenever assignments change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments))
    } catch (e) {
      console.error('Failed to save assignments to localStorage:', e)
    }
  }, [assignments])

  // Update current time periodically for accurate overdue / D-day calculations
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  // Input validation & Add assignment
  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedCourse = course.trim()

    if (!trimmedCourse) {
      setErrorMessage('과목명을 입력해 주세요.')
      return
    }

    if (!trimmedTitle) {
      setErrorMessage('과제 제목을 입력해 주세요.')
      return
    }

    if (!deadline) {
      setErrorMessage('마감일과 시간을 선택해 주세요.')
      return
    }

    const newAssignment: Assignment = {
      id: `assignment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: trimmedTitle,
      course: trimmedCourse,
      deadline,
      completed: false,
      createdAt: Date.now(),
    }

    setAssignments((prev) => [newAssignment, ...prev])
    setTitle('')
    setCourse('')
    setDeadline('')
    setErrorMessage(null)
  }

  // Toggle complete
  const handleToggleComplete = (id: string) => {
    setAssignments((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  // Delete assignment
  const handleDeleteAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((item) => item.id !== id))
  }

  // Reset with sample data
  const handleResetSamples = () => {
    setAssignments(INITIAL_SAMPLES)
    setErrorMessage(null)
  }

  // Clear all
  const handleClearAll = () => {
    if (window.confirm('모든 과제를 삭제하시겠습니까?')) {
      setAssignments([])
    }
  }

  // Filtered & Sorted items
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      if (filter === 'in-progress') return !item.completed
      if (filter === 'completed') return item.completed
      return true
    })
  }, [assignments, filter])

  const sortedAssignments = useMemo(() => {
    return [...filteredAssignments].sort((a, b) => {
      const timeA = new Date(a.deadline).getTime()
      const timeB = new Date(b.deadline).getTime()

      if (sort === 'deadline-asc') {
        return timeA - timeB
      }
      if (sort === 'deadline-desc') {
        return timeB - timeA
      }
      return b.createdAt - a.createdAt
    })
  }, [filteredAssignments, sort])

  // Counts
  const totalCount = assignments.length
  const completedCount = assignments.filter((a) => a.completed).length
  const inProgressCount = totalCount - completedCount
  const overdueCount = assignments.filter((a) => {
    if (a.completed) return false
    return new Date(a.deadline).getTime() < currentTime
  }).length

  // Helper to format deadline and get badge details
  const getDeadlineInfo = (deadlineStr: string, completed: boolean) => {
    const deadlineDate = new Date(deadlineStr)
    const deadlineTime = deadlineDate.getTime()
    const isInvalid = isNaN(deadlineTime)

    if (isInvalid) {
      return {
        formatted: deadlineStr,
        isOverdue: false,
        dDayLabel: '날짜 오류',
        badgeClass: 'badge-neutral',
      }
    }

    const year = deadlineDate.getFullYear()
    const month = String(deadlineDate.getMonth() + 1).padStart(2, '0')
    const date = String(deadlineDate.getDate()).padStart(2, '0')
    const hours = String(deadlineDate.getHours()).padStart(2, '0')
    const minutes = String(deadlineDate.getMinutes()).padStart(2, '0')
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    const dayName = dayNames[deadlineDate.getDay()]

    const formatted = `${year}.${month}.${date} (${dayName}) ${hours}:${minutes}`

    if (completed) {
      return {
        formatted,
        isOverdue: false,
        dDayLabel: '완료됨',
        badgeClass: 'badge-completed',
      }
    }

    const diffMs = deadlineTime - currentTime
    const isOverdue = diffMs < 0

    if (isOverdue) {
      const overdueDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24))
      const dDayLabel =
        overdueDays === 0 ? '🚨 마감 기한 초과 (오늘)' : `🚨 D+${overdueDays} (기한 초과)`
      return {
        formatted,
        isOverdue: true,
        dDayLabel,
        badgeClass: 'badge-overdue',
      }
    }

    // Upcoming
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffMs <= 1000 * 60 * 60 * 24) {
      return {
        formatted,
        isOverdue: false,
        dDayLabel: '⚠️ 오늘 마감 (D-Day)',
        badgeClass: 'badge-urgent',
      }
    }

    return {
      formatted,
      isOverdue: false,
      dDayLabel: `⏳ D-${diffDays}`,
      badgeClass: 'badge-upcoming',
    }
  }

  return (
    <div className="tracker-container">
      {/* Header */}
      <header className="tracker-header">
        <div className="header-badge">
          <ListTodo size={16} />
          <span>과제 마감 관리 시스템</span>
        </div>
        <h1>과제 마감 트래커</h1>
        <p className="tracker-subtitle">
          과목별 과제 마감일을 한눈에 확인하고 우선순위대로 스마트하게 관리하세요.
        </p>

        {/* Stats Bar */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">전체 과제</span>
            <span className="stat-value">{totalCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">진행 중</span>
            <span className="stat-value highlight-accent">{inProgressCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">마감 기한 지남</span>
            <span className={`stat-value ${overdueCount > 0 ? 'highlight-danger' : ''}`}>
              {overdueCount}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">완료됨</span>
            <span className="stat-value highlight-success">{completedCount}</span>
          </div>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="tracker-main">
        {/* Assignment Input Form */}
        <section className="form-card">
          <h2>
            <Plus size={20} className="icon-heading" />
            새 과제 등록
          </h2>

          <form onSubmit={handleAddAssignment} className="assignment-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor={courseInputId}>과목명</label>
                <input
                  id={courseInputId}
                  type="text"
                  placeholder="예: 운영체제, 인공지능"
                  value={course}
                  onChange={(e) => {
                    setCourse(e.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  className="input-field"
                />
              </div>

              <div className="form-group form-group-span">
                <label htmlFor={titleInputId}>과제 제목</label>
                <input
                  id={titleInputId}
                  type="text"
                  placeholder="예: Pintos 프로젝트 1차 소스코드 제출"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label htmlFor={deadlineInputId}>마감일시</label>
                <input
                  id={deadlineInputId}
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => {
                    setDeadline(e.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  className="input-field"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="error-banner">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <Plus size={18} />
                과제 추가하기
              </button>
            </div>
          </form>
        </section>

        {/* Filter, Sort & Action Controls */}
        <section className="filter-section">
          <div className="filter-tabs">
            <button
              type="button"
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              전체 <span className="tab-badge">{totalCount}</span>
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === 'in-progress' ? 'active' : ''}`}
              onClick={() => setFilter('in-progress')}
            >
              진행 중 <span className="tab-badge">{inProgressCount}</span>
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              완료 <span className="tab-badge">{completedCount}</span>
            </button>
          </div>

          <div className="sort-controls">
            <div className="sort-wrapper">
              <Filter size={16} />
              <label htmlFor={sortSelectId} className="sr-only">
                정렬 기준
              </label>
              <select
                id={sortSelectId}
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="select-field"
              >
                <option value="deadline-asc">마감일 임박순</option>
                <option value="deadline-desc">마감일 늦은순</option>
                <option value="created-desc">최신 등록순</option>
              </select>
            </div>

            {assignments.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="btn-text-danger"
                title="모든 과제 지우기"
              >
                전체 삭제
              </button>
            )}
          </div>
        </section>

        {/* Assignment List */}
        <section className="list-section">
          {sortedAssignments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <CheckCircle2 size={48} className="empty-icon" />
              </div>
              <h3>
                {filter === 'all'
                  ? '등록된 과제가 없습니다'
                  : filter === 'in-progress'
                    ? '진행 중인 과제가 없습니다'
                    : '완료된 과제가 없습니다'}
              </h3>
              <p>
                {filter === 'all'
                  ? '새로운 과제를 등록하여 마감일을 놓치지 마세요!'
                  : '조건을 변경하거나 새로운 과제를 추가해 보세요.'}
              </p>
              {filter === 'all' ? (
                <button
                  type="button"
                  onClick={handleResetSamples}
                  className="btn btn-secondary empty-action-btn"
                >
                  <RefreshCw size={16} />
                  샘플 과제 불러오기
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className="btn btn-secondary empty-action-btn"
                >
                  전체 과제 보기
                </button>
              )}
            </div>
          ) : (
            <ul className="assignment-list" aria-label="과제 목록">
              {sortedAssignments.map((assignment) => {
                const { formatted, isOverdue, dDayLabel, badgeClass } =
                  getDeadlineInfo(assignment.deadline, assignment.completed)

                return (
                  <li
                    key={assignment.id}
                    className={`assignment-card ${
                      assignment.completed ? 'is-completed' : ''
                    } ${isOverdue ? 'is-overdue' : ''}`}
                  >
                    <div className="card-left">
                      {/* Checkbox toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(assignment.id)}
                        className={`toggle-btn ${
                          assignment.completed ? 'checked' : ''
                        }`}
                        aria-label={
                          assignment.completed
                            ? '미완료로 변경'
                            : '완료로 표시'
                        }
                      >
                        {assignment.completed ? (
                          <Check size={18} className="check-icon" />
                        ) : (
                          <Circle size={20} className="circle-icon" />
                        )}
                      </button>

                      <div className="card-content">
                        <div className="card-meta">
                          <span className="course-badge">
                            <BookOpen size={13} />
                            {assignment.course}
                          </span>
                          <span className={`status-badge ${badgeClass}`}>
                            {dDayLabel}
                          </span>
                        </div>

                        <h3 className="card-title">{assignment.title}</h3>

                        <div className="card-footer-info">
                          <span className="deadline-text">
                            <Calendar size={14} />
                            <span>마감: {formatted}</span>
                          </span>
                          {isOverdue && (
                            <span className="overdue-warning-text">
                              <Clock size={14} />
                              <span>기한이 지났습니다! 서둘러 제출하세요.</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="btn-icon-delete"
                        aria-label="과제 삭제"
                        title="과제 삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="tracker-footer">
        <p>
          Assignment Deadline Tracker &bull; LocalStorage 자동 저장 &bull; 반응형 UI
        </p>
      </footer>
    </div>
  )
}

export default App
