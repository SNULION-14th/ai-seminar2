// 공유 링크 인코딩/디코딩 — docs/specs/feature-share.md SHR-04
// 요약 데이터(닉네임, 도장 목록, 일자별 거리, 단순화한 궤적)를 JSON → lz-string 압축 →
// URL 안전 문자열로 만든다. 서버 저장은 하지 않는다. React·DOM·브라우저 API는 쓰지 않는다.
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { z } from 'zod'
import { haversineKm } from './geo'
import type { LatLng } from './types'

export const SHARE_PAYLOAD_VERSION = 1 as const

/** 공유 URL(`#/s/<payload>`)의 목표 길이. 넘으면 궤적을 단계적으로 줄인다 (feature-share.md §4). */
export const MAX_SHARE_URL_LENGTH = 2000

export interface ShareDayDistance {
  date: string // ISO date "2026-10-03"
  distanceKm: number
}

/** 공유 페이지가 읽는 요약 데이터. 사진·정밀 좌표(궤적 숨기기 시)는 담지 않는다. */
export interface SharePayloadV1 {
  v: 1
  /** 빈 문자열이면 화면에서 "익명의 라이더"로 보여 준다 (표시는 UI 담당) */
  nickname: string
  /** 찍은 인증센터 id 목록. 순서 무관, 중복 없음 */
  stampCenterIds: string[]
  days: ShareDayDistance[]
  /** 단순화한 궤적. SHR-07 "정밀 궤적 숨기기"가 켜져 있거나 길이 제한 때문에 뺐으면 없다 */
  track?: LatLng[]
}

export interface EncodeShareOptions {
  nickname: string
  stampCenterIds: readonly string[]
  days: readonly ShareDayDistance[]
  /** 정밀 궤적. SHR-07에서 "정밀 궤적 숨기기"가 켜져 있으면 넘기지 않는다(undefined) */
  track?: readonly LatLng[]
}

// ---- 압축 전 JSON에 실제로 실리는 모양(wire format). 키를 짧게 써서 URL 길이를 줄인다 ----

const wireDaySchema = z.object({
  a: z.string().min(1), // date
  k: z.number(), // distanceKm
})

const wireLatLngSchema = z.tuple([z.number(), z.number()]) // [lat, lng]

const wireSchema = z.object({
  v: z.literal(1),
  n: z.string().max(40), // nickname
  s: z.array(z.string().min(1)).max(200), // stampCenterIds
  y: z.array(wireDaySchema).max(60), // days
  t: z.array(wireLatLngSchema).max(1000).optional(), // track
})

type Wire = z.infer<typeof wireSchema>

const round = (n: number, decimals: number): number => {
  const p = 10 ** decimals
  return Math.round(n * p) / p
}

const dedupe = (ids: readonly string[]): string[] => Array.from(new Set(ids))

const toWire = (options: EncodeShareOptions, track?: readonly LatLng[]): Wire => ({
  v: SHARE_PAYLOAD_VERSION,
  n: options.nickname.trim().slice(0, 40),
  s: dedupe(options.stampCenterIds),
  y: options.days.map((d) => ({ a: d.date, k: round(d.distanceKm, 2) })),
  ...(track && track.length > 0
    ? { t: track.map((p): [number, number] => [round(p.lat, 5), round(p.lng, 5)]) }
    : {}),
})

const compress = (wire: Wire): string => compressToEncodedURIComponent(JSON.stringify(wire))

const fromWire = (wire: Wire): SharePayloadV1 => ({
  v: wire.v,
  nickname: wire.n,
  stampCenterIds: wire.s,
  days: wire.y.map((d) => ({ date: d.a, distanceKm: d.k })),
  ...(wire.t ? { track: wire.t.map(([lat, lng]): LatLng => ({ lat, lng })) } : {}),
})

/**
 * 궤적을 단계적으로 단순화하는 허용 오차(km) 사다리. 0부터 시작해 URL 길이가
 * MAX_SHARE_URL_LENGTH를 넘으면 다음 값으로 더 거칠게 단순화한다.
 */
const TRACK_TOLERANCE_LADDER_KM: readonly number[] = [0, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]

/**
 * Douglas-Peucker로 궤적을 단순화한다. toleranceKm보다 원래 선에 가까운 점은 버린다.
 * 좌표계가 좁은 지역이라 haversineKm 기반 수선의 발 거리로 근사한다.
 */
export function simplifyTrack(points: readonly LatLng[], toleranceKm: number): LatLng[] {
  if (points.length <= 2 || toleranceKm <= 0) return points.slice()

  const first = points[0]
  const last = points[points.length - 1]

  let maxDistKm = 0
  let splitIndex = 0
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistanceKm(points[i], first, last)
    if (d > maxDistKm) {
      maxDistKm = d
      splitIndex = i
    }
  }

  if (maxDistKm <= toleranceKm) return [first, last]

  const left = simplifyTrack(points.slice(0, splitIndex + 1), toleranceKm)
  const right = simplifyTrack(points.slice(splitIndex), toleranceKm)
  return left.slice(0, -1).concat(right)
}

/** 점 p에서 선분 a-b까지 수선의 발까지의 거리(km). 등장방형 근사(snapToRoute와 동일한 방식) */
function perpendicularDistanceKm(p: LatLng, a: LatLng, b: LatLng): number {
  const cosLat = Math.cos((a.lat * Math.PI) / 180)
  const abx = (b.lng - a.lng) * cosLat
  const aby = b.lat - a.lat
  const apx = (p.lng - a.lng) * cosLat
  const apy = p.lat - a.lat
  const len2 = abx * abx + aby * aby

  if (len2 === 0) return haversineKm(p, a)

  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / len2))
  const proj: LatLng = { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) }
  return haversineKm(p, proj)
}

/**
 * 요약 데이터를 `#/s/<payload>`에 쓸 URL 안전 문자열로 인코딩한다.
 * 길이가 MAX_SHARE_URL_LENGTH를 넘으면 궤적을 단계적으로 단순화하고,
 * 그래도 넘으면 궤적을 빼고 도장(=구간) 단위로만 표현한다.
 */
export function encodeSharePayload(options: EncodeShareOptions): string {
  const track = options.track
  if (track && track.length > 0) {
    for (const toleranceKm of TRACK_TOLERANCE_LADDER_KM) {
      const simplified = simplifyTrack(track, toleranceKm)
      const encoded = compress(toWire(options, simplified))
      if (encoded.length <= MAX_SHARE_URL_LENGTH) return encoded
    }
  }

  // 궤적 없이 인코딩한다. 도장 목록만으로도 화면은 인증센터 단위 구간을 보여 줄 수 있다.
  return compress(toWire(options))
}

/**
 * `#/s/<payload>` 해시를 디코딩한다. payload는 신뢰할 수 없는 입력이다.
 * 압축 해제나 JSON 파싱, 스키마 검증 중 하나라도 실패하면 크래시 없이 null을 돌려준다.
 * 호출부(SharedPage)는 null이면 "손상된 링크" 화면을 보여 준다.
 */
export function decodeSharePayload(encoded: string | null | undefined): SharePayloadV1 | null {
  if (!encoded) return null

  let json: string | null
  try {
    json = decompressFromEncodedURIComponent(encoded)
  } catch {
    return null
  }
  if (!json) return null

  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return null
  }

  const result = wireSchema.safeParse(raw)
  return result.success ? fromWire(result.data) : null
}
