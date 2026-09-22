import type { TemplateMode } from './contracts';

export const REFERENCE_MODES: readonly { value: TemplateMode; label: string; detail: string }[] = [
  {
    value: 'strict',
    label: '레퍼런스 유지',
    detail: '기존처럼 사진·글자의 배치와 형식을 가깝게 따릅니다. 내용에 맞춰 조정하며, 원본과 픽셀 단위로 같지는 않습니다.',
  },
  {
    value: 'body',
    label: '본문 재구성',
    detail: '첫 장과 끝 장은 레퍼런스의 형식을 유지하고, 중간 장은 정보의 순서·사진·글자 배치를 새로 디자인합니다.',
  },
  {
    value: 'free',
    label: '전체 재구성',
    detail: '첫 장부터 끝 장까지 새로운 구성을 만듭니다. 레퍼런스의 색·글꼴·판형은 유지합니다.',
  },
];

/** 예전 “참고용으로만” 결과의 유사도는 이제 첫 단계에 해당한다. */
export function normalizeReferenceMode(value: unknown, fallback: TemplateMode = 'strict'): TemplateMode {
  if (value === 'reference') return 'strict';
  if (value === 'strict' || value === 'body' || value === 'free') return value;
  return fallback === 'body' || fallback === 'free' ? fallback : 'strict';
}

/** index는 0부터 시작하며, 중간 장수와 레퍼런스 장수가 달라도 적용 범위는 변하지 않는다. */
export function isReferenceKeptCard(mode: TemplateMode, index: number, count: number): boolean {
  return mode === 'strict' || (mode === 'body' && (index === 0 || index === count - 1));
}

export function describeReferenceMode(
  mode: TemplateMode,
  count: number,
  frames: readonly { frameName: string }[],
): string {
  const first = frames[0]?.frameName ?? '(없음)';
  const last = frames[frames.length - 1]?.frameName ?? '(없음)';
  const label = REFERENCE_MODES.find((item) => item.value === mode)?.label ?? REFERENCE_MODES[0].label;
  const scope = Array.from({ length: count }, (_, index) => {
    const role = index === 0 ? '표지' : index === count - 1 ? '마무리' : '본문';
    const retained = isReferenceKeptCard(mode, index, count);
    const reference = index === 0 ? `첫 프레임 “${first}”` : index === count - 1 ? `마지막 프레임 “${last}”` : '내용에 맞는 본문 프레임';
    return `· ${index + 1}장(${role}): ${retained ? `${reference}의 배치·형식 유지` : '사진·글자·정보의 구성을 새로 설계'}`;
  }).join('\n');

  const retainedRules = mode === 'free' ? '' : `
유지하는 장은 사진의 위치·대략적인 비중, 제목과 본문의 위계, 정렬, 강조 방식을 가깝게 따르세요.
내용 길이에 맞춰 상자를 조정할 수 있으며 픽셀 단위 복제는 요구하지 않습니다.
레퍼런스의 frames 배열 순서가 카드 순서입니다. 프레임 이름의 숫자로 다시 정렬하지 마세요.
요청 장수와 레퍼런스 장수가 달라도 출력 첫 장은 첫 프레임, 출력 끝 장은 마지막 프레임을 기준으로 합니다.
본문 레퍼런스가 여러 장이면 내용에 맞게 고르고, 중간 프레임이 없으면 제공된 프레임의 형식을 참고하세요.`;

  const redesignedRules = mode === 'strict' ? '' : `
재구성하는 장은 레퍼런스의 좌표·블록 수·사진 자리·사진 면적·여백을 복사하지 마세요.
문구나 사진만 교체하는 것은 재구성이 아닙니다. 각 장마다 정보 그룹의 구조, 사진 유무·비중, 글자 정렬·강조 위치 중 최소 두 가지를 새로 결정하세요.
내용에 따라 2단 비교, 큰 숫자를 중심으로 한 설명, 인용문, 단계별 흐름, 글자 중심 카드, 비대칭 사진·설명 구성을 고려하세요.
이들은 예시일 뿐 고정 프리셋이나 필수 목록이 아닙니다. 내용을 가장 잘 전달하는 구성을 직접 설계하세요.
재구성하는 장에는 원본 여백 값·사진 면적 비율·서명 요소·상자 채움 비율을 강제하지 않습니다.
짧은 제목·큰 숫자·인용문과 의도적인 여백을 허용합니다. 사진은 필요한 장에만 넣고 글자만으로 설계해도 됩니다.
색 역할·글꼴과 크기 조합·판형은 공통 기준을 따르고, 넘침·겹침·대비 검사는 모든 장에 적용합니다.`;

  return `선택한 방식: ${label}\n${scope}\n${retainedRules}\n${redesignedRules}`.trim();
}
