import type { FrameSpec, ShapeSpec, TemplateManifest } from './templateManifest';

/**
 * 레퍼런스에서 **고정 규칙**을 뽑는다.
 *
 * 카드뉴스는 "같은 형식을 따라간다고 느껴지되 조금은 달라야" 한다. 그 둘을 가르는 선이 여기다.
 * 여기서 뽑힌 값(색·폰트·여백·서명 요소)은 에이전트가 바꿀 수 없고, 배치만 매번 달라진다.
 *
 * 규칙을 **레퍼런스에서 재어 뽑는다는 점이 핵심**이다. 개발자가 정한 값이면 그건 개발자 취향이
 * 규칙으로 굳은 것이고, 예전에 "디자인이 이상하다"는 결과가 정확히 그렇게 나왔다.
 * 출처가 사용자의 지난 디자인이면 그 위험이 없다.
 *
 * 판단은 전부 산술이다. 어울린다/촌스럽다 같은 취향은 한 줄도 넣지 않는다.
 */

export type ColorRole = 'paper' | 'ink' | 'accent' | 'photo' | 'other';

export type PaletteEntry = {
  hex: string;
  uses: number;
  role: ColorRole;
};

/** display는 표지급, heading은 소제목급, body는 읽는 글이다. 크기 비율로만 가른다. */
export type TypeRole = 'display' | 'heading' | 'body';

export type TypeEntry = {
  fontSize: number;
  fontFamily: string;
  fontStyle: string;
  uses: number;
  role: TypeRole;
};

/** 여러 프레임에 반복해 나타나는 가는 막대. 시리즈를 알아보게 하는 표식이다. */
export type Signature = {
  fill: string;
  orientation: 'vertical' | 'horizontal';
  thickness: number;
  /** 길이는 카드마다 조금씩 다르다. 범위로 둔다. */
  length: { min: number; max: number };
  frames: number;
};

export type DesignTokens = {
  cardSize: { width: number; height: number };
  palette: PaletteEntry[];
  typeScale: TypeEntry[];
  /** 0(전폭)은 여백이 아니므로 뺀다. 남은 값의 범위가 실제 여백대다. */
  margins: { min: number; max: number; values: number[] };
  /** 사진 자리를 나타내는 회색. 실제 사진 대신 이 색 사각형을 놓는 디자인이 흔하다. */
  photoColor: string | null;
  /** 사진이 차지하던 면적 비율. 0.32면 카드의 32%다. */
  photoAreaRatio: { min: number; max: number } | null;
  signatures: Signature[];
  /** 글자 밀도. 이게 있어야 "이 상자에 이 문구가 들어가는가"를 Figma 없이 판단할 수 있다. */
  density: Density | null;
  /** 글자 한 개의 실제 폭과 줄 높이. 넓이만으로는 "줄이 모자라 잘리는" 경우를 못 잡는다. */
  metrics: Metrics | null;
  notes: string[];
};

/**
 * 폭(em) ≈ density × (폭 × 높이) / 글자크기².
 *
 * 글자 수가 아니라 **em 폭**으로 센다. 한글은 정사각이지만 숫자와 라틴은 절반쯤이라,
 * 글자 수로 세면 "01"이 137px 상자에 안 들어간다는 답이 나온다(실제로 그렇게 틀렸다).
 * em으로 바꾸니 퍼짐이 ±7.7%에서 ±5.0%로 줄었다. 데이터에 더 맞는 모델이라는 뜻이다.
 *
 * 상수는 지어내지 않고 **레퍼런스의 실측 예산에서 역산**한다. 폰트와 언어가 바뀌면 따라 바뀐다.
 */
export type Density = {
  /** 평균. "너무 휑한가"를 볼 때 쓴다. */
  mean: number;
  /** 최솟값. "넘치는가"를 볼 때는 이걸 쓴다. 후하게 잡으면 넘치는 걸 통과시킨다. */
  safe: number;
  samples: number;
  /** 평균에서 가장 멀리 떨어진 표본까지의 거리. 이 예측의 오차 한계다. */
  spread: number;
};

/** 가는 막대로 볼 두께의 상한. 이보다 굵으면 장식이 아니라 면이다. */
const RULE_MAX_THICKNESS = 10;
/** 사진 자리로 볼 최소 면적 비율. 이보다 작으면 아이콘이나 뱃지다. */
const PHOTO_MIN_AREA = 0.08;
/**
 * 여백으로 볼 x의 상한(카드 폭 대비).
 *
 * 이게 없으면 카드 한가운데 있는 요소의 x까지 "여백"으로 모인다. 실제로 485가 여백 목록에
 * 들어가 검사 범위가 카드 절반까지 넓어졌고, 두 번째 단에 놓인 멀쩡한 글자마다 경고가 떴다.
 * 왼쪽 가장자리에 붙은 것만 여백이다.
 */
const MARGIN_ZONE = 0.15;

/**
 * sRGB 값은 화면에 보이는 밝기에 비례하지 않는다. 감마가 씌워져 있어서, 그대로 계산하면
 * 중간 톤이 실제보다 밝게 나온다. 이 변환을 빼먹었더니 #0055ff의 대비비가 2.91로 나와
 * 브랜드 강조색이 "읽을 수 없는 색"으로 잘못 걸렸다(실제로는 5.61로 본문에도 쓸 수 있다).
 */
function channel(byte: number): number {
  const value = byte / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = parseInt(hex.slice(1), 16);
  // 사람 눈은 녹색에 민감하다. 단순 평균은 노랑과 파랑을 같은 밝기로 본다.
  return (
    0.2126 * channel((value >> 16) & 255) +
    0.7152 * channel((value >> 8) & 255) +
    0.0722 * channel(value & 255)
  );
}

function countBy<T>(items: T[], key: (item: T) => string | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

function topOf(counts: Map<string, number>): string | null {
  let best: string | null = null;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

function area(shape: ShapeSpec): number {
  return shape.rect.width * shape.rect.height;
}

/**
 * 사진 자리 색을 찾는다.
 *
 * 실제 사진이 IMAGE 채우기로 들어 있으리라 기대하면 안 된다. 실측한 레퍼런스에서는
 * 진짜 이미지가 로고 둘뿐이고, 사진 자리는 전부 `#d9d9d9` 회색 사각형이었다.
 * 그 색이 다섯 번 쓰인 건 우연이 아니라 "여기가 사진 자리"라는 약속이다.
 */
function findPhotoColor(frames: FrameSpec[], cardArea: number, textColors: Set<string>): string | null {
  const bigShapes = frames.flatMap((frame) =>
    frame.shapes.filter((shape) => area(shape) / cardArea >= PHOTO_MIN_AREA),
  );
  // 글자에도 쓰이는 색은 사진 자리가 아니다. 그냥 큰 색 면이다.
  const counts = countBy(bigShapes, (shape) =>
    shape.fill && !textColors.has(shape.fill.hex) ? shape.fill.hex : null,
  );
  const top = topOf(counts);
  // 한 번만 나온 큰 면은 그 카드의 배경이지 반복되는 약속이 아니다.
  return top && (counts.get(top) ?? 0) >= 2 ? top : null;
}

function rolesFor(
  frames: FrameSpec[],
  colors: { hex: string; uses: number }[],
  photoColor: string | null,
): PaletteEntry[] {
  const paper = topOf(countBy(frames, (frame) => (frame.background ? frame.background.hex : null)));
  const textCounts = countBy(
    frames.flatMap((frame) => frame.textSlots),
    (slot) => (slot.color ? slot.color.hex : null),
  );
  // 종이색과 같은 글자색은 사진 위에 얹은 흰 글자다. 잉크로 치면 안 된다.
  const inkCandidates = [...textCounts].filter(([hex]) => hex !== paper);
  inkCandidates.sort((a, b) => b[1] - a[1]);
  const ink = inkCandidates.length > 0 ? inkCandidates[0][0] : null;

  // 남은 것 중 가장 많이 쓰인 색이 강조색이다. 밝기로 고르지 않는다 — 브랜드색은 밝을 수도 어두울 수도 있다.
  const taken = new Set([paper, ink, photoColor].filter(Boolean) as string[]);
  const accent = colors.find((entry) => !taken.has(entry.hex))?.hex ?? null;

  return colors.map((entry) => ({
    hex: entry.hex,
    uses: entry.uses,
    role:
      entry.hex === paper ? 'paper'
      : entry.hex === ink ? 'ink'
      : entry.hex === photoColor ? 'photo'
      : entry.hex === accent ? 'accent'
      : 'other',
  }));
}

/**
 * 폰트 위계를 나눈다.
 *
 * "이건 제목이고 저건 설명"이라고 이름으로 판단하지 않는다. 레이어 이름은 사람이 아무렇게나 짓는다.
 * 대신 **가장 많이 쓰인 작은 글자를 본문으로 잡고**, 그 배수로 나눈다. 본문은 분량이 많아
 * 반드시 여러 번 나오고, 제목은 카드마다 한 번씩만 나온다.
 */
function typeRoles(scale: TemplateManifest['system']['typeScale']): TypeEntry[] {
  const workhorses = scale.filter((entry) => entry.uses >= 2);
  const pool = workhorses.length > 0 ? workhorses : scale;
  const bodySize = pool.reduce((min, entry) => Math.min(min, entry.fontSize), Infinity);

  return scale.map((entry) => ({
    ...entry,
    role:
      entry.fontSize >= bodySize * 2 ? 'display'
      : entry.fontSize > bodySize ? 'heading'
      : 'body',
  }));
}

/**
 * 여러 카드에 반복되는 가는 막대를 찾는다.
 *
 * 어떤 레퍼런스에서는 번호 옆의 2px 파란 세로선이 여섯 프레임 중 넷에 있었다.
 * 이런 건 장식이 아니라 표식이라, 빠지면 같은 시리즈로 안 보인다.
 */
function findSignatures(frames: FrameSpec[]): Signature[] {
  type Bucket = { fill: string; orientation: 'vertical' | 'horizontal'; thickness: number; lengths: number[]; frames: Set<string> };
  const buckets = new Map<string, Bucket>();

  frames.forEach((frame, index) => {
    for (const shape of frame.shapes) {
      if (!shape.fill) continue;
      const { width, height } = shape.rect;
      const vertical = width <= RULE_MAX_THICKNESS && height > width;
      const horizontal = height <= RULE_MAX_THICKNESS && width > height;
      if (!vertical && !horizontal) continue;

      const thickness = vertical ? width : height;
      const length = vertical ? height : width;
      const key = `${shape.fill.hex}|${vertical ? 'v' : 'h'}|${thickness}`;
      const bucket = buckets.get(key) ?? {
        fill: shape.fill.hex,
        orientation: vertical ? ('vertical' as const) : ('horizontal' as const),
        thickness,
        lengths: [],
        frames: new Set<string>(),
      };
      bucket.lengths.push(length);
      // 한 카드에 두 개 있어도 한 카드로 센다. 반복은 카드 사이에서 세야 의미가 있다.
      bucket.frames.add(`${index}`);
      buckets.set(key, bucket);
    }
  });

  return [...buckets.values()]
    .filter((bucket) => bucket.frames.size >= 2)
    .map((bucket) => ({
      fill: bucket.fill,
      orientation: bucket.orientation,
      thickness: bucket.thickness,
      length: { min: Math.min(...bucket.lengths), max: Math.max(...bucket.lengths) },
      frames: bucket.frames.size,
    }))
    .sort((a, b) => b.frames - a.frames);
}

/**
 * 폭이 고정된 칸만 쓴다. WIDTH_AND_HEIGHT는 글자가 상자를 만들어서, 잴 때 가정한 폭이
 * 실제와 다를 수 있다. 믿을 수 있는 표본만 넣어야 상수가 흔들리지 않는다.
 */
function fitDensity(frames: FrameSpec[]): Density | null {
  const values: number[] = [];
  for (const frame of frames) {
    for (const slot of frame.textSlots) {
      if (slot.autoResize !== 'HEIGHT') continue;
      if (slot.fontSize === 'mixed' || slot.budget.max <= 0) continue;
      const cells = (slot.rect.width * slot.rect.height) / (slot.fontSize * slot.fontSize);
      const chars = [...slot.characters].length;
      if (cells <= 0 || chars === 0) continue;
      // 예산은 "몇 자"로 재어졌고 그 글자 구성은 원본과 같다. 원본의 평균 em으로 환산한다.
      values.push((slot.budget.max * (emWidth(slot.characters) / chars)) / cells);
    }
  }
  if (values.length === 0) return null;

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  return {
    mean: Math.round(mean * 1000) / 1000,
    safe: Math.round(min * 1000) / 1000,
    samples: values.length,
    spread: Math.round((Math.max(max - mean, mean - min) / mean) * 1000) / 1000,
  };
}

/**
 * 글자 한 개가 차지하는 가로 폭. 1.0이 글자 크기와 같은 정사각이다.
 *
 * 한글·한자·가나는 정사각이고 라틴과 숫자는 절반쯤이다. 이걸 구분하지 않으면
 * 숫자만 있는 칸에서 예측이 두 배 넘게 틀린다.
 */
export function emWidth(text: string): number {
  let total = 0;
  for (const char of text) {
    if (/\s/.test(char)) {
      total += 0.35;
      continue;
    }
    const code = char.codePointAt(0) ?? 0;
    const wide =
      (code >= 0xac00 && code <= 0xd7a3) || // 한글 음절
      (code >= 0x1100 && code <= 0x11ff) || // 한글 자모
      (code >= 0x3130 && code <= 0x318f) || // 호환 자모
      (code >= 0x4e00 && code <= 0x9fff) || // 한자
      (code >= 0x3040 && code <= 0x30ff) || // 가나
      (code >= 0xff00 && code <= 0xff60);   // 전각
    total += wide ? 1 : 0.55;
  }
  return Math.round(total * 100) / 100;
}

/**
 * 글꼴의 실제 치수. 레퍼런스에서 재어 뽑는다.
 *
 * Pretendard 한글은 글자 크기의 0.86배쯤을 차지하고 줄 높이는 1.19배다. 폰트가 바뀌면
 * 이 값도 바뀌므로 상수로 박지 않는다. 측정해 보니 여섯 프레임에서 줄 높이가 1.190~1.195로
 * 거의 흔들리지 않았다.
 */
export type Metrics = {
  /** 글자 크기 대비 가로 폭. 0.86이면 30px 한글 한 자가 25.8px. */
  advance: number;
  /** 글자 크기 대비 줄 높이. */
  lineRatio: number;
  samples: number;
};

function fitMetrics(frames: FrameSpec[]): Metrics | null {
  const advances: number[] = [];
  const ratios: number[] = [];
  for (const frame of frames) {
    for (const slot of frame.textSlots) {
      if (slot.fontSize === 'mixed' || slot.autoResize !== 'WIDTH_AND_HEIGHT') continue;
      const lines = slot.characters.split('\n');
      // 글자가 상자를 만든 칸에서만 잰다. 폭이 고정된 칸은 남는 여백이 섞여 값이 흐려진다.
      const longest = Math.max(...lines.map((line) => emWidth(line)));
      // 숫자만 있는 칸은 제외한다. 한글과 폭이 달라 평균을 끌어당긴다.
      const korean = [...lines.join('')].filter((char) => /[가-힣]/.test(char)).length;
      if (longest > 0 && korean >= 2) advances.push(slot.rect.width / (longest * slot.fontSize));
      if (lines.length >= 2) ratios.push(slot.rect.height / (lines.length * slot.fontSize));
    }
  }
  if (advances.length === 0 || ratios.length === 0) return null;
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    advance: Math.round(mean(advances) * 1000) / 1000,
    lineRatio: Math.round(mean(ratios) * 1000) / 1000,
    samples: advances.length,
  };
}

/**
 * 이 상자에 몇 줄이 들어가는가.
 * 마지막 줄은 아래 여백이 필요 없다. 그걸 빼지 않으면 레퍼런스 자신도 "잘린다"고 나온다.
 */
export function linesFit(metrics: Metrics, height: number, fontSize: number): number {
  if (fontSize <= 0) return 0;
  const lead = fontSize * metrics.lineRatio;
  return Math.max(0, Math.floor((height + fontSize * (metrics.lineRatio - 1)) / lead));
}

/** 이 문구가 몇 줄을 차지하는가. 줄바꿈과 자동 줄넘김을 같이 센다. */
export function linesNeeded(metrics: Metrics, text: string, width: number, fontSize: number): number {
  const perLine = width / (fontSize * metrics.advance);
  if (perLine <= 0) return Infinity;
  return text
    .split('\n')
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(emWidth(line) / perLine)), 0);
}

/** 이 상자에 들어가는 em 폭. safe를 쓰면 보수적으로, mean을 쓰면 평균적으로 본다. */
export function roomEm(density: Density, width: number, height: number, fontSize: number, generous = false): number {
  if (fontSize <= 0) return 0;
  const constant = generous ? density.mean : density.safe;
  return Math.round(((constant * width * height) / (fontSize * fontSize)) * 100) / 100;
}

export function extractTokens(manifest: TemplateManifest): DesignTokens {
  const { frames, system } = manifest;
  const notes: string[] = [];
  const cardArea = Math.max(1, system.cardSize.width * system.cardSize.height);

  const textColors = new Set(
    frames.flatMap((frame) => frame.textSlots.map((slot) => slot.color?.hex)).filter(Boolean) as string[],
  );
  const photoColor = findPhotoColor(frames, cardArea, textColors);
  if (!photoColor) {
    notes.push('사진 자리로 볼 만한 색을 찾지 못했습니다. 사진이 실제 이미지로 들어 있거나 자리가 비어 있는 것 같습니다.');
  }

  const photoShapes = photoColor
    ? frames.flatMap((frame) => frame.shapes.filter((shape) => shape.fill?.hex === photoColor))
    : [];
  const ratios = photoShapes.map((shape) => area(shape) / cardArea);

  // 0은 전폭 요소의 자리지 여백이 아니다. 그리고 가장자리에서 먼 값은 단 위치지 여백이 아니다.
  const marginLimit = system.cardSize.width * MARGIN_ZONE;
  const marginValues = system.margins
    .map((entry) => entry.value)
    .filter((value) => value > 0 && value <= marginLimit);
  if (marginValues.length === 0) {
    notes.push('반복되는 여백을 찾지 못했습니다. 요소마다 자리가 제각각인 것 같습니다.');
  }

  return {
    cardSize: system.cardSize,
    palette: rolesFor(frames, system.colors, photoColor),
    typeScale: typeRoles(system.typeScale),
    margins: {
      min: marginValues.length > 0 ? Math.min(...marginValues) : 0,
      max: marginValues.length > 0 ? Math.max(...marginValues) : 0,
      values: [...marginValues].sort((a, b) => a - b),
    },
    photoColor,
    photoAreaRatio:
      ratios.length > 0
        ? { min: Math.round(Math.min(...ratios) * 100) / 100, max: Math.round(Math.max(...ratios) * 100) / 100 }
        : null,
    signatures: findSignatures(frames),
    density: fitDensity(frames),
    metrics: fitMetrics(frames),
    notes,
  };
}

/** 색을 역할로 찾는다. 에이전트는 hex를 직접 쓰지 않고 역할로만 고른다. */
export function colorFor(tokens: DesignTokens, role: ColorRole): string | null {
  return tokens.palette.find((entry) => entry.role === role)?.hex ?? null;
}

/** 읽히는 조합인지 본다. WCAG 대비비 공식이다. 취향이 아니라 계산이다. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
}
