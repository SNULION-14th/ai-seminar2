// 디자인 시스템 미리보기 (#/?ds=1). DS-02부터 DS-06 공용 컴포넌트를 한 화면에서 확인한다.
// 실제 기능 화면이 붙기 전 qa 검증용이며, 데이터는 정적 데이터와 로컬 상태만 쓴다.
import { useState } from 'react'
import { Link } from 'react-router'
import {
  PebbleHandle,
  RidgeProfile,
  RiverLine,
  SKY_LABEL,
  SKY_PHASES,
  SkyBackground,
  Stamp,
  WaveProgress,
} from '../../components'
import type { SkyPhase } from '../../components'
import { CENTERS } from '../../data/centers'
import { ROUTE } from '../../data/route'
import { TOTAL_KM } from '../../data/sections'
import styles from './DesignPreview.module.css'

// 예시 일정 경계: 1일차 → 여주보, 2일차 → 문경불정역, 3일차 → 강정고령보
const INITIAL_EDGES = ['yeoju', 'buljeong', 'gangjeong']

const kmOf = (id: string) => CENTERS.find((c) => c.id === id)?.kmFromStart ?? 0

export function DesignPreview() {
  const [edges, setEdges] = useState(INITIAL_EDGES)
  const [preview, setPreview] = useState<string | null>(null)
  const [stamped, setStamped] = useState(false)
  const [stampedAt, setStampedAt] = useState<string>()
  const [wave, setWave] = useState(34)
  const [sky, setSky] = useState<SkyPhase | 'auto'>('auto')

  // 경계는 이웃 경계를 넘지 못하게 사이의 인증센터만 후보로 준다
  const stopsFor = (i: number) => {
    const lo = i === 0 ? 0 : kmOf(edges[i - 1])
    const hi = i === edges.length - 1 ? TOTAL_KM : kmOf(edges[i + 1])
    return CENTERS.filter((c) => c.kmFromStart > lo && c.kmFromStart < hi).map((c) => ({
      id: c.id,
      km: c.kmFromStart,
      label: c.name,
    }))
  }

  return (
    <div className={styles.preview}>
      <header className={styles.header}>
        <h1 className="page-title">디자인 시스템 미리보기</h1>
        <p className="page-lead">공용 컴포넌트를 한 화면에서 확인해요.</p>
        <Link to="/">홈으로 돌아가기</Link>
      </header>

      <section className={styles.block} aria-labelledby="ds02">
        <h2 id="ds02">DS-02 능선 고도 프로필 · DS-06 조약돌 핸들</h2>
        <p className={styles.note}>그래프를 끌면 지점 정보가 나오고, 조약돌을 끌면 일자 경계가 옮겨져요.</p>
        <div className={styles.ridge}>
          <RidgeProfile
            points={ROUTE}
            centers={CENTERS}
            boundaries={edges.map((id, i) => ({ km: kmOf(id), label: `${i + 1}일차` }))}
            ariaLabel="전체 경로 고도 프로필"
          >
            {edges.map((id, i) => (
              <PebbleHandle
                key={i}
                stops={stopsFor(i)}
                value={id}
                domain={[0, TOTAL_KM]}
                label={`${i + 1}일차와 ${i + 2}일차 경계`}
                onPreview={(next) => setPreview(next)}
                onCommit={(next) => {
                  setEdges((prev) => prev.map((e, j) => (j === i ? next : e)))
                  setPreview(null)
                }}
              />
            ))}
          </RidgeProfile>
        </div>
        <p className={styles.note} aria-live="polite">
          경계: {edges.map((id) => CENTERS.find((c) => c.id === id)?.name).join(' → ')}
          {preview ? ` (옮기는 중: ${CENTERS.find((c) => c.id === preview)?.name})` : ''}
        </p>
        <h3 className={styles.sub}>기록 화면 모양 (달린 곳까지 이끼색, 새재 구간만)</h3>
        <RidgeProfile points={ROUTE} centers={CENTERS} range={[209, 322]} progressKm={281} currentKm={281} height={140} />
      </section>

      <section className={styles.block} aria-labelledby="ds03">
        <h2 id="ds03">DS-03 도장 찍기</h2>
        <div className={styles.stampRow}>
          <Stamp
            name="이화령휴게소"
            stamped={stamped}
            date={stampedAt}
            animate
            size="lg"
          />
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setStampedAt(stamped ? undefined : new Date().toISOString())
              setStamped(!stamped)
            }}
          >
            {stamped ? '도장 지우기' : '도장 찍기'}
          </button>
        </div>
        <div className={styles.stampGrid}>
          {CENTERS.slice(0, 8).map((c, i) => (
            <Stamp key={c.id} name={c.name} stamped={i < 5} date={i < 5 ? `2026-09-${20 + i}T09:00:00` : undefined} size="sm" />
          ))}
        </div>
      </section>

      <section className={styles.block} aria-labelledby="ds04">
        <h2 id="ds04">DS-04 흐르는 진행률</h2>
        <WaveProgress value={wave} caption={`${Math.round((TOTAL_KM * wave) / 100)}km / ${TOTAL_KM}km`} size="lg" />
        <div className={styles.buttons}>
          <button type="button" className={styles.button} onClick={() => setWave((v) => Math.max(0, v - 10))}>
            10% 줄이기
          </button>
          <button type="button" className={styles.button} onClick={() => setWave((v) => Math.min(100, v + 10))}>
            10% 늘리기
          </button>
        </div>
      </section>

      <section className={styles.block} aria-labelledby="ds05">
        <h2 id="ds05">DS-05 시간대 하늘</h2>
        <div className={styles.buttons} role="group" aria-label="하늘 단계 고르기">
          {(['auto', ...SKY_PHASES] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={styles.button}
              aria-pressed={sky === p}
              onClick={() => setSky(p)}
            >
              {p === 'auto' ? '지금 시각' : SKY_LABEL[p]}
            </button>
          ))}
        </div>
        <SkyBackground phase={sky === 'auto' ? undefined : sky} className={styles.sky}>
          <div className={styles.skyInner}>
            <p className={styles.skyLabel}>다음 도장까지</p>
            <p className={`${styles.skyNumber} num`}>12.4km</p>
            <WaveProgress value={58} />
          </div>
        </SkyBackground>
      </section>

      <section className={styles.block} aria-labelledby="river">
        <h2 id="river">강줄기 라인아트 (공유 카드용)</h2>
        <div className={styles.river}>
          <RiverLine points={ROUTE} progressKm={281} centers={CENTERS} stampedIds={CENTERS.slice(0, 15).map((c) => c.id)} />
        </div>
      </section>
    </div>
  )
}
