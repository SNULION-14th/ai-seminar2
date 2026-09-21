import type { NbaGame, PlayerSpotlight } from '../types/nba'
export const sampleGames: NbaGame[] = [
  { id:'lal-gsw-2025-02-14', date:'2025-02-14', startTime:'한국 시간 10:30', venue:'크립토닷컴 아레나 · 로스앤젤레스', status:'UPCOMING', homeTeam:{id:'lal',name:'레이커스',shortName:'LAL',record:'31승 21패',color:'#f5c242'},awayTeam:{id:'gsw',name:'워리어스',shortName:'GSW',record:'27승 25패',color:'#4e9ee8'} },
  { id:'lal-gsw-2025-02-12', date:'2025-02-12', startTime:'종료', venue:'크립토닷컴 아레나 · 로스앤젤레스', status:'FINAL', homeScore:120, awayScore:112, homeTeam:{id:'lal',name:'레이커스',shortName:'LAL',record:'31승 21패',color:'#f5c242'},awayTeam:{id:'gsw',name:'워리어스',shortName:'GSW',record:'27승 25패',color:'#4e9ee8'} },
]
export const samplePlayers: PlayerSpotlight[] = [
  {id:'lebron-james',name:'르브론 제임스',team:'LAL',position:'포워드',headlineValue:'25.1',headlineLabel:'평균 득점',points:25.1,rebounds:7.8,assists:8.2,color:'#f5c242'},
  {id:'stephen-curry',name:'스테픈 커리',team:'GSW',position:'가드',headlineValue:'4.6',headlineLabel:'평균 3점슛',points:24.2,rebounds:4.4,assists:6.1,color:'#4e9ee8'},
  {id:'anthony-davis',name:'앤서니 데이비스',team:'LAL',position:'센터',headlineValue:'11.8',headlineLabel:'평균 리바운드',points:24.7,rebounds:11.8,assists:3.5,color:'#f36b2b'},
]
