export type GameStatus = 'UPCOMING' | 'FINAL' | 'LIVE'
export interface NbaTeam { id: string; name: string; shortName: string; record: string; color: string }
export interface NbaGame { id: string; date: string; venue: string; status: GameStatus; homeTeam: NbaTeam; awayTeam: NbaTeam; homeScore?: number; awayScore?: number; startTime: string }
export interface PlayerSpotlight { id: string; name: string; team: string; position: string; headlineValue: string; headlineLabel: string; points: number; rebounds: number; assists: number; color: string }
