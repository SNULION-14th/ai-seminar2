// ⚠️ 초안 데이터 (domain-data.md §1). 공식 자료 대조 검증은 v1 범위 밖이다.
import type { Section } from '../domain/types'

export const SECTIONS: readonly Section[] = [
  { id: 'ara', name: '아라자전거길', order: 1, distanceKm: 21, difficulty: 1 },
  { id: 'hangang', name: '한강자전거길', order: 2, distanceKm: 56, difficulty: 1 },
  { id: 'namhan', name: '남한강자전거길', order: 3, distanceKm: 132, difficulty: 1 },
  { id: 'saejae', name: '새재자전거길', order: 4, distanceKm: 100, difficulty: 3 }, // 소조령·이화령
  { id: 'nakdong', name: '낙동강자전거길', order: 5, distanceKm: 324, difficulty: 2 }, // 다람재·무심사·박진·영아지
]

/** 인천 → 부산 전체 거리(km). 구간 거리 합계. */
export const TOTAL_KM = SECTIONS.reduce((sum, s) => sum + s.distanceKm, 0)
