import { BookOpen, Home, Map, Navigation } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Navigate, NavLink, Outlet, createHashRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { HomePage } from './features/home'
import { PlanPage } from './features/plan'
import { JournalPage, SharedPage } from './features/share'
import { TrackPage } from './features/track'
import styles from './App.module.css'

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: '홈', icon: Home },
  { to: '/plan', label: '계획', icon: Map },
  { to: '/track', label: '트래킹', icon: Navigation },
  { to: '/journal', label: '기록', icon: BookOpen },
]

function TabBar() {
  return (
    <nav className={styles.tabBar} aria-label="주요 메뉴">
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab
          }
        >
          <Icon size={22} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

// 탭 바가 있는 화면(홈/계획/트래킹/기록). 공유 페이지는 이 레이아웃 밖에 둔다.
function TabLayout() {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}

// 라우트 표: docs/specs/architecture.md §4
const router = createHashRouter([
  {
    Component: TabLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'plan', Component: PlanPage },
      { path: 'track', Component: TrackPage },
      { path: 'journal', Component: JournalPage },
    ],
  },
  { path: 's/:payload', Component: SharedPage },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
