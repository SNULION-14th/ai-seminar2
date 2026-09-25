export type MatchType = '단식' | '복식' | '연습'
export type MatchResult = '승' | '패' | '연습'

// Notion "Rally Log 경기 기록" DB와 같은 필드 구성
export interface TennisRecord {
  id: string
  title: string
  date: string // YYYY-MM-DD
  type: MatchType
  opponent: string
  score: string
  result: MatchResult
  court: string
  memo: string
}

export type PlayVerdict = '치기 좋음' | '애매' | '비추'

export interface CourtWeather {
  temperature: number
  precipitationProbability: number
  windSpeed: number
  verdict: PlayVerdict
  reason: string
}
