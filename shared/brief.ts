import { extractTokens, roomEm, type DesignTokens } from './designTokens';
import type { FrameSpec, TemplateManifest } from './templateManifest';
import type { GenerateInput } from './contracts';
import type { BriefIdentity } from './workflow';
import { describeReferenceMode } from './referenceModes';

/**
 * 브리프 저장 버튼이 만드는 것.
 *
 * "에이전트를 부른다"고 해서 옆방에 또 하나를 띄울 이유가 없었다. 이걸 쓰는 사람은
 * 이미 에이전트와 대화하는 중이고, 그 에이전트가 이 저장소를 읽을 수 있다.
 * 그래서 여기는 **브리프를 파일로 남기기만 한다.** 나머지는 사람이 한마디 하면 된다.
 *
 * 별도 세션을 띄우던 앞선 시도는 접었다. 맥락이 없어 매번 처음부터 설명해야 했고,
 * 따로 과금됐고, 결과가 검사를 통과했는지 사람이 확인할 방법이 없었다.
 * 지금 구조에서는 에이전트가 validateLayout을 직접 돌려 보고 고쳐서 내놓을 수 있다.
 */




function corner(rect: { x: number; y: number; width: number; height: number }, card: { width: number; height: number }): string {
  const midX = rect.x + rect.width / 2;
  const midY = rect.y + rect.height / 2;
  const full = rect.width >= card.width * 0.95;
  const vertical = midY < card.height / 3 ? '상단' : midY > (card.height * 2) / 3 ? '하단' : '중앙';
  if (full) return `${vertical} 전폭`;
  const horizontal = midX < card.width / 2 ? '좌' : '우';
  return `${horizontal}${vertical}`;
}

/**
 * 레퍼런스의 각 카드가 어떻게 놓였는지 한 줄로 적는다.
 *
 * 수치만 주면 에이전트가 "그래서 어떻게 다르게 놓으라는 건지"를 모른다. 같은 재료가 카드마다
 * 다르게 놓인 실례를 보여줘야 변주가 무엇인지 안다. 레퍼런스의 본문 카드들이 바로 그 교본이다.
 */
function describeFrame(frame: FrameSpec, card: { width: number; height: number }): string {
  const parts: string[] = [];
  const photos = frame.shapes.filter((shape) => shape.rect.width * shape.rect.height > card.width * card.height * 0.08);
  for (const photo of photos) {
    parts.push(`사진 ${corner(photo.rect, card)} ${photo.rect.width}×${photo.rect.height}`);
  }
  const bySize = [...frame.textSlots].sort(
    (a, b) => (b.fontSize === 'mixed' ? 0 : b.fontSize) - (a.fontSize === 'mixed' ? 0 : a.fontSize),
  );
  for (const slot of bySize.slice(0, 4)) {
    const size = slot.fontSize === 'mixed' ? '?' : slot.fontSize;
    parts.push(`${size}px ${corner(slot.rect, card)}`);
  }
  return `· ${frame.frameName}: ${parts.join(', ')}`;
}

function describeTokens(tokens: DesignTokens): string {
  const colors = tokens.palette
    .filter((entry) => entry.role !== 'other')
    .map((entry) => `${entry.role} ${entry.hex}`)
    .join(', ');
  const fonts = tokens.typeScale
    .map((entry) => `${entry.fontSize}px ${entry.fontStyle}`)
    .join(' / ');
  return [
    `판형: ${tokens.cardSize.width}×${tokens.cardSize.height}`,
    `색(역할 이름으로만 쓰세요): ${colors}`,
    `글자(이 조합 외에는 쓸 수 없습니다): ${fonts}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function describeReferenceGeometry(tokens: DesignTokens): string {
  const signature = tokens.signatures[0];
  return [
    `왼쪽 가장자리 여백: ${tokens.margins.values.join(', ') || '측정값 없음'}px (전폭은 0)`,
    signature
      ? `반복 요소: ${signature.thickness}px ${signature.fill} ${signature.orientation === 'vertical' ? '세로' : '가로'}선, 길이 ${signature.length.min}~${signature.length.max}`
      : '반복 요소: 없음',
    tokens.photoAreaRatio
      ? `사진 면적: 카드 면적의 ${Math.round(tokens.photoAreaRatio.min * 100)}~${Math.round(tokens.photoAreaRatio.max * 100)}%`
      : '사진 면적: 측정값 없음',
  ].join('\n');
}

export function buildPrompt(input: GenerateInput, manifest: TemplateManifest, tokens: DesignTokens, identity: BriefIdentity): string {
  const card = tokens.cardSize;
  const density = tokens.density;
  const example = roomEm(density ?? { mean: 0.9, safe: 0.87, samples: 0, spread: 0 }, 901, 216, 30);

  return `당신은 인스타그램 카드뉴스를 디자인합니다. 결과는 JSON 하나뿐이고, 설명은 쓰지 않습니다.

# 무엇을 만드는가

브랜드의 정체성을 유지하면서 이번 내용에 맞는 카드뉴스를 만듭니다.
선택한 레퍼런스 적용 방식에 따라 원본 형식을 유지할 장과 새로 설계할 장을 구분하세요.

# 정보의 우선순위 — 서로 어긋나면 위가 이깁니다

1. 꼭 지킬 것
2. 브랜드 자료
3. 전달할 내용과 목적
4. 타겟 · 어투
5. 레퍼런스

# 이번 건

브랜드: ${input.brandName}
${input.mustFollow.trim() ? `**꼭 지킬 것(최우선): ${input.mustFollow.trim()}**` : '꼭 지킬 것: (없음)'}
전달할 내용과 목적: ${input.sourceContent}
${input.outline.trim() ? `구성: ${input.outline.trim()}` : ''}
타겟: ${input.audience}
어투: ${input.tone === 'friendly' ? '친근한 존댓말' : input.tone === 'calm' ? '차분한 존댓말' : '전문적인 존댓말'}
장수: ${input.cardCount}장

브랜드 자료:
"""
${input.brandMarkdown.slice(0, 8000)}
"""

# 모든 장의 공통 디자인 기준

${describeTokens(tokens)}

# 레퍼런스 적용 범위

${describeReferenceMode(input.templateMode, input.cardCount, manifest.frames)}

# 레퍼런스 관찰값 — 재구성하는 장의 좌표 지시가 아닙니다

${describeReferenceGeometry(tokens)}

레퍼런스 "${manifest.fileName}"의 카드들이 같은 재료를 어떻게 다르게 놓았는지:

${manifest.frames.map((frame) => describeFrame(frame, card)).join('\n')}

유지하는 장은 관찰한 형식을 기준으로 조정하세요. 재구성하는 장은 이 배치 목록에서 하나를 고르거나 좌표를 그대로 옮기는 방식으로 만들지 마세요.
같은 정보 구조가 필요한 경우를 제외하고, 내용의 역할에 따라 카드의 시각적 리듬을 바꾸세요.

# 분량 — 이게 제일 자주 틀립니다

상자마다 들어가는 양이 정해져 있습니다.

    들어가는 폭(em) = ${density ? density.safe : 0.87} × (상자 폭 × 높이) ÷ 글자크기²
    한글 1.0em · 숫자와 영문 0.55em · 공백 0.35em

예: 901×216 상자에 30px 글자면 ${example}em, 한글로 약 ${Math.floor(example)}자입니다.

상자의 용량을 넘으면 문구를 줄이거나 상자를 키우세요. 이 상한은 모든 장에 적용됩니다.
${input.templateMode === 'strict'
  ? '레퍼런스 형식을 유지하는 설명문 상자는 70~90% 채움을 권장합니다. 제목·숫자·라벨은 의미에 맞게 짧게 써도 됩니다.'
  : '재구성하는 장에는 채움 하한이 없습니다. 제목·큰 숫자·인용문을 짧게 쓰거나 의도적인 여백을 둘 수 있습니다. 유지하는 장의 설명문만 원본의 밀도를 참고하세요.'}
분량을 채우기 위해 사실을 만들지 마세요. 구체적인 설명이 필요한 곳에는 제공된 내용 안에서 상황과 행동을 담으세요.

# 형식

briefId와 templateHash는 이번 브리프의 식별자입니다. 아래 값을 그대로 복사하고 수정하거나 이전 결과의 값을 쓰지 마세요.
카드는 정확히 ${input.cardCount}장, id는 1부터 ${input.cardCount}까지 순서대로 작성하세요.
아래 blocks는 필드 형식을 보여주는 예시입니다. 예시 좌표나 블록 구성을 그대로 따라 그리지 말고 이번 내용과 선택한 적용 방식에 맞게 설계하세요.
실제 좌표·블록 수는 이번 판형과 내용에 맞게, fontSize와 fontStyle은 위에 적힌 글자 조합에 맞게 바꾸세요. 예시의 1080·30 같은 수치가 레퍼런스보다 우선하지 않습니다.

{
  "schemaVersion": 1,
  "briefId": "${identity.briefId}",
  "templateHash": "${identity.templateHash}",
  "cards": [
    {
      "id": 1,
      "background": "paper",
      "blocks": [
        { "kind": "photo", "rect": {"x":0,"y":0,"width":1080,"height":700}, "brief": "어떤 사진이 필요한지" },
        { "kind": "panel", "rect": {"x":0,"y":0,"width":100,"height":100}, "color": "accent" },
        { "kind": "rule",  "rect": {"x":80,"y":800,"width":2,"height":120}, "color": "accent" },
        { "kind": "text",  "rect": {"x":80,"y":980,"width":901,"height":216},
          "text": "문구", "fontSize": 30, "fontStyle": "Regular", "color": "ink", "align": "left" }
      ]
    }
  ]
}

blocks는 **뒤에 오는 것이 위에 놓입니다.** 사진과 면을 먼저, 글자를 나중에 쓰세요.
color는 역할 이름(paper/ink/accent)만 씁니다. hex를 직접 쓰면 거부됩니다.

# 거부되는 것

· 위에 없는 색 이름이나 글자 크기 조합
· 카드 밖으로 나가는 블록 (사진은 재단 허용)
· 글자끼리 겹침 (글자가 사진이나 면 위에 오는 건 괜찮습니다)
· 상자를 넘치는 문구
· 읽히지 않는 대비 — 흰 종이에 흰 글자, 밝은 면에 밝은 글자

저장 전에 shared/layout.ts의 validateLayout(deck, extractTokens(manifest), input.templateMode)로 검사하고 error를 해결하세요.
이번 input.templateMode는 '${input.templateMode}'입니다. 모드를 생략하면 재구성할 장에도 유지 모드의 권장 사항이 적용됩니다.

JSON만 출력하세요.`;
}


export type Brief = BriefIdentity & {
  savedAt: string;
  input: GenerateInput;
  /** 에이전트에게 그대로 건네는 지시문. 사람이 읽어도 무엇을 시키는지 알 수 있다. */
  prompt: string;
  /** 레퍼런스 원본. 에이전트가 요약이 아니라 실제 수치를 볼 수 있어야 한다. */
  manifest: TemplateManifest;
};

/** 브리프를 만든다. 저장은 부르는 쪽이 한다. */
export function buildBrief(input: GenerateInput, manifest: TemplateManifest, savedAt: string, identity: BriefIdentity): Brief {
  return { ...identity, savedAt, input, prompt: buildPrompt(input, manifest, extractTokens(manifest), identity), manifest };
}
