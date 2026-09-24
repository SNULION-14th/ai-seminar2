// 데이터 백업 — 전체 로컬 데이터(계획, 도장, 라이드)를 JSON으로 내보내고 가져온다 (SHR-09).
// 가져오는 파일은 신뢰할 수 없는 입력이므로 zod로 검증한다. domain/types.ts의 타입을
// 그대로 미러링한다(그 파일은 Lead 소유 계약 파일이라 여기서 별도로 스키마를 둔다).
import { z } from 'zod'
import type { Ride, Stamp, TripPlan } from '../../domain/types'

export const BACKUP_VERSION = 1 as const

const trackPointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  t: z.number(),
  acc: z.number().optional(),
})

const rideSchema = z.object({
  id: z.string().min(1),
  startedAt: z.string().min(1),
  endedAt: z.string().optional(),
  track: z.array(trackPointSchema),
  distanceKm: z.number(),
  movingTimeSec: z.number(),
  source: z.enum(['gps', 'simulated']),
  memo: z.string().optional(),
})

const stampSchema = z.object({
  centerId: z.string().min(1),
  stampedAt: z.string().min(1),
  rideId: z.string().optional(),
  method: z.enum(['auto', 'manual']),
})

const dayPlanSchema = z.object({
  dayIndex: z.number(),
  date: z.string().min(1),
  fromCenterId: z.string().min(1),
  toCenterId: z.string().min(1),
  distanceKm: z.number(),
  climbM: z.number(),
  stayTown: z.string().optional(),
})

const tripPlanSchema = z.object({
  id: z.string().min(1),
  startDate: z.string().min(1),
  days: z.array(dayPlanSchema),
  pace: z.enum(['relaxed', 'normal', 'hard']),
  createdAt: z.string().min(1),
  checklist: z.record(z.string(), z.boolean()),
})

const backupSchema = z.object({
  v: z.literal(1),
  exportedAt: z.string().min(1),
  plan: tripPlanSchema.nullable(),
  stamps: z.array(stampSchema),
  rides: z.array(rideSchema),
})

export type BackupFile = z.infer<typeof backupSchema>

export function buildBackup(data: { plan: TripPlan | null; stamps: Stamp[]; rides: Ride[] }): BackupFile {
  return { v: BACKUP_VERSION, exportedAt: new Date().toISOString(), ...data }
}

/** 가져온 JSON을 검증한다. 손상되었거나 스키마에 맞지 않으면 null. */
export function parseBackup(raw: unknown): BackupFile | null {
  const result = backupSchema.safeParse(raw)
  return result.success ? result.data : null
}
