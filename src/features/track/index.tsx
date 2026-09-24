// 트래킹 화면 — TRK-01, 03, 04, 08, 11, 12, 13. 2단계부터 track 담당.
import { Pause, Play, Square, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { SkyBackground, WaveProgress } from '../../components'
import { getCenter } from '../../data/centers'
import { SECTIONS } from '../../data/sections'
import { nextCenter, snapToRoute } from '../../domain/geo'
import { progress } from '../../domain/progress'
import {
  averageSpeedKmh,
  currentSpeedKmh,
  nearbyUnstampedCenter,
  offRouteDurationSec,
  OFF_ROUTE_ALERT_SEC,
  planPaceDiffKm,
} from '../../domain/tracking'
import type { Section, SectionId } from '../../domain/types'
import { selectActiveRide, useActiveRideStore, useRidesStore } from '../../store/ride'
import { selectTodayDayPlan, usePlanStore } from '../../store/plan'
import { selectStamps, useStampsStore } from '../../store/stamps'
import { CenterList } from './CenterList'
import { createSimulator, SIM_SPEED_MULTIPLIERS, type SimSpeedMultiplier } from './simulator'
import { StampSheet } from './StampSheet'
import { SummarySheet } from './SummarySheet'
import styles from './track.module.css'
import { TrackMap } from './TrackMap'
import { useGeolocation } from './useGeolocation'
import { useWakeLock } from './useWakeLock'

const TRACK_NOTICE_KEY = 'gt.trackNoticeSeen'

/** 현재 누적 km가 속한 구간을 찾는다. 범위를 벗어나면 마지막 구간을 돌려준다 */
function sectionAtKm(km: number): Section {
  let startKm = 0
  for (const section of SECTIONS) {
    const endKm = startKm + section.distanceKm
    if (km <= endKm) return section
    startKm = endKm
  }
  return SECTIONS[SECTIONS.length - 1]
}

export function TrackPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const simMode = searchParams.get('sim') === '1'

  const activeRide = useActiveRideStore(useShallow(selectActiveRide))
  const start = useActiveRideStore((s) => s.start)
  const pause = useActiveRideStore((s) => s.pause)
  const resume = useActiveRideStore((s) => s.resume)
  const finish = useActiveRideStore((s) => s.finish)
  const addPoint = useActiveRideStore((s) => s.addPoint)
  const resetActiveRide = useActiveRideStore((s) => s.reset)
  const addRide = useRidesStore((s) => s.addRide)
  const rides = useRidesStore((s) => s.rides)
  const stamps = useStampsStore(selectStamps)
  const addStamp = useStampsStore((s) => s.addStamp)
  const stampedIds = useMemo(() => new Set(stamps.map((s) => s.centerId)), [stamps])
  const todayPlan = usePlanStore(selectTodayDayPlan)

  const [simSectionId, setSimSectionId] = useState<SectionId>(SECTIONS[0].id)
  const [simSpeed, setSimSpeed] = useState<SimSpeedMultiplier>(10)
  const [wakeLockOn, setWakeLockOn] = useState(true)
  const [noticeSeen, setNoticeSeen] = useState(() => {
    try {
      return localStorage.getItem(TRACK_NOTICE_KEY) === '1'
    } catch {
      return true // localStorage를 못 쓰면 안내 없이 진행한다
    }
  })

  // TRK-06 자동 도장 시트: "나중에"로 넘긴 센터는 이번 라이드에서는 다시 안 띄운다.
  // 라이드가 바뀌면(rideId 변경) 렌더 중에 상태를 리셋한다(React가 권장하는 "prop 변화에 맞춰 state 조정" 패턴).
  const [dismissedCenterIds, setDismissedCenterIds] = useState<ReadonlySet<string>>(new Set())
  const [dismissedForRideId, setDismissedForRideId] = useState(activeRide.rideId)
  if (activeRide.rideId !== dismissedForRideId) {
    setDismissedForRideId(activeRide.rideId)
    setDismissedCenterIds(new Set())
  }
  // 확인을 누른 뒤에는 저장하자마자 stampedIds가 바뀌어도(=더 이상 "가까운 미찍음 센터"가 아니어도)
  // 도장 애니메이션이 끝날 때까지 같은 센터로 시트를 계속 보여준다.
  const [activeStampCenterId, setActiveStampCenterId] = useState<string | null>(null)

  function dismissNotice() {
    setNoticeSeen(true)
    try {
      localStorage.setItem(TRACK_NOTICE_KEY, '1')
    } catch {
      // 저장 실패해도 이번 화면에서는 닫힌 채로 둔다
    }
  }

  const riding = activeRide.status === 'riding'
  const gpsEnabled = riding && activeRide.source === 'gps'
  const { status: geoStatus } = useGeolocation(gpsEnabled, addPoint)
  const wakeLock = useWakeLock(wakeLockOn && riding)

  const lastPoint = activeRide.track[activeRide.track.length - 1] ?? null
  const currentKm = lastPoint ? snapToRoute(lastPoint).km : 0

  // 시뮬레이터: riding 상태이고 source가 simulated일 때만 재생한다 (TRK-10)
  const simulatorRef = useRef<ReturnType<typeof createSimulator> | null>(null)
  useEffect(() => {
    if (activeRide.status !== 'riding' || activeRide.source !== 'simulated') {
      simulatorRef.current = null
      return
    }
    const sim = createSimulator({
      sectionId: simSectionId,
      speedMultiplier: simSpeed,
      // 새로고침 뒤 이어서 재생할 때는 저장된 위치에서, 새로 시작할 때는 구간 시작점에서 재생한다
      startKm: lastPoint ? currentKm : undefined,
      onPoint: (p) => addPoint(p),
    })
    simulatorRef.current = sim
    sim.start()
    return () => {
      sim.stop()
      simulatorRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rideId가 바뀔 때만 새로 만든다. 배속은 아래 effect가 따로 반영한다
  }, [activeRide.status, activeRide.source, activeRide.rideId])

  useEffect(() => {
    simulatorRef.current?.setSpeedMultiplier(simSpeed)
  }, [simSpeed])

  const next = nextCenter(currentKm)
  const progressInfo = progress(stamps, rides)
  const speedKmh = currentSpeedKmh(activeRide.track)
  const avgSpeedKmh = averageSpeedKmh(activeRide.distanceKm, activeRide.movingTimeSec)
  const rideStamps = stamps.filter((s) => s.rideId === activeRide.rideId)
  const currentSection = sectionAtKm(currentKm)

  // TRK-05 경로 이탈 알림: 300m 넘게 벗어난 상태가 30초 이상 이어지면 비침습 배너를 띄운다
  const offRouteSec = offRouteDurationSec(activeRide.track)
  const showOffRouteAlert = (riding || activeRide.status === 'paused') && offRouteSec >= OFF_ROUTE_ALERT_SEC

  // TRK-07 계획 연동: 오늘의 DayPlan 목표 대비 앞섬/뒤처짐.
  // 렌더 중에 Date.now()를 읽지 않도록, 마지막으로 받은 GPS/시뮬레이션 점의 시각을 "지금"으로 쓴다.
  const elapsedHours =
    activeRide.startedAt && lastPoint ? (lastPoint.t - Date.parse(activeRide.startedAt)) / 3_600_000 : 0
  const paceDiffKm = todayPlan ? planPaceDiffKm(activeRide.distanceKm, todayPlan.distanceKm, elapsedHours) : null

  // TRK-06: 반경 150m 안 인증센터를 찾아 자동으로 도장 시트를 띄운다
  const nearby =
    (riding || activeRide.status === 'paused') && lastPoint ? nearbyUnstampedCenter(lastPoint, stampedIds) : null
  const autoPromptCenter = nearby && !dismissedCenterIds.has(nearby.id) ? nearby : null
  const stampSheetCenterId = activeStampCenterId ?? autoPromptCenter?.id ?? null
  const stampSheetCenter = stampSheetCenterId ? getCenter(stampSheetCenterId) : undefined
  const stampSheetStamp = stampSheetCenterId ? stamps.find((s) => s.centerId === stampSheetCenterId) : undefined

  function handleConfirmStamp(centerId: string) {
    setActiveStampCenterId(centerId)
    addStamp({
      centerId,
      stampedAt: new Date().toISOString(),
      rideId: activeRide.rideId ?? undefined,
      method: 'auto',
    })
  }

  function handleDismissStamp(centerId: string) {
    setDismissedCenterIds((s) => new Set(s).add(centerId))
  }

  function handleManualStamp(centerId: string) {
    addStamp({
      centerId,
      stampedAt: new Date().toISOString(),
      rideId: activeRide.rideId ?? undefined,
      method: 'manual',
    })
  }

  function handleStart() {
    start(simMode ? 'simulated' : 'gps')
  }

  function handleSaveSummary(memo: string) {
    if (!activeRide.rideId || !activeRide.startedAt) return
    addRide({
      id: activeRide.rideId,
      startedAt: activeRide.startedAt,
      endedAt: new Date().toISOString(),
      track: activeRide.track,
      distanceKm: activeRide.distanceKm,
      movingTimeSec: activeRide.movingTimeSec,
      source: activeRide.source,
      memo: memo || undefined,
    })
    resetActiveRide()
  }

  function setSimMode(next: boolean) {
    const params = new URLSearchParams(searchParams)
    if (next) params.set('sim', '1')
    else params.delete('sim')
    setSearchParams(params, { replace: true })
  }

  function switchToSimulation() {
    resetActiveRide()
    setSimMode(true)
  }

  function handleStampAnimationEnd() {
    setActiveStampCenterId(null)
  }

  const showGpsFallback = gpsEnabled && (geoStatus === 'denied' || geoStatus === 'unsupported')

  return (
    <SkyBackground className={styles.sky}>
      <section className={styles.page}>
        {!noticeSeen && (
          <div className={styles.firstUseBackdrop} role="dialog" aria-modal="true" aria-label="트래킹 안내">
            <div className={styles.firstUseCard}>
              <h2>화면이 꺼지면 기록이 멈출 수 있어요</h2>
              <p>
                화면이 꺼지거나 브라우저가 백그라운드로 가면 위치 기록이 끊길 수 있어요. 라이딩 중에는 화면을 켜
                두는 게 좋아요. 다시 켜지면 끊긴 구간은 지도에 "기록 공백"으로 따로 표시돼요.
              </p>
              <button type="button" className={styles.firstUseButton} onClick={dismissNotice}>
                확인했어요
              </button>
            </div>
          </div>
        )}

        <header className={styles.header}>
          <h1 className={styles.headerTitle}>{currentSection.name}</h1>
          <p className={styles.headerSub}>
            {activeRide.source === 'simulated' ? '시뮬레이션으로 기록 중이에요' : '강따라 633'}
          </p>
          {paceDiffKm !== null && (
            <p className={styles.headerSub}>
              오늘 계획보다{' '}
              <strong className="num">
                {paceDiffKm >= 0
                  ? `${paceDiffKm.toFixed(1)}km 앞섰어요`
                  : `${Math.abs(paceDiffKm).toFixed(1)}km 뒤처졌어요`}
              </strong>
            </p>
          )}
        </header>

        {showOffRouteAlert && (
          <div className={styles.notice} role="status">
            <TriangleAlert size={20} aria-hidden="true" />
            <p>경로에서 좀 벗어난 것 같아요. 지도를 확인해 보세요.</p>
          </div>
        )}

        <div className={styles.nextCenter}>
          <p className={styles.nextCenterLabel}>다음 도장까지</p>
          {next ? (
            <p className={`${styles.nextCenterValue} num`}>
              {next.remainingKm.toFixed(1)} km
              <span className={styles.nextCenterName}>{next.center.name}</span>
            </p>
          ) : (
            <p className={`${styles.nextCenterValue} num`}>완주했어요!</p>
          )}
        </div>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <p className={`${styles.statValue} num`}>{speedKmh.toFixed(1)} km/h</p>
            <p className={styles.statLabel}>현재 속도</p>
          </div>
          <div className={styles.stat}>
            <p className={`${styles.statValue} num`}>{activeRide.distanceKm.toFixed(1)} km</p>
            <p className={styles.statLabel}>오늘 이동 거리</p>
          </div>
          <div className={styles.stat}>
            <p className={`${styles.statValue} num`}>{avgSpeedKmh.toFixed(1)} km/h</p>
            <p className={styles.statLabel}>평균 속도</p>
          </div>
        </div>

        <WaveProgress
          value={progressInfo.percent}
          caption={`도장 ${progressInfo.stampCount}/${progressInfo.totalCenters}개`}
        />

        <TrackMap
          track={activeRide.track}
          currentPosition={lastPoint}
          isStamped={(centerId) => stampedIds.has(centerId)}
        />

        <CenterList stamps={stamps} onManualStamp={handleManualStamp} />

        {showGpsFallback && (
          <div className={styles.notice} role="alert">
            <TriangleAlert size={20} aria-hidden="true" />
            <div>
              <p>
                {geoStatus === 'unsupported'
                  ? '이 브라우저는 위치 확인을 지원하지 않아요.'
                  : '위치 권한이 없어서 GPS 기록을 할 수 없어요.'}
              </p>
              <p>시뮬레이션 모드로 라이딩을 다시 시작하거나, 기록 화면에서 도장을 직접 찍을 수 있어요.</p>
              <button type="button" className={styles.simSpeedButton} onClick={switchToSimulation}>
                시뮬레이션으로 전환
              </button>
            </div>
          </div>
        )}

        {activeRide.status === 'idle' && (
          <>
            <label className={styles.notice}>
              <input type="checkbox" checked={simMode} onChange={(e) => setSimMode(e.target.checked)} />
              시뮬레이션 모드로 시작해요 (실제 GPS 없이 테스트)
            </label>
            {simMode && (
              <div className={styles.simPanel}>
                <div className={styles.simRow}>
                  <select
                    className={styles.simSelect}
                    value={simSectionId}
                    onChange={(e) => setSimSectionId(e.target.value as SectionId)}
                  >
                    {SECTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.simRow}>
                  {SIM_SPEED_MULTIPLIERS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`${styles.simSpeedButton} ${m === simSpeed ? styles.simSpeedButtonActive : ''}`}
                      onClick={() => setSimSpeed(m)}
                    >
                      {m}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {wakeLock.supported && (riding || activeRide.status === 'paused') && (
          <label className={styles.notice}>
            <input
              type="checkbox"
              checked={wakeLockOn}
              onChange={(e) => setWakeLockOn(e.target.checked)}
            />
            화면 켜짐 유지{wakeLock.active ? ' (켜짐)' : ''}
          </label>
        )}

        <div className={styles.controls}>
          {activeRide.status === 'idle' && (
            <button type="button" className={`${styles.controlButton} ${styles.startButton}`} onClick={handleStart}>
              <Play size={20} aria-hidden="true" /> 시작
            </button>
          )}
          {activeRide.status === 'riding' && (
            <>
              <button type="button" className={`${styles.controlButton} ${styles.pauseButton}`} onClick={pause}>
                <Pause size={20} aria-hidden="true" /> 일시정지
              </button>
              <button type="button" className={`${styles.controlButton} ${styles.finishButton}`} onClick={finish}>
                <Square size={20} aria-hidden="true" /> 종료
              </button>
            </>
          )}
          {activeRide.status === 'paused' && (
            <>
              <button type="button" className={`${styles.controlButton} ${styles.startButton}`} onClick={resume}>
                <Play size={20} aria-hidden="true" /> 재개
              </button>
              <button type="button" className={`${styles.controlButton} ${styles.finishButton}`} onClick={finish}>
                <Square size={20} aria-hidden="true" /> 종료
              </button>
            </>
          )}
        </div>

        {stampSheetCenter && (
          <StampSheet
            center={stampSheetCenter}
            stamped={!!stampSheetStamp}
            stampedAt={stampSheetStamp?.stampedAt}
            onConfirm={() => handleConfirmStamp(stampSheetCenter.id)}
            onDismiss={() => handleDismissStamp(stampSheetCenter.id)}
            onAnimationEnd={handleStampAnimationEnd}
          />
        )}

        {activeRide.status === 'finished' && (
          <SummarySheet
            distanceKm={activeRide.distanceKm}
            movingTimeSec={activeRide.movingTimeSec}
            stampCount={rideStamps.length}
            onSave={handleSaveSummary}
          />
        )}
      </section>
    </SkyBackground>
  )
}
