import { sampleGames, samplePlayers } from '../data/nba'
import type { NbaGame, PlayerSpotlight } from '../types/nba'
export interface NbaDataAdapter { getGames(): Promise<NbaGame[]>; getPlayers(): Promise<PlayerSpotlight[]> }
/** Browser-safe development adapter. Replace with a server endpoint that calls NBA Stats MCP / NBA Player Stats MCP. */
export const mockNbaAdapter: NbaDataAdapter = { getGames: async () => sampleGames, getPlayers: async () => samplePlayers }
export const nbaService = mockNbaAdapter
