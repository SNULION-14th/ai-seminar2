import { contrast, emWidth, linesFit, linesNeeded, roomEm, type ColorRole, type DesignTokens } from './designTokens';
import { isRecord, type TemplateMode } from './contracts';
import { isReferenceKeptCard } from './referenceModes';

/**
 * 에이전트가 내놓는 **배치**다.
 *
 * 나누는 선이 분명하다.
 *   고정 — 색·글자 크기·판형·서명 요소. 레퍼런스에서 재어 뽑았고 여기서 바꿀 수 없다.
 *   변주 — 무엇을 어디에 얼마만 한 크기로 놓을지. 전부 자유다.
 *
 * 그래서 색을 hex로 쓰지 않고 **역할**로 쓴다. 'accent'라고만 적으면 그 브랜드의 강조색이
 * 들어간다. 에이전트가 색을 지어낼 방법이 없으므로 결과는 늘 같은 시리즈로 보인다.
 *
 * 여기 있는 검사는 전부 순수 함수다. Figma 없이 Node에서 돌고, 캔버스에 닿기 전에 걸러낸다.
 * 기계가 잡을 수 있는 건 기계가 잡고(겹침·넘침·화면 밖·대비), 취향은 PNG를 눈으로 보고 고친다.
 */

export const LAYOUT_SCHEMA_VERSION = 1;

export type Rect = { x: number; y: number; width: number; height: number };
export type Align = 'left' | 'center' | 'right';

export type TextBlock = {
  kind: 'text';
  text: string;
  rect: Rect;
  fontSize: number;
  fontStyle: string;
  color: ColorRole;
  align: Align;
  /**
   * 줄높이(%). 비우면 글꼴 기본값(Pretendard는 약 119%)을 쓴다.
   *
   * 레퍼런스의 "학교생활" 칸이 100%로 지정돼 있어 100px 글자가 100px 상자에 딱 맞았다.
   * 이 칸이 없으면 그런 배치를 재현할 수 없고, 상자보다 글자가 커져 넘친다.
   */
  lineHeight?: number;
};

/** 실제 사진이 들어갈 자리. brief는 어떤 사진이 필요한지의 설명이다. */
export type PhotoBlock = { kind: 'photo'; rect: Rect; brief: string };

/** 서명 요소인 가는 막대. */
export type RuleBlock = { kind: 'rule'; rect: Rect; color: ColorRole };

/**
 * 글자를 얹기 위한 색 면. 레퍼런스의 파란 박스 같은 것.
 *
 * opacity는 사진 위에 까는 막에 쓴다. 밝은 사진에 흰 글자를 그냥 얹으면 묻히는데,
 * 레퍼런스의 마무리 카드가 정확히 이 방법(검정 30%)으로 해결하고 있었다.
 */
export type PanelBlock = { kind: 'panel'; rect: Rect; color: ColorRole; opacity?: number };

export type Block = TextBlock | PhotoBlock | RuleBlock | PanelBlock;

export type LayoutCard = {
  id: number;
  background: ColorRole;
  /** 뒤에 있는 것이 위에 놓인다. 사진을 먼저, 글자를 나중에. */
  blocks: Block[];
};

export type LayoutDeck = {
  schemaVersion: typeof LAYOUT_SCHEMA_VERSION;
  cards: LayoutCard[];
};

/** 그리면 안 되는 것은 error, 그려도 되지만 봐야 하는 것은 warning. */
export type Severity = 'error' | 'warning';

export type Problem = {
  severity: Severity;
  code: string;
  cardId: number;
  blockIndex: number | null;
  message: string;
};

export type Check = { ok: boolean; problems: Problem[] };

/** 본문이 읽히려면 이만큼. WCAG AA 기준이다. */
const CONTRAST_BODY = 4.5;
/** 큰 글자는 조금 덜해도 읽힌다. */
const CONTRAST_LARGE = 3;
const LARGE_TEXT_SIZE = 32;
/** 왼쪽 여백이 레퍼런스 값에서 이만큼 벗어나도 같은 줄로 본다. */
const MARGIN_TOLERANCE = 4;
/** 상자의 이만큼도 못 채우면 휑하다. 예전에 58%가 나와 "카드가 비었다"는 말을 들었다. */
const MIN_FILL = 0.55;

const MAX_CARDS = 10;
const MAX_BLOCKS = 200;
const MAX_TEXT_LENGTH = 10_000;
const MAX_CONTENT_LENGTH = 100_000;
const MAX_COORDINATE = 100_000;
const COLOR_ROLES = new Set(['paper', 'ink', 'accent', 'photo', 'other']);

function finite(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function isRect(value: unknown): value is Rect {
  return isRecord(value) && finite(value.x, -MAX_COORDINATE, MAX_COORDINATE)
    && finite(value.y, -MAX_COORDINATE, MAX_COORDINATE)
    && finite(value.width, 0.01, MAX_COORDINATE) && finite(value.height, 0.01, MAX_COORDINATE);
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function covers(outer: Rect, inner: Rect): boolean {
  return outer.x <= inner.x && outer.y <= inner.y
    && outer.x + outer.width >= inner.x + inner.width
    && outer.y + outer.height >= inner.y + inner.height;
}

function contains(rect: Rect, point: { x: number; y: number }): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width
    && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function charLength(text: string): number {
  return [...text].length;
}

function blend(foreground: string, background: string, opacity: number): string {
  let hex = '#';
  for (let offset = 1; offset < 7; offset += 2) {
    const fg = parseInt(foreground.slice(offset, offset + 2), 16);
    const bg = parseInt(background.slice(offset, offset + 2), 16);
    hex += Math.round(fg * opacity + bg * (1 - opacity)).toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * 글자 영역의 모서리와 중심에서 아래 레이어를 실제 순서대로 합성한다.
 * 사진의 픽셀은 알 수 없으므로 반투명 면으로 덮어도 '대비 확인 불가'로 남긴다.
 * 일부만 덮는 배경은 표본 사이의 색 변화가 있을 수 있어 별도로 경고한다.
 */
function backgrounds(card: LayoutCard, index: number, tokens: DesignTokens): { colors: string[]; photo: boolean; partial: boolean } {
  const rect = card.blocks[index].rect;
  const inset = Math.min(0.01, rect.width / 4, rect.height / 4);
  const xs = [rect.x + inset, rect.x + rect.width / 2, rect.x + rect.width - inset];
  const ys = [rect.y + inset, rect.y + rect.height / 2, rect.y + rect.height - inset];
  const points = xs.flatMap((x) => ys.map((y) => ({ x, y })));
  const colors = new Set<string>();
  let photo = false;
  let partial = false;
  for (const point of points) {
    let color = resolve(tokens, card.background);
    for (let i = 0; i < index; i += 1) {
      const block = card.blocks[i];
      if (block.kind === 'text' || !overlaps(block.rect, rect)) continue;
      if (!covers(block.rect, rect)) partial = true;
      else if (block.kind === 'photo' || block.kind === 'rule' || (block.opacity ?? 1) === 1) partial = false;
      if (!contains(block.rect, point)) continue;
      if (block.kind === 'photo') {
        color = null;
      } else {
        const fg = resolve(tokens, block.color);
        if (!fg) continue;
        const opacity = block.kind === 'panel' ? block.opacity ?? 1 : 1;
        color = opacity === 1 ? fg : color ? blend(fg, color, opacity) : null;
      }
    }
    if (color) colors.add(color);
    else photo = true;
  }
  return { colors: [...colors], photo, partial };
}

function resolve(tokens: DesignTokens, role: ColorRole): string | null {
  return tokens.palette.find((entry) => entry.role === role)?.hex ?? null;
}

/** 구조가 맞는지만 본다. 디자인 판단은 아래 validateLayout이 한다. */
export function parseLayout(value: unknown): { ok: true; deck: LayoutDeck } | { ok: false; reason: string } {
  if (!isRecord(value)) return { ok: false, reason: '객체가 아닙니다.' };
  const raw = value;
  if (raw.schemaVersion !== LAYOUT_SCHEMA_VERSION) {
    return { ok: false, reason: `schemaVersion이 ${LAYOUT_SCHEMA_VERSION}이어야 합니다.` };
  }
  if (!Array.isArray(raw.cards) || raw.cards.length === 0 || raw.cards.length > MAX_CARDS) {
    return { ok: false, reason: `cards는 1~${MAX_CARDS}장이어야 합니다.` };
  }

  const kinds = new Set(['text', 'photo', 'rule', 'panel']);
  const ids = new Set<number>();
  let contentLength = 0;
  for (const card of raw.cards) {
    if (!isRecord(card)) return { ok: false, reason: '카드가 객체가 아닙니다.' };
    if (!finite(card.id, 1, MAX_CARDS) || !Number.isInteger(card.id) || ids.has(card.id)) {
      return { ok: false, reason: '카드 id는 중복되지 않는 1~10 사이 정수여야 합니다.' };
    }
    ids.add(card.id);
    if (typeof card.background !== 'string' || !COLOR_ROLES.has(card.background)) {
      return { ok: false, reason: `${card.id}번 카드의 background 색 역할이 올바르지 않습니다.` };
    }
    if (!Array.isArray(card.blocks) || card.blocks.length === 0 || card.blocks.length > MAX_BLOCKS) {
      return { ok: false, reason: `${card.id}번 카드의 blocks는 1~${MAX_BLOCKS}개여야 합니다.` };
    }

    for (const block of card.blocks) {
      if (!isRecord(block)) return { ok: false, reason: `${card.id}번 카드의 블록이 객체가 아닙니다.` };
      if (typeof block.kind !== 'string' || !kinds.has(block.kind)) {
        return { ok: false, reason: `${card.id}번 카드에 모르는 블록 종류가 있습니다: ${typeof block.kind === 'string' ? block.kind : '(누락)'}` };
      }
      if (!isRect(block.rect)) return { ok: false, reason: `${card.id}번 카드의 ${block.kind} 블록 좌표·크기가 올바르지 않습니다.` };
      if (block.kind !== 'photo' && (typeof block.color !== 'string' || !COLOR_ROLES.has(block.color))) {
        return { ok: false, reason: `${card.id}번 카드의 ${block.kind} 블록 색 역할이 올바르지 않습니다.` };
      }
      if (block.kind === 'text') {
        if (typeof block.text !== 'string' || !block.text.trim() || block.text.length > MAX_TEXT_LENGTH) {
          return { ok: false, reason: `${card.id}번 카드의 글자 블록 문구는 1~${MAX_TEXT_LENGTH}자여야 합니다.` };
        }
        contentLength += block.text.length;
        if (!finite(block.fontSize, 0.1, 2048)) return { ok: false, reason: `${card.id}번 카드의 fontSize가 올바르지 않습니다.` };
        if (typeof block.fontStyle !== 'string' || !block.fontStyle.trim() || block.fontStyle.length > 200 || [...block.fontStyle].some((char) => char.charCodeAt(0) < 32)) {
          return { ok: false, reason: `${card.id}번 카드의 fontStyle이 올바르지 않습니다.` };
        }
        if (typeof block.align !== 'string' || !['left', 'center', 'right'].includes(block.align)) {
          return { ok: false, reason: `${card.id}번 카드의 글자 정렬은 left·center·right 중 하나여야 합니다.` };
        }
        if (block.lineHeight !== undefined && !finite(block.lineHeight, 50, 300)) {
          return { ok: false, reason: `${card.id}번 카드의 줄높이는 50~300 사이여야 합니다.` };
        }
      }
      if (block.kind === 'panel' && block.opacity !== undefined
        && (!finite(block.opacity, 0, 1) || block.opacity === 0)) {
        return { ok: false, reason: `${card.id}번 카드의 면 opacity는 0보다 크고 1 이하여야 합니다.` };
      }
      if (block.kind === 'photo') {
        if (typeof block.brief !== 'string' || block.brief.length > MAX_TEXT_LENGTH) {
          return { ok: false, reason: `${card.id}번 카드의 사진 brief는 ${MAX_TEXT_LENGTH}자 이하 문자열이어야 합니다.` };
        }
        contentLength += block.brief.length;
      }
      if (contentLength > MAX_CONTENT_LENGTH) return { ok: false, reason: '전체 카드 문구와 사진 설명이 너무 깁니다.' };
    }
  }
  return { ok: true, deck: raw as unknown as LayoutDeck };
}

/**
 * 레퍼런스에서 뽑은 규칙을 지켰는지, 그리고 읽을 수 있는지 본다.
 *
 * 취향은 한 줄도 없다. 전부 셀 수 있는 것들이다 — 밖으로 나갔나, 겹쳤나, 넘쳤나, 읽히나,
 * 그리고 레퍼런스에 없던 색이나 글자 크기를 지어냈나.
 */
export function validateLayout(deck: LayoutDeck, tokens: DesignTokens, mode: TemplateMode = 'strict'): Check {
  const problems: Problem[] = [];
  const { width: cardW, height: cardH } = tokens.cardSize;
  const add = (severity: Severity, code: string, cardId: number, blockIndex: number | null, message: string) =>
    problems.push({ severity, code, cardId, blockIndex, message });

  const fonts = new Set(tokens.typeScale.map((entry) => `${entry.fontSize}|${entry.fontStyle}`));
  const marginValues = tokens.margins.values;

  let anySignature = false;

  for (const [cardIndex, card] of deck.cards.entries()) {
    const keepReference = isReferenceKeptCard(mode, cardIndex, deck.cards.length);
    if (!resolve(tokens, card.background)) {
      add('error', 'COLOR', card.id, null, `배경색 역할 '${card.background}'이 레퍼런스에 없습니다.`);
    }

    const textRects: { index: number; rect: Rect }[] = [];

    card.blocks.forEach((block, index) => {
      const { rect } = block;

      // 화면 밖으로 나가면 잘린다. 사진은 일부러 넘겨 재단하기도 하므로 사진만 봐준다.
      if (block.kind !== 'photo') {
        if (rect.x < 0 || rect.y < 0 || rect.x + rect.width > cardW || rect.y + rect.height > cardH) {
          add('error', 'BOUNDS', card.id, index, `${block.kind} 블록이 카드 밖으로 나갑니다(${rect.x},${rect.y} ${rect.width}×${rect.height}).`);
        }
      }
      if (rect.width <= 0 || rect.height <= 0) {
        add('error', 'BOUNDS', card.id, index, `${block.kind} 블록의 크기가 0 이하입니다.`);
      }

      if (block.kind === 'rule') anySignature = true;

      if (block.kind !== 'photo' && !resolve(tokens, block.color)) {
        add('error', 'COLOR', card.id, index, `색 역할 '${block.color}'이 레퍼런스에 없습니다.`);
      }

      // 왼쪽 가장자리에 붙는 **글자만** 레퍼런스의 여백 줄을 따라야 한다.
      // 선이나 면은 다른 요소에 붙여 놓는 것이라 제 자리가 따로 없다. 실제로 번호 밑줄의
      // x(번호 x+10)마다 경고가 떴는데, 그건 레퍼런스가 그렇게 그린 자리였다.
      if (keepReference && block.kind === 'text' && marginValues.length > 0 && rect.x > 0 && rect.x <= tokens.margins.max + MARGIN_TOLERANCE) {
        const onGrid = marginValues.some((value) => Math.abs(value - rect.x) <= MARGIN_TOLERANCE);
        if (!onGrid) {
          add('warning', 'MARGIN', card.id, index, `왼쪽 여백 ${rect.x}px가 레퍼런스의 ${marginValues.join('·')}px와 어긋납니다.`);
        }
      }

      if (block.kind === 'photo') {
        if (keepReference && tokens.photoAreaRatio) {
          const ratio = (rect.width * rect.height) / (cardW * cardH);
          if (ratio < tokens.photoAreaRatio.min * 0.5) {
            add('warning', 'PHOTO_AREA', card.id, index, `사진이 레퍼런스보다 많이 작습니다(${Math.round(ratio * 100)}%).`);
          }
        }
        return;
      }

      if (block.kind !== 'text') return;

      if (!fonts.has(`${block.fontSize}|${block.fontStyle}`)) {
        add('error', 'FONT', card.id, index, `${block.fontSize}px ${block.fontStyle}은 레퍼런스에 없는 조합입니다.`);
      }

      if (block.text.trim().length === 0) {
        add('error', 'EMPTY', card.id, index, '빈 글자 블록입니다.');
      }

      // 넘침. 후한 쪽이 아니라 보수적인 밀도로 본다. 넘치는 걸 통과시키면 잘려 나간다.
      if (tokens.density) {
        const room = roomEm(tokens.density, rect.width, rect.height, block.fontSize);
        const written = emWidth(block.text);
        // 사람에게는 em이 아니라 몇 %를 채웠는지가 읽힌다.
        const fill = room > 0 ? Math.round((written / room) * 100) : 0;
        if (room > 0 && written > room) {
          add('error', 'OVERFLOW', card.id, index, `글자가 상자를 넘칩니다(${fill}%). ${charLength(block.text)}자를 줄이거나 상자를 키우세요.`);
        } else if (keepReference && room > 0 && written < room * MIN_FILL) {
          add('warning', 'SPARSE', card.id, index, `상자를 ${fill}%만 채웁니다. 휑해 보입니다.`);
        }
      }

      // 넓이로는 들어가도 줄이 모자라면 아래가 잘린다. 한 줄짜리 상자에 두 줄 제목을
      // 넣는 경우가 그렇다. 넓이 계산만으로는 통과해 버린다.
      if (tokens.metrics) {
        // 줄높이를 지정했으면 그 값으로 잰다. 기본값으로 재면 딱 맞춘 상자가 넘친다고 나온다.
        const metrics = block.lineHeight
          ? { ...tokens.metrics, lineRatio: block.lineHeight / 100 }
          : tokens.metrics;
        const need = linesNeeded(metrics, block.text, rect.width, block.fontSize);
        const have = linesFit(metrics, rect.height, block.fontSize);
        if (need > have) {
          add('error', 'LINES', card.id, index, `${need}줄이 필요한데 ${have}줄만 들어갑니다. 상자를 높이거나 문구를 줄이세요.`);
        }
      }

      // 반투명 색 면은 아래 바탕과 합성하고, 사진은 실제 픽셀을 보기 전까지 확정하지 않는다.
      const under = backgrounds(card, index, tokens);
      const fg = resolve(tokens, block.color);
      if (fg) {
        const needed = block.fontSize >= LARGE_TEXT_SIZE ? CONTRAST_LARGE : CONTRAST_BODY;
        const ratios = under.colors.map((bg) => ({ bg, ratio: contrast(bg, fg) }));
        const worst = ratios.sort((a, b) => a.ratio - b.ratio)[0];
        if (worst && worst.ratio < needed) {
          add('error', 'CONTRAST', card.id, index, `${worst.bg} 위의 ${fg}는 대비 ${worst.ratio}로 읽히지 않습니다(${needed} 이상 필요).`);
        }
        if (under.photo) {
          add('warning', 'SCRIM', card.id, index, '사진 위 글자입니다. 반투명 면이 있어도 사진 밝기에 따라 대비가 달라지므로 실제 사진으로 확인해 주세요.');
        }
        if (under.partial) {
          add('warning', 'BACKGROUND', card.id, index, '글자 영역 안에서 배경이 바뀝니다. 모든 글자가 읽히는지 확인해 주세요.');
        }
      }

      // 뒤에 추가한 면이나 사진이 글자를 덮으면 z-order가 잘못된 결과일 수 있다.
      let occluded = false;
      let hidden = false;
      for (const later of card.blocks.slice(index + 1)) {
        // 가는 rule은 번호 밑줄 등 의도적으로 글자 상자의 여백에 겹칠 수 있다.
        if ((later.kind !== 'panel' && later.kind !== 'photo') || !overlaps(later.rect, rect)) continue;
        occluded = true;
        const opaque = later.kind !== 'panel' || (later.opacity ?? 1) === 1;
        if (opaque && covers(later.rect, rect)) {
          hidden = true;
          break;
        }
      }
      if (occluded) {
        add(hidden ? 'error' : 'warning', 'OCCLUDED', card.id, index,
          hidden ? '뒤에 놓인 면·사진이 글자 블록 전체를 가립니다. 블록 순서를 바꿔 주세요.'
            : '뒤에 놓인 면·사진이 글자 영역과 겹칩니다. 가림과 대비를 확인해 주세요.');
      }

      textRects.push({ index, rect });
    });

    // 글자끼리 겹치면 읽을 수가 없다. 글자가 사진이나 색 면 위에 오는 건 의도된 것이다.
    for (let a = 0; a < textRects.length; a += 1) {
      for (let b = a + 1; b < textRects.length; b += 1) {
        if (overlaps(textRects[a].rect, textRects[b].rect)) {
          add('error', 'OVERLAP', card.id, textRects[b].index, `글자 블록이 ${textRects[a].index}번 블록과 겹칩니다.`);
        }
      }
    }
  }

  // 서명 요소가 하나도 없으면 같은 시리즈로 안 보인다.
  if (mode !== 'free' && tokens.signatures.length > 0 && !anySignature) {
    add('warning', 'SIGNATURE', deck.cards[0]?.id ?? 0, null, '레퍼런스의 반복 요소가 한 장에도 없습니다. 시리즈로 보이지 않습니다.');
  }
  if (!tokens.density) {
    add('warning', 'NO_DENSITY', deck.cards[0]?.id ?? 0, null, '레퍼런스에서 글자 밀도를 얻지 못해 넘침을 확인하지 못했습니다.');
  }

  return { ok: problems.every((problem) => problem.severity !== 'error'), problems };
}
