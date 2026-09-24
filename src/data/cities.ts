import type { City } from '../types'

// source: openstreetmap MCP (openstreetmap_search_places / openstreetmap_query_nearby)
// 초기 시드는 수동 작성 → Antigravity에서 OSM MCP로 이름·좌표 검증/보강할 것 (docs/mcp/usage.md)
export const CITIES: City[] = [
  {
    id: 'berlin',
    name: '베를린',
    nameEn: 'Berlin',
    country: 'DE',
    lat: 52.52,
    lon: 13.405,
    places: [
      { id: 'b1', name: 'Brandenburger Tor', category: 'sight', note: '야경도 예쁨' },
      { id: 'b2', name: 'East Side Gallery', category: 'sight', note: '베를린 장벽 벽화 1.3km' },
      { id: 'b3', name: 'Flohmarkt am Mauerpark', category: 'market', note: '일요일 벼룩시장 · 빈티지' },
      { id: 'b4', name: "Mustafa's Gemüse Kebap", category: 'food', note: '줄 서는 케밥' },
      { id: 'b5', name: 'The Barn', category: 'cafe', note: '스페셜티 커피' },
      { id: 'b6', name: 'Berghain', category: 'night', note: '토요일 밤~일요일' },
    ],
  },
  {
    id: 'munich',
    name: '뮌헨',
    nameEn: 'Munich',
    country: 'DE',
    lat: 48.137,
    lon: 11.575,
    places: [
      { id: 'm1', name: 'Marienplatz', category: 'sight', note: '11시 글로켄슈필' },
      { id: 'm2', name: 'Englischer Garten', category: 'sight', note: '아이스바흐 서핑' },
      { id: 'm3', name: 'Viktualienmarkt', category: 'market', note: '점심 먹기 좋음' },
      { id: 'm4', name: 'Hofbräuhaus', category: 'food', note: '학센 + 맥주' },
      { id: 'm5', name: 'Man versus Machine', category: 'cafe', note: '로컬 로스터리' },
    ],
  },
  {
    id: 'copenhagen',
    name: '코펜하겐',
    nameEn: 'Copenhagen',
    country: 'DK',
    lat: 55.676,
    lon: 12.568,
    places: [
      { id: 'c1', name: 'Nyhavn', category: 'sight', note: '컬러풀한 운하' },
      { id: 'c2', name: 'Tivoli', category: 'sight', note: '시즌별 운영 확인' },
      { id: 'c3', name: 'Torvehallerne', category: 'market', note: '실내 푸드마켓' },
      { id: 'c4', name: 'Reffen', category: 'food', note: '스트리트푸드 (시즌 확인)' },
      { id: 'c5', name: 'Coffee Collective', category: 'cafe', note: '북유럽 라이트 로스팅' },
    ],
  },
  {
    id: 'strasbourg',
    name: '스트라스부르',
    nameEn: 'Strasbourg',
    country: 'FR',
    lat: 48.573,
    lon: 7.752,
    places: [
      { id: 's1', name: 'Cathédrale Notre-Dame', category: 'sight', note: '전망대 계단' },
      { id: 's2', name: 'Petite France', category: 'sight', note: '목조 가옥 골목' },
      { id: 's3', name: 'Place Broglie', category: 'market', note: '크리스마스 마켓 (11월 말~12월)' },
      { id: 's4', name: 'La Maison Kammerzell', category: 'food', note: '슈크루트' },
      { id: 's5', name: 'Christian - Salon de Thé', category: 'cafe', note: '전통 살롱 드 테 · 파티세리' },
      { id: 's6', name: 'La Corde à Linge', category: 'food', note: '쁘띠 프랑스 테라스 · 슈페츨레' },
    ],
  },
  {
    id: 'nuremberg',
    name: '뉘른베르크',
    nameEn: 'Nuremberg',
    country: 'DE',
    lat: 49.452,
    lon: 11.077,
    places: [
      { id: 'n1', name: 'Kaiserburg', category: 'sight', note: '성곽 위 시내 뷰' },
      { id: 'n2', name: 'Hauptmarkt', category: 'market', note: '크리스트킨들스마르크트 (11월 말~12/24)' },
      { id: 'n3', name: 'Bratwursthäusle Nürnberg', category: 'food', note: '뉘른베르거 소시지' },
      { id: 'n4', name: 'Albrecht-Dürer-Haus', category: 'sight', note: '뒤러 생가' },
      { id: 'n5', name: 'Bergbrand', category: 'cafe', note: '바이스게르버가세 로컬 로스터리' },
    ],
  },
  {
    id: 'karlsruhe',
    name: '카를스루에',
    nameEn: 'Karlsruhe',
    country: 'DE',
    lat: 49.007,
    lon: 8.404,
    places: [
      { id: 'k1', name: 'Schloss Karlsruhe', category: 'sight', note: '부채꼴 도시의 중심' },
      { id: 'k2', name: 'ZKM | Zentrum für Kunst und Medien', category: 'sight', note: '미디어아트 센터' },
      { id: 'k3', name: 'Schlossgarten', category: 'sight', note: '산책' },
      { id: 'k4', name: 'Vogelbräu Karlsruhe', category: 'food', note: '하우스 맥주' },
      { id: 'k5', name: 'KaffeeBasis', category: 'cafe', note: '스페셜티 커피' },
      { id: 'k6', name: 'Marktplatz', category: 'market', note: '피라미드 광장 · 주간 마켓' },
    ],
  },
]

export const CATEGORY_LABEL: Record<string, string> = {
  sight: '명소',
  food: '맛집',
  cafe: '카페',
  night: '나이트',
  market: '마켓',
}
