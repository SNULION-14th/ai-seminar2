# 도메인 데이터 & 모델

> Status: **Implemented** (2026-09-24) · 관련: [architecture.md](architecture.md)
> ⚠️ 이 문서의 구간 거리, 인증센터 목록, 좌표는 **초안 데이터**다. v1은 초안 데이터로 구현하고, 공식 자료(자전거행복나눔 등) 대조 검증은 v1 범위 밖으로 둔다. 데이터 파일 상단에 초안 데이터라는 주석을 남긴다.

## 1. 국토종주 구간 (인천 → 부산)

| 순서 | 구간 ID | 이름 | 대략 거리 | 특징 |
| --- | --- | --- | --- | --- |
| 1 | `ara` | 아라자전거길 | 21km | 아라서해갑문 → 아라한강갑문, 평지 |
| 2 | `hangang` | 한강자전거길 | 56km | 서울 도심 통과, 평지 |
| 3 | `namhan` | 남한강자전거길 | 132km | 팔당·양평·여주·충주, 완만 |
| 4 | `saejae` | 새재자전거길 | 100km | 충주 → 상주. **소조령·이화령** 오르막으로 최대 난이도 구간 |
| 5 | `nakdong` | 낙동강자전거길 | 324km | 상주 → 부산. 후반부 **다람재·무심사·박진·영아지 고개** 등 짧고 가파른 업힐 |
| | | **합계** | **약 633km** | |

## 2. 인증센터 (초안 목록, 순서대로)

`ara`: 아라서해갑문, 아라한강갑문
`hangang`: 여의도, 광나루
`namhan`: 능내역, 양평군립미술관, 이포보, 여주보, 강천보, 비내섬, 충주댐, 충주 탄금대
`saejae`: 수안보온천, 이화령휴게소, 문경불정역, 상주 상풍교
`nakdong`: 상주보, 낙단보, 구미보, 칠곡보, 강정고령보, 달성보, 합천창녕보, 창녕함안보, 양산물문화관, 낙동강하굿둑

> 검증할 것: 국토종주 필수 인증센터 목록에 뚝섬 등이 빠지거나 더 들어가는지, 충주댐처럼 우회 지점을 경로상 어떻게 처리할지(왕복 거리 가산 여부).

## 3. 데이터 소스 전략

| 데이터 | v1 방식 | 비고 |
| --- | --- | --- |
| 인증센터 이름/좌표/누적거리 | `src/data/centers.ts` 정적 상수 | M0에서 초안 값으로 작성한다 (대략적인 위치면 충분) |
| 경로 형상(polyline) | **옵션 A (초안 채택)**: 인증센터 사이를 잇는 단순화 polyline(구간마다 중간 경유점 수 개)<br>옵션 B: 공개 GPX를 단순화(Douglas-Peucker)해서 GeoJSON으로 번들 | 옵션 B는 라이선스 확인이 필요하다 |
| 고도 | 인증센터 및 경유점의 고도값으로 보간 | 이화령 약 530m 등 주요 고개는 반드시 포함 |
| 숙박 거점 | 인증센터 인근 도시/읍 이름만 (`nearbyTown`) | 개별 숙소 정보는 다루지 않는다 |

## 4. 타입 모델 (TypeScript)

```ts
type SectionId = 'ara' | 'hangang' | 'namhan' | 'saejae' | 'nakdong';

interface Section {
  id: SectionId;
  name: string;           // "새재자전거길"
  order: number;
  distanceKm: number;
  difficulty: 1 | 2 | 3;  // 1 평지, 3 고개
}

interface CertCenter {
  id: string;             // "ihwaryeong"
  name: string;           // "이화령휴게소"
  sectionId: SectionId;
  lat: number;
  lng: number;
  kmFromStart: number;    // 인천 기점 누적 거리
  elevationM: number;
  nearbyTown?: string;    // 숙박 거점 후보 "문경"
}

interface RoutePoint { lat: number; lng: number; km: number; ele: number; }

// ---- 사용자 데이터 (localStorage/IndexedDB) ----
interface TripPlan {
  id: string;
  startDate: string;      // ISO date
  days: DayPlan[];
  pace: 'relaxed' | 'normal' | 'hard';
  createdAt: string;
  checklist: Record<string, boolean>;
}

interface DayPlan {
  dayIndex: number;       // 1부터
  date: string;
  fromCenterId: string;
  toCenterId: string;
  distanceKm: number;
  climbM: number;         // 누적 상승 고도
  stayTown?: string;
}

interface Ride {
  id: string;
  startedAt: string;
  endedAt?: string;
  track: TrackPoint[];    // 샘플링된 GPS 좌표
  distanceKm: number;
  movingTimeSec: number;
  source: 'gps' | 'simulated';
  memo?: string;
}

interface TrackPoint { lat: number; lng: number; t: number; acc?: number; }

interface Stamp {
  centerId: string;
  stampedAt: string;
  rideId?: string;
  method: 'auto' | 'manual'; // 반경 진입 자동 제안 후 확인 = auto
}
```

## 5. 도메인 로직 (순수 함수, 단위 테스트 대상)

| 함수 | 설명 |
| --- | --- |
| `haversineKm(a, b)` | 두 좌표 간 거리 |
| `snapToRoute(point, route)` | GPS 좌표를 경로상 가장 가까운 지점의 `km`로 투영한다. 경로에서 300m 넘게 벗어나면 `offRoute: true` |
| `splitItinerary(options)` | 일수 또는 하루 목표 거리, 페이스를 받아 인증센터 경계로 `DayPlan[]`을 만든다 (규칙은 [feature-plan.md](feature-plan.md) §3) |
| `nextCenter(km)` | 현재 누적 km 기준 다음 인증센터와 남은 거리 |
| `progress(stamps, rides)` | 전체 진행률(%), 찍은 도장 수, 누적 거리 |

## 6. 수용 기준

- [x] 구간 거리 합계가 633km ± 5km 이내이다 (단위 테스트)
- [x] 모든 인증센터의 `kmFromStart`가 오름차순이다 (단위 테스트)
- [x] 모든 인증센터 좌표가 한반도 범위(위도 34-38.5, 경도 126-129.5) 안에 있고, 인접한 센터 간 직선거리가 누적거리 차이보다 짧다 (단위 테스트, 초안 데이터 sanity check)
- [x] `snapToRoute`가 경로 위 좌표에서 오차 0.5km 이내를 반환한다 (단위 테스트)
