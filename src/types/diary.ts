export type DiaryResult = 'WIN' | 'LOSS' | 'DRAW' | 'UPCOMING'
export type ViewingMode = 'HOME' | 'ARENA' | 'PUB' | 'POPUP'
export interface DiaryEntry { id: string; gameId?: string; gameDate: string; favoriteTeam: string; opponentTeam: string; homeScore?: number; awayScore?: number; result: DiaryResult; viewingMode: ViewingMode; venue?: string; seat?: string; favoritePlayer?: string; rating: number; mood?: string; note?: string; photos: string[]; ticketImage?: string; createdAt: string; updatedAt: string }
export type DiaryDraft = Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>
