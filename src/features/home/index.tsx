// 홈 화면 진입점 (DS-01). 2단계부터 ui-kit 담당.
import { BookOpen, ChevronDown, Map, Navigation } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { DesignPreview } from './DesignPreview'
import { RiverScroll } from './RiverScroll'
import styles from './Home.module.css'

const ACTIONS: { to: string; icon: LucideIcon; title: string; body: string }[] = [
  { to: '/plan', icon: Map, title: '일정 세우기', body: '며칠에 나눠 달릴지 정하면 하루 거리와 숙박지를 나눠 드려요.' },
  { to: '/track', icon: Navigation, title: '라이딩 기록하기', body: '달리는 동안 다음 도장까지 남은 거리를 크게 보여 드려요.' },
  { to: '/journal', icon: BookOpen, title: '도장과 일지 보기', body: '찍은 도장과 하루하루의 기록을 모아 두었어요.' },
]

export function HomePage() {
  const [params] = useSearchParams()
  // 디자인 시스템 미리보기 (#/?ds=1): 공용 컴포넌트를 한 화면에서 확인한다 (qa 검증용)
  if (params.get('ds') === '1') return <DesignPreview />

  return (
    <div className={styles.home}>
      <header className={styles.hero}>
        <p className={styles.kicker}>인천에서 부산까지 · 633km</p>
        <h1 className={styles.title}>강따라 633</h1>
        <p className={styles.lead}>
          아라뱃길에서 시작해 한강, 남한강, 새재를 넘어 낙동강을 따라 바다까지. 강을 따라 흐르는 한 줄이에요.
        </p>
        <p className={styles.hint}>
          <ChevronDown size={20} aria-hidden="true" />
          아래로 내리면 길이 그려져요
        </p>
      </header>

      <RiverScroll />

      <section className={styles.actions} aria-labelledby="home-actions-title">
        <h2 id="home-actions-title" className={styles.actionsTitle}>
          어디서부터 시작할까요?
        </h2>
        {ACTIONS.map(({ to, icon: Icon, title, body }) => (
          <Link key={to} to={to} className={styles.action}>
            <span className={styles.actionIcon}>
              <Icon size={24} aria-hidden="true" />
            </span>
            <span className={styles.actionText}>
              <strong>{title}</strong>
              <span>{body}</span>
            </span>
          </Link>
        ))}
      </section>
    </div>
  )
}
