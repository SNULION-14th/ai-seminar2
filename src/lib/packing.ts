import type { DailyWeather, PackItem } from '../types'
import { isSnow } from './weatherCode'

const BASE: PackItem[] = [
  { id: 'passport', label: '여권 / 학생증', reason: '항상', auto: true },
  { id: 'charger', label: '충전기 · 멀티어댑터', reason: '항상', auto: true },
  { id: 'ticket', label: '교통카드 / Deutschlandticket', reason: '항상', auto: true },
]

/** 날씨 → 짐 목록 (docs/product/spec.md "짐 자동 생성 규칙") */
export function buildPackingList(days: DailyWeather[]): PackItem[] {
  if (days.length === 0) return BASE

  const minT = Math.min(...days.map((d) => d.tMin))
  const maxT = Math.max(...days.map((d) => d.tMax))
  const rainy = days.some((d) => (d.precipProb ?? 0) >= 50 || d.precipSum >= 1)
  const snowy = days.some((d) => isSnow(d.code))

  const items: PackItem[] = [...BASE]
  const add = (id: string, label: string, reason: string) =>
    items.push({ id, label, reason, auto: true })

  if (minT <= 5) {
    add('coat', '패딩 / 두꺼운 외투', `최저 ${minT}°C`)
    add('gloves', '장갑 · 목도리', `최저 ${minT}°C`)
  }
  if (minT <= 0) {
    add('heatpack', '핫팩', '영하')
    add('socks', '방한 양말', '영하')
  }
  if (maxT >= 22) {
    add('tshirt', '반팔', `최고 ${maxT}°C`)
    add('sunscreen', '선크림', `최고 ${maxT}°C`)
  }
  if (rainy) {
    add('umbrella', '우산', '비 예보')
    add('shoes', '방수 신발', '비 예보')
  }
  if (snowy) add('grip', '미끄럼 방지 신발', '눈 예보')

  return items
}
