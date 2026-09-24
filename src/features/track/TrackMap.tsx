// 지도 — TRK-08. Leaflet + react-leaflet + OSM 타일 (architecture.md, feature-track.md 결정 로그).
// 경로(회색), 오늘 궤적(강물색, 기록 공백은 따로 그려서 직선으로 잇지 않는다 TRK-12),
// 현재 위치(노을색 펄스), 인증센터 마커(찍음/안찍음 구분)를 올린다.
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import { CENTERS } from '../../data/centers'
import { ROUTE } from '../../data/route'
import { splitTrackByGaps } from '../../domain/tracking'
import type { LatLng, TrackPoint } from '../../domain/types'
import styles from './TrackMap.module.css'

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'

const currentIcon = L.divIcon({
  className: styles.currentDot,
  iconSize: [16, 16],
})

function centerIcon(stamped: boolean) {
  return L.divIcon({
    className: stamped ? `${styles.centerDot} ${styles.centerDotStamped}` : styles.centerDot,
    iconSize: [14, 14],
  })
}

/**
 * Leaflet Polyline은 SVG 속성으로 색을 그리므로 var(--token) 문자열이 아니라 실제 계산값이 필요하다.
 * tokens.css 값을 그대로 읽어 쓴다 (hex를 직접 쓰지 않는다, CLAUDE.md §3).
 */
function readColorToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** currentPosition이 바뀔 때마다 지도를 그쪽으로 슬며시 옮긴다 */
function FollowCurrentPosition({ position }: { position: LatLng | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.panTo([position.lat, position.lng], { animate: true, duration: 0.4 })
  }, [map, position])
  return null
}

export interface TrackMapProps {
  track: readonly TrackPoint[]
  currentPosition: LatLng | null
  isStamped: (centerId: string) => boolean
}

export function TrackMap({ track, currentPosition, isStamped }: TrackMapProps) {
  const routePositions = useMemo<[number, number][]>(
    () => ROUTE.map((p) => [p.lat, p.lng]),
    [],
  )
  const trackSegments = useMemo<[number, number][][]>(
    () => splitTrackByGaps(track).map((seg) => seg.map((p) => [p.lat, p.lng])),
    [track],
  )
  const colors = useMemo(
    () => ({ route: readColorToken('--c-mist'), track: readColorToken('--c-river') }),
    [],
  )
  const start = currentPosition ?? ROUTE[0]

  return (
    <div className={styles.wrap}>
      <MapContainer
        className={styles.map}
        center={[start.lat, start.lng]}
        zoom={13}
        scrollWheelZoom
      >
        <TileLayer url={OSM_URL} attribution={OSM_ATTRIBUTION} />
        <Polyline positions={routePositions} pathOptions={{ color: colors.route, weight: 3, opacity: 0.9 }} />
        {trackSegments.map((seg, i) => (
          <Polyline key={i} positions={seg} pathOptions={{ color: colors.track, weight: 4 }} />
        ))}
        {CENTERS.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={centerIcon(isStamped(c.id))} />
        ))}
        {currentPosition && (
          <Marker position={[currentPosition.lat, currentPosition.lng]} icon={currentIcon} />
        )}
        <FollowCurrentPosition position={currentPosition} />
      </MapContainer>
    </div>
  )
}
