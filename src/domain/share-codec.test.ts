import { describe, expect, it } from 'vitest'
import { CENTERS } from '../data/centers'
import { pointAtKm } from './geo'
import {
  MAX_SHARE_URL_LENGTH,
  decodeSharePayload,
  encodeSharePayload,
  simplifyTrack,
  type EncodeShareOptions,
} from './share-codec'

// 완주 수준의 데이터: CENTERS 전체 도장 + 5일 (feature-share.md §5 수용 기준, 결정 로그 2026-09-24)
const FULL_STAMPS = CENTERS.map((c) => c.id)
const FIVE_DAYS = [
  { date: '2026-10-03', distanceKm: 130 },
  { date: '2026-10-04', distanceKm: 130 },
  { date: '2026-10-05', distanceKm: 130 },
  { date: '2026-10-06', distanceKm: 130 },
  { date: '2026-10-07', distanceKm: 113 },
]

// 0.5km 간격으로 촘촘하게 보간한 실제 GPS 기록 수준의 궤적 (약 1,267개 점)
const DENSE_TRACK = Array.from({ length: Math.floor(633 / 0.5) + 1 }, (_, i) => {
  const p = pointAtKm(i * 0.5)
  return { lat: p.lat, lng: p.lng }
})

const baseOptions: EncodeShareOptions = {
  nickname: '한준',
  stampCenterIds: FULL_STAMPS,
  days: FIVE_DAYS,
}

describe('encodeSharePayload', () => {
  it('완주 수준 데이터(도장 27개, 5일, 궤적 없음)로 만든 링크가 2,000자 이하다', () => {
    const encoded = encodeSharePayload(baseOptions)
    expect(FULL_STAMPS.length).toBeGreaterThanOrEqual(26)
    expect(encoded.length).toBeLessThanOrEqual(MAX_SHARE_URL_LENGTH)
  })

  it('촘촘한 GPS 궤적(약 1,267점)을 더해도 단계적으로 단순화해 2,000자 이하로 만든다', () => {
    const encoded = encodeSharePayload({ ...baseOptions, track: DENSE_TRACK })
    expect(encoded.length).toBeLessThanOrEqual(MAX_SHARE_URL_LENGTH)

    const decoded = decodeSharePayload(encoded)
    expect(decoded).not.toBeNull()
    // 단순화됐더라도 원래 궤적보다 점 수가 같거나 적다
    expect(decoded!.track!.length).toBeLessThanOrEqual(DENSE_TRACK.length)
  })

  it('닉네임 앞뒤 공백을 지우고 40자를 넘으면 자른다', () => {
    const long = '가'.repeat(50)
    const decoded = decodeSharePayload(encodeSharePayload({ ...baseOptions, nickname: `  ${long}  ` }))
    expect(decoded!.nickname).toBe(long.slice(0, 40))
  })

  it('같은 인증센터를 중복으로 넘기면 한 번만 담는다', () => {
    const decoded = decodeSharePayload(
      encodeSharePayload({ ...baseOptions, stampCenterIds: [...FULL_STAMPS, FULL_STAMPS[0]] }),
    )
    expect(decoded!.stampCenterIds).toHaveLength(FULL_STAMPS.length)
  })
})

describe('encodeSharePayload → decodeSharePayload 라운드트립', () => {
  it('궤적 없이 인코딩·디코딩하면 같은 요약이 나온다', () => {
    const decoded = decodeSharePayload(encodeSharePayload(baseOptions))
    expect(decoded).toEqual({
      v: 1,
      nickname: '한준',
      stampCenterIds: FULL_STAMPS,
      days: FIVE_DAYS,
    })
  })

  it('궤적을 넘기지 않으면(SHR-07 정밀 궤적 숨기기) 디코딩 결과에도 track이 없다', () => {
    const decoded = decodeSharePayload(encodeSharePayload(baseOptions))
    expect(decoded!.track).toBeUndefined()
  })

  it('짧은 궤적은 그대로(또는 거의 그대로) 왕복한다', () => {
    const track = [
      { lat: 37.5635, lng: 126.678 },
      { lat: 37.601, lng: 126.806 },
      { lat: 37.5285, lng: 126.934 },
    ]
    const decoded = decodeSharePayload(encodeSharePayload({ ...baseOptions, track }))
    expect(decoded!.track).toEqual(track)
  })
})

describe('decodeSharePayload', () => {
  it('빈 문자열/undefined는 null이다', () => {
    expect(decodeSharePayload('')).toBeNull()
    expect(decodeSharePayload(undefined)).toBeNull()
    expect(decodeSharePayload(null)).toBeNull()
  })

  it('압축 해제할 수 없는 임의의 문자열은 크래시 없이 null이다', () => {
    expect(decodeSharePayload('이건-공유-payload가-아니에요')).toBeNull()
    expect(decodeSharePayload('%%%not-encoded%%%')).toBeNull()
  })

  it('압축은 풀리지만 스키마에 맞지 않는 payload는 null이다', () => {
    const tampered = encodeSharePayload(baseOptions).slice(0, -5) + 'xxxxx'
    expect(decodeSharePayload(tampered)).toBeNull()
  })
})

describe('simplifyTrack', () => {
  it('허용 오차 이내로 거의 일직선인 잡음 점을 지운다', () => {
    const points = [
      { lat: 37.0, lng: 127.0 },
      { lat: 37.0001, lng: 127.05 }, // 직선에서 거의 벗어나지 않는 잡음
      { lat: 37.0, lng: 127.1 },
    ]
    expect(simplifyTrack(points, 0.5)).toEqual([points[0], points[2]])
  })

  it('허용 오차를 벗어나는 굴곡은 남긴다', () => {
    const points = [
      { lat: 37.0, lng: 127.0 },
      { lat: 37.5, lng: 127.05 }, // 뚜렷하게 꺾이는 지점
      { lat: 37.0, lng: 127.1 },
    ]
    expect(simplifyTrack(points, 0.5)).toEqual(points)
  })

  it('점이 2개 이하면 그대로 돌려준다', () => {
    const points = [{ lat: 37.0, lng: 127.0 }]
    expect(simplifyTrack(points, 1)).toEqual(points)
  })
})
