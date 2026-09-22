import { designSystemOf } from './referenceSystem';

/**
 * 플러그인이 사용자의 Figma 카드뉴스를 읽어 만든 레퍼런스 명세.
 * 웹앱과 플러그인이 같은 파일을 읽어야 계약이 어긋나지 않는다.
 */

/** #RRGGBB. 투명도가 있으면 alpha를 따로 둔다. */
export type Color = { hex: string; alpha: number };

export type ShapeSpec = {
  nodePath: number[];
  name: string;
  kind: string;
  rect: { x: number; y: number; width: number; height: number };
  fill: Color | null;
  stroke: Color | null;
  cornerRadius: number | 'mixed';
  /** 도(°). 회전된 것을 안 돌린 것처럼 기록하면 가로선이 세로선이 된다. */
  rotation: number;
};

export type TextSlot = {
  /** clone()은 새 id를 만든다. 그래서 id가 아니라 루트부터의 자식 인덱스로 주소를 잡는다. */
  nodePath: number[];
  name: string;
  characters: string;
  rect: { x: number; y: number; width: number; height: number };
  fontSize: number | 'mixed';
  fontFamily: string | 'mixed';
  fontStyle: string | 'mixed';
  autoResize: string;
  /** 실측한 글자 예산. 원본 문구 길이와 상자 용량에서 나온다. */
  budget: { min: number; max: number };
  /** 서식이 섞여 있으면 텍스트를 통째로 바꿀 때 서식이 날아갈 수 있다. */
  mixedStyles: boolean;
  /** 글자색. 비슷한 디자인을 새로 만들 때 필요하다. */
  color: Color | null;
  /** 단위 없는 숫자는 읽을 수가 없다. 37이 37px인지 폰트 크기의 37%인지가 전혀 다르다. */
  letterSpacing: { value: number; unit: 'PIXELS' | 'PERCENT' } | 'mixed';
  lineHeight: { value: number; unit: 'PIXELS' | 'PERCENT' } | 'auto' | 'mixed';
};

export type ImageSlot = {
  nodePath: number[];
  name: string;
  rect: { x: number; y: number; width: number; height: number };
  scaleMode: string;
};

export type FrameSpec = {
  frameName: string;
  width: number;
  height: number;
  textSlots: TextSlot[];
  imageSlots: ImageSlot[];
  /** 프레임 배경. 새 카드를 만들 때 바탕이 된다. */
  background: Color | null;
  /** 글자·사진이 아닌 장식 도형. 배경 박스, 라인, 뱃지 같은 것들. */
  shapes: ShapeSpec[];
};

export type TemplateManifest = {
  schemaVersion: 1;
  readAt: string;
  fileName: string;
  pageName: string;
  frames: FrameSpec[];
  notes: string[];
  /** 전체에서 뽑아낸 디자인 언어. 비슷한 배치를 새로 만들 때 이걸 따른다. */
  system: DesignSystem;
};

export type DesignSystem = {
  /** 쓰인 횟수가 많은 순. 배경·글자·강조색이 여기서 나온다. */
  colors: { hex: string; uses: number }[];
  /** 폰트 크기 위계. 큰 것부터. */
  typeScale: { fontSize: number; fontFamily: string; fontStyle: string; uses: number }[];
  /** 왼쪽 여백처럼 반복되는 값. */
  margins: { value: number; uses: number }[];
  cardSize: { width: number; height: number };
};

export const MAX_MANIFEST_BYTES = 2 * 1024 * 1024;

export type ManifestSummary = {
  frames: number;
  textSlots: number;
  imageSlots: number;
  /** 칸마다 다른 예산을 한눈에 보기 위한 범위. */
  budget: { min: number; max: number };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** 공개 입력의 크기와 반복 횟수를 제한해 검증·미리보기 비용을 제한한다. */
const MAX_FRAMES = 100;
const MAX_NODES = 10_000;
const MAX_DIMENSION = 8192;
const MAX_COORDINATE = 100_000;
const MAX_TEXT = 20_000;

function finite(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function string(value: unknown, max = 500, allowEmpty = true): value is string {
  return typeof value === 'string' && value.length <= max && (allowEmpty || value.trim().length > 0);
}

function color(value: unknown): boolean {
  return value === null || (isRecord(value) && typeof value.hex === 'string' && /^#[0-9a-f]{6}$/i.test(value.hex)
    && finite(value.alpha, 0, 1));
}

function rect(value: unknown): value is TextSlot['rect'] {
  return isRecord(value) && finite(value.x, -MAX_COORDINATE, MAX_COORDINATE)
    && finite(value.y, -MAX_COORDINATE, MAX_COORDINATE)
    && finite(value.width, 0, MAX_COORDINATE) && finite(value.height, 0, MAX_COORDINATE);
}

function node(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && typeof value.name === 'string' && rect(value.rect)
    && Array.isArray(value.nodePath) && value.nodePath.length <= 100
    && value.nodePath.every((index: unknown) => finite(index, 0, MAX_COORDINATE) && Number.isInteger(index));
}

function spacing(value: unknown, line: boolean): boolean {
  if (value === 'mixed' || (line && value === 'auto')) return true;
  return isRecord(value) && (value.unit === 'PIXELS' || value.unit === 'PERCENT')
    && finite(value.value, line ? 0 : -10_000, 10_000);
}

function font(value: unknown): value is string {
  return string(value, 200, false) && ![...value].some((char) => char.charCodeAt(0) < 32);
}

function textSlot(value: unknown): boolean {
  if (!node(value) || !string(value.characters, MAX_TEXT) || !rect(value.rect)) return false;
  if (value.characters.length > 0 && (value.rect.width <= 0 || value.rect.height <= 0)) return false;
  return (value.fontSize === 'mixed' || finite(value.fontSize, 0.1, 2048))
    && font(value.fontFamily) && font(value.fontStyle)
    && typeof value.autoResize === 'string' && ['NONE', 'HEIGHT', 'WIDTH_AND_HEIGHT', 'TRUNCATE'].includes(value.autoResize)
    && isRecord(value.budget) && finite(value.budget.min, 0, MAX_TEXT) && Number.isInteger(value.budget.min)
    && finite(value.budget.max, value.budget.min, MAX_TEXT) && Number.isInteger(value.budget.max)
    && typeof value.mixedStyles === 'boolean' && color(value.color)
    && spacing(value.letterSpacing, false) && spacing(value.lineHeight, true);
}

function shape(value: unknown): boolean {
  return node(value) && string(value.kind, 100, false) && color(value.fill) && color(value.stroke)
    && (value.cornerRadius === 'mixed' || finite(value.cornerRadius, 0, MAX_COORDINATE))
    && finite(value.rotation, -360, 360);
}

function imageSlot(value: unknown): boolean {
  return node(value) && typeof value.scaleMode === 'string' && ['FILL', 'FIT', 'CROP', 'TILE'].includes(value.scaleMode);
}

function dimensions(value: unknown): boolean {
  return isRecord(value) && finite(value.width, 1, MAX_DIMENSION) && finite(value.height, 1, MAX_DIMENSION);
}

function designSystem(value: unknown): boolean {
  const uses = (entry: Record<string, unknown>) => finite(entry.uses, 1, MAX_NODES) && Number.isInteger(entry.uses);
  return isRecord(value) && dimensions(value.cardSize)
    && Array.isArray(value.colors) && value.colors.length <= MAX_NODES
    && value.colors.every((entry: unknown) => isRecord(entry) && typeof entry.hex === 'string'
      && /^#[0-9a-f]{6}$/i.test(entry.hex) && uses(entry))
    && Array.isArray(value.typeScale) && value.typeScale.length <= MAX_NODES
    && value.typeScale.every((entry: unknown) => isRecord(entry) && finite(entry.fontSize, 0.1, 2048)
      && font(entry.fontFamily) && font(entry.fontStyle) && uses(entry))
    && Array.isArray(value.margins) && value.margins.length <= MAX_NODES
    && value.margins.every((entry: unknown) => isRecord(entry)
      && finite(entry.value, -MAX_COORDINATE, MAX_COORDINATE) && uses(entry));
}

/** 수작업 자료의 작은 차이는 복구한다. 이름·경로는 식별자가 아니므로 중복을 허용한다. */
function recoverFrame(value: Record<string, unknown>, index: number, warnings: Set<string>): FrameSpec | null {
  const number = (raw: unknown) => typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
  const label = (raw: unknown, fallback: string) => typeof raw === 'string' ? raw : fallback;
  const list = (raw: unknown): unknown[] => Array.isArray(raw) ? raw : [];
  const width = number(value.width);
  const height = number(value.height);
  if (!dimensions({ width, height })) return null;

  function paint(raw: unknown): Color | null {
    if (raw === undefined || raw === null) return null;
    if (color(raw)) return raw as Color;
    const data = typeof raw === 'string' ? { hex: raw } : isRecord(raw) ? raw : {};
    let hex = typeof data.hex === 'string' ? data.hex.trim() : '';
    if (/^#[0-9a-f]{3}$/i.test(hex)) hex = '#' + [...hex.slice(1)].map((char) => char + char).join('');
    if (!/^#[0-9a-f]{6}$/i.test(hex)) {
      warnings.add('읽을 수 없는 색상 값은 제외했습니다. 필요한 색은 원본에서 확인해 주세요.');
      return null;
    }
    const alpha = number(data.alpha);
    warnings.add('색상 표기와 누락된 투명도를 보완했습니다.');
    return { ...data, hex, alpha: finite(alpha, 0, 1) ? alpha : 1 };
  }

  function layer(raw: unknown): Record<string, unknown> | null {
    if (!isRecord(raw) || !isRecord(raw.rect)) return null;
    const box = { ...raw.rect, x: number(raw.rect.x), y: number(raw.rect.y), width: number(raw.rect.width), height: number(raw.rect.height) };
    if (!rect(box)) return null;
    return { ...raw, rect: box, name: label(raw.name, '레이어'),
      nodePath: Array.isArray(raw.nodePath) && raw.nodePath.length <= 100
        && raw.nodePath.every((item: unknown) => finite(item, 0, MAX_COORDINATE) && Number.isInteger(item)) ? raw.nodePath : [] };
  }

  function layers<T>(raw: unknown, convert: (item: Record<string, unknown>) => T | null): T[] {
    const result: T[] = [];
    for (const item of list(raw)) {
      const base = layer(item);
      const next = base ? convert(base) : null;
      if (next) result.push(next);
      else warnings.add(`${index + 1}번 카드: 읽을 수 없는 레이어는 제외하고 나머지를 가져왔습니다.`);
    }
    return result;
  }

  const textSlots = layers<TextSlot>(value.textSlots, (slot) => {
    const characters = typeof slot.characters === 'string' ? slot.characters : '';
    if (characters.length > MAX_TEXT) return null;
    const fontSize = number(slot.fontSize);
    const size = finite(fontSize, 0.1, 2048) ? fontSize : 'mixed';
    const family = font(slot.fontFamily) ? slot.fontFamily : 'mixed';
    const style = font(slot.fontStyle) ? slot.fontStyle : 'mixed';
    if (size === 'mixed' || family === 'mixed' || style === 'mixed') {
      warnings.add('확인되지 않은 글꼴은 혼합 서식으로 남겼습니다. 글꼴 규칙을 추출하거나 다시 그릴 때 일부 정보가 빠질 수 있습니다.');
    }
    const count = [...characters].length;
    const validBudget = isRecord(slot.budget) && finite(slot.budget.min, 0, MAX_TEXT) && Number.isInteger(slot.budget.min)
      && finite(slot.budget.max, slot.budget.min, MAX_TEXT) && Number.isInteger(slot.budget.max);
    if (!validBudget) warnings.add('글자 예산이 없는 칸은 원문 글자 수로 참고 분량을 보완했습니다.');
    const next = { ...slot, characters, fontSize: size, fontFamily: family, fontStyle: style,
      autoResize: typeof slot.autoResize === 'string' && ['NONE', 'HEIGHT', 'WIDTH_AND_HEIGHT', 'TRUNCATE'].includes(slot.autoResize) ? slot.autoResize : 'NONE',
      budget: validBudget ? slot.budget : { min: count, max: count },
      mixedStyles: typeof slot.mixedStyles === 'boolean' ? slot.mixedStyles : size === 'mixed' || family === 'mixed' || style === 'mixed',
      color: paint(slot.color),
      letterSpacing: spacing(slot.letterSpacing, false) ? slot.letterSpacing : { value: 0, unit: 'PIXELS' },
      lineHeight: spacing(slot.lineHeight, true) ? slot.lineHeight : 'auto',
    };
    return textSlot(next) ? next as TextSlot : null;
  });
  const shapes = layers<ShapeSpec>(value.shapes, (item) => {
    const rotation = number(item.rotation);
    const radius = number(item.cornerRadius);
    return { ...item, kind: typeof item.kind === 'string' ? item.kind : 'RECTANGLE',
      fill: paint(item.fill), stroke: paint(item.stroke),
      cornerRadius: item.cornerRadius === 'mixed' ? 'mixed' : finite(radius, 0, MAX_COORDINATE) ? radius : 0,
      rotation: finite(rotation, -360, 360) ? rotation : 0,
    } as ShapeSpec;
  });
  const imageSlots = layers<ImageSlot>(value.imageSlots, (item) => ({ ...item,
    scaleMode: typeof item.scaleMode === 'string' && ['FILL', 'FIT', 'CROP', 'TILE'].includes(item.scaleMode) ? item.scaleMode : 'FILL',
  } as ImageSlot));
  return { ...value, frameName: label(value.frameName, `카드 ${index + 1}`), width: width as number, height: height as number,
    background: paint(value.background), textSlots, shapes, imageSlots };
}

function tooLarge(text: string): boolean {
  if (text.length > MAX_MANIFEST_BYTES) return true;
  // Figma 플러그인 런타임에도 동작하도록 TextEncoder 없이 UTF-8 바이트를 센다.
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
    if (bytes > MAX_MANIFEST_BYTES) return true;
  }
  return false;
}

/** 필수 판형만 확인하고 보완 가능한 누락·표기는 정리해서 가져온다. */
export function parseManifest(text: string): { ok: true; manifest: TemplateManifest } | { ok: false; reason: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: '내용이 비어 있습니다.' };
  if (tooLarge(trimmed)) return { ok: false, reason: '명세가 너무 큽니다.' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return { ok: false, reason: 'JSON을 읽지 못했습니다. 플러그인의 "결과 복사"로 받은 내용을 그대로 붙여넣어 주세요.' };
  }
  if (!isRecord(parsed)) return { ok: false, reason: '형식이 올바르지 않습니다.' };
  if (parsed.schemaVersion !== undefined && parsed.schemaVersion !== 1 && parsed.schemaVersion !== '1') {
    return { ok: false, reason: '지원하지 않는 명세 버전입니다. 플러그인에서 다시 읽어 주세요.' };
  }
  if (!Array.isArray(parsed.frames) || parsed.frames.length === 0 || parsed.frames.length > MAX_FRAMES) {
    return { ok: false, reason: `프레임은 1~${MAX_FRAMES}개여야 합니다. Figma에서 카드 프레임을 선택하고 다시 읽어 주세요.` };
  }
  const warnings = new Set<string>();
  const frames: FrameSpec[] = [];
  let nodes = 0;
  for (const [index, frame] of parsed.frames.entries()) {
    if (!isRecord(frame)) return { ok: false, reason: `${index + 1}번 카드의 구조를 읽지 못했습니다.` };
    nodes += [frame.textSlots, frame.shapes, frame.imageSlots].reduce<number>((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
    if (nodes > MAX_NODES) return { ok: false, reason: '명세의 레이어가 너무 많습니다. 읽을 프레임을 줄여 주세요.' };
    // 이미 정상인 프레임은 그대로 둔다. 기존 작업의 해시·배열 순서·추가 필드를 보존한다.
    if (typeof frame.frameName === 'string' && dimensions(frame) && color(frame.background)
      && Array.isArray(frame.textSlots) && Array.isArray(frame.shapes) && Array.isArray(frame.imageSlots)
      && frame.textSlots.every(textSlot) && frame.shapes.every(shape) && frame.imageSlots.every(imageSlot)) {
      frames.push(frame as unknown as FrameSpec);
    } else {
      const recovered = recoverFrame(frame, index, warnings);
      if (!recovered) return { ok: false, reason: `${index + 1}번 카드의 폭·높이를 확인해 주세요. 1~${MAX_DIMENSION}px의 숫자가 필요합니다.` };
      warnings.add('누락된 부가 정보와 숫자 표기를 보완해 가져왔습니다. 이름 중복과 원래 카드 순서는 그대로 유지합니다.');
      frames.push(recovered);
    }
  }
  const system = designSystem(parsed.system) ? parsed.system as DesignSystem : designSystemOf(frames);
  if (!designSystem(parsed.system)) warnings.add('빠진 디자인 요약은 카드에서 읽은 색·글꼴·여백으로 다시 정리했습니다.');
  const notes = Array.isArray(parsed.notes) ? parsed.notes.filter((note): note is string => typeof note === 'string') : [];
  const manifest: TemplateManifest = {
    ...parsed, schemaVersion: 1,
    readAt: typeof parsed.readAt === 'string' ? parsed.readAt : '',
    fileName: typeof parsed.fileName === 'string' ? parsed.fileName : '가져온 레퍼런스',
    pageName: typeof parsed.pageName === 'string' ? parsed.pageName : '',
    frames, system, notes: [...notes, ...[...warnings].filter((note) => !notes.includes(note))],
  };
  if (tooLarge(JSON.stringify(manifest))) {
    return { ok: false, reason: '부가 정보를 보완한 명세가 2MiB 용량 제한을 넘습니다. 필요한 카드만 나누어 가져와 주세요.' };
  }
  return { ok: true, manifest };
}

export function summarize(manifest: TemplateManifest): ManifestSummary {
  let textSlots = 0;
  let imageSlots = 0;
  let min = Infinity;
  let max = 0;
  for (const frame of manifest.frames) {
    textSlots += frame.textSlots.length;
    imageSlots += frame.imageSlots.length;
    for (const slot of frame.textSlots) {
      if (slot.budget.max > 0) {
        min = Math.min(min, slot.budget.max);
        max = Math.max(max, slot.budget.max);
      }
    }
  }
  return { frames: manifest.frames.length, textSlots, imageSlots, budget: { min: min === Infinity ? 0 : min, max } };
}
