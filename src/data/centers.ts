// ⚠️ 초안 데이터 (domain-data.md §2, §3). 좌표·누적거리·고도는 대략적인 값이다.
// 공식 자료(자전거행복나눔 등) 대조 검증은 v1 범위 밖이다.
// 충주댐은 우회 지점이지만 초안에서는 비내섬 → 충주댐 → 충주 탄금대 순서의 경로상 지점으로 둔다.
import type { CertCenter } from '../domain/types'

export const CENTERS: readonly CertCenter[] = [
  // 아라자전거길
  { id: 'ara-west', name: '아라서해갑문', sectionId: 'ara', lat: 37.5635, lng: 126.678, kmFromStart: 0, elevationM: 5, nearbyTown: '인천' },
  { id: 'ara-hangang', name: '아라한강갑문', sectionId: 'ara', lat: 37.601, lng: 126.806, kmFromStart: 21, elevationM: 8, nearbyTown: '김포' },
  // 한강자전거길
  { id: 'yeouido', name: '여의도', sectionId: 'hangang', lat: 37.5285, lng: 126.934, kmFromStart: 42, elevationM: 10, nearbyTown: '서울' },
  { id: 'gwangnaru', name: '광나루', sectionId: 'hangang', lat: 37.546, lng: 127.12, kmFromStart: 61, elevationM: 15, nearbyTown: '서울' },
  // 남한강자전거길
  { id: 'neungnae', name: '능내역', sectionId: 'namhan', lat: 37.553, lng: 127.306, kmFromStart: 80, elevationM: 30, nearbyTown: '남양주' },
  { id: 'yangpyeong', name: '양평군립미술관', sectionId: 'namhan', lat: 37.49, lng: 127.491, kmFromStart: 107, elevationM: 30, nearbyTown: '양평' },
  { id: 'ipo', name: '이포보', sectionId: 'namhan', lat: 37.405, lng: 127.544, kmFromStart: 124, elevationM: 40, nearbyTown: '이포' },
  { id: 'yeoju', name: '여주보', sectionId: 'namhan', lat: 37.326, lng: 127.609, kmFromStart: 139, elevationM: 45, nearbyTown: '여주' },
  { id: 'gangcheon', name: '강천보', sectionId: 'namhan', lat: 37.331, lng: 127.688, kmFromStart: 148, elevationM: 50, nearbyTown: '여주' },
  { id: 'binaeseom', name: '비내섬', sectionId: 'namhan', lat: 37.131, lng: 127.804, kmFromStart: 176, elevationM: 70 },
  { id: 'chungjudam', name: '충주댐', sectionId: 'namhan', lat: 37.0, lng: 127.99, kmFromStart: 200, elevationM: 110, nearbyTown: '충주' },
  { id: 'tangeumdae', name: '충주 탄금대', sectionId: 'namhan', lat: 36.986, lng: 127.903, kmFromStart: 209, elevationM: 65, nearbyTown: '충주' },
  // 새재자전거길
  { id: 'suanbo', name: '수안보온천', sectionId: 'saejae', lat: 36.847, lng: 127.993, kmFromStart: 236, elevationM: 150, nearbyTown: '수안보' },
  { id: 'ihwaryeong', name: '이화령휴게소', sectionId: 'saejae', lat: 36.765, lng: 128.055, kmFromStart: 256, elevationM: 530, nearbyTown: '문경' },
  { id: 'buljeong', name: '문경불정역', sectionId: 'saejae', lat: 36.623, lng: 128.16, kmFromStart: 281, elevationM: 110, nearbyTown: '문경' },
  { id: 'sangpung', name: '상주 상풍교', sectionId: 'saejae', lat: 36.514, lng: 128.264, kmFromStart: 309, elevationM: 55 },
  // 낙동강자전거길
  { id: 'sangjubo', name: '상주보', sectionId: 'nakdong', lat: 36.438, lng: 128.261, kmFromStart: 322, elevationM: 50, nearbyTown: '상주' },
  { id: 'nakdanbo', name: '낙단보', sectionId: 'nakdong', lat: 36.353, lng: 128.295, kmFromStart: 336, elevationM: 45 },
  { id: 'gumibo', name: '구미보', sectionId: 'nakdong', lat: 36.237, lng: 128.349, kmFromStart: 358, elevationM: 40, nearbyTown: '구미' },
  { id: 'chilgokbo', name: '칠곡보', sectionId: 'nakdong', lat: 36.011, lng: 128.404, kmFromStart: 395, elevationM: 30, nearbyTown: '왜관' },
  { id: 'gangjeong', name: '강정고령보', sectionId: 'nakdong', lat: 35.842, lng: 128.465, kmFromStart: 425, elevationM: 25, nearbyTown: '대구' },
  { id: 'dalseongbo', name: '달성보', sectionId: 'nakdong', lat: 35.739, lng: 128.423, kmFromStart: 445, elevationM: 22, nearbyTown: '현풍' },
  { id: 'hapcheon', name: '합천창녕보', sectionId: 'nakdong', lat: 35.57, lng: 128.365, kmFromStart: 481, elevationM: 18, nearbyTown: '적포' },
  { id: 'changnyeong', name: '창녕함안보', sectionId: 'nakdong', lat: 35.379, lng: 128.445, kmFromStart: 530, elevationM: 15, nearbyTown: '남지' },
  { id: 'yangsan', name: '양산물문화관', sectionId: 'nakdong', lat: 35.36, lng: 128.985, kmFromStart: 598, elevationM: 10, nearbyTown: '물금' },
  { id: 'hagutdug', name: '낙동강하굿둑', sectionId: 'nakdong', lat: 35.106, lng: 128.946, kmFromStart: 633, elevationM: 3, nearbyTown: '부산' },
]

/** id로 인증센터를 찾는다. 없으면 undefined. */
export function getCenter(id: string): CertCenter | undefined {
  return CENTERS.find((c) => c.id === id)
}
