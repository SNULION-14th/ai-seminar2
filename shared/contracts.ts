export type Tone = 'friendly' | 'calm' | 'professional';
/** 내부 필드명은 기존 저장 형식을 유지하고, 화면에서는 레퍼런스 적용 방식으로 부른다. */
export type TemplateMode = 'strict' | 'body' | 'free';

export type GenerateInput = {
  brandName: string;
  primaryColor: string;
  /** 브랜드 정체성·어투·금지 표현과 서비스 기능·사실을 한 곳에 담는다. */
  brandMarkdown: string;
  /** 무엇을 전하고 그걸로 무엇을 하게 할지. 둘은 떼면 같은 말을 두 번 쓰게 돼 한 칸이다. */
  sourceContent: string;
  outline: string;
  audience: string;
  /** 이번에만 적용할 예외 지침. 다른 작성 규칙보다 우선한다. */
  mustFollow: string;
  tone: Tone;
  templateMode: TemplateMode;
  cardCount: number;
};

export type Card = {
  /** 1부터 cardCount까지. 실제 범위는 런타임에서 검증한다. */
  id: number;
  role: 'cover' | 'body' | 'closing';
  title: string;
  body: string;
};

/** 사진을 어디서 구할지에 대한 모델의 판단. 찾기가 실패하면 서버가 만들기로 넘어간다. */
export type PhotoSource = 'search' | 'generate';
export const PHOTO_SOURCES: readonly PhotoSource[] = ['search', 'generate'];

/**
 * 카드마다 어떤 배치를 쓰고 어떤 사진이 어울리는지에 대한 모델의 선택.
 * `variant`는 여기서 문자열로 둔다. 실제 허용 목록 대조와 강등은 shared/template.ts가 한다.
 */
export type CardLayoutChoice = {
  cardId: Card['id'];
  variant: string;
  /** 사진 설명. 한국어. 사진을 만들 때 쓴다. */
  photoBrief: string;
  /** 무료 사진 검색어. 영어. 검색 결과가 좋으려면 영어여야 한다. */
  photoQuery: string;
  /** 흔한 장면이면 찾기, 브랜드 특유거나 찾기 어려운 장면이면 만들기. */
  photoSource: PhotoSource;
};

export type GenerateResponse = { cards: Card[]; layouts: CardLayoutChoice[]; warnings: string[] };
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export const CARD_COUNT = { min: 3, max: 10, default: 5 } as const;

/** 장수에 맞춘 역할 순서. 표지 1장 + 설명 N-2장 + 마무리 1장. */
export function cardRoles(count: number): Card['role'][] {
  return Array.from({ length: count }, (_, index) =>
    index === 0 ? 'cover' : index === count - 1 ? 'closing' : 'body',
  );
}
export const INPUT_LIMITS = {
  brandName: { min: 1, max: 40 },
  brandMarkdown: { min: 1, max: 20_000 },
  sourceContent: { min: 10, max: 3_000 },
  outline: { min: 0, max: 500 },
  audience: { min: 1, max: 200 },
  mustFollow: { min: 0, max: 2_000 },
} as const;
export const CARD_LIMITS = { title: 36, body: 140 } as const;
export const PHOTO_BRIEF_MAX = 80;
export const PHOTO_QUERY_MAX = 60;
export const TEMPLATE_MODES: readonly TemplateMode[] = ['strict', 'body', 'free'];

export function charLength(text: string): number {
  return Array.from(text).length;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return Object.keys(value).every((field) => fields.includes(field));
}

function trimmedText(value: unknown, min: number, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const length = charLength(text);
  return length >= min && length <= max ? text : null;
}

export function validateGenerateInput(value: unknown): ValidationResult<GenerateInput> {
  if (!isRecord(value)) return { success: false, errors: { form: '입력 자료는 JSON 객체여야 합니다.' } };
  const errors: Record<string, string> = {};
  const text: Record<string, string> = {};
  for (const [field, limit] of Object.entries(INPUT_LIMITS)) {
    const parsed = trimmedText(value[field], limit.min, limit.max);
    if (parsed === null) {
      errors[field] = limit.min === 0
        ? `${limit.max.toLocaleString()}자 이내로 입력해 주세요. 비워 두어도 됩니다.`
        : `${limit.min.toLocaleString()}~${limit.max.toLocaleString()}자로 입력해 주세요.`;
    }
    else text[field] = parsed;
  }
  const primaryColor = typeof value.primaryColor === 'string' ? value.primaryColor.trim() : '';
  if (!/^#[0-9a-f]{6}$/i.test(primaryColor)) errors.primaryColor = '#RRGGBB 형식의 색상을 입력해 주세요.';
  if (!['friendly', 'calm', 'professional'].includes(String(value.tone))) errors.tone = '어투를 선택해 주세요.';
  if (!TEMPLATE_MODES.includes(value.templateMode as TemplateMode)) errors.templateMode = '레퍼런스 적용 방식을 선택해 주세요.';
  const cardCount = typeof value.cardCount === 'number' ? value.cardCount : NaN;
  if (!Number.isInteger(cardCount) || cardCount < CARD_COUNT.min || cardCount > CARD_COUNT.max) {
    errors.cardCount = `카드 장수는 ${CARD_COUNT.min}~${CARD_COUNT.max}장이어야 합니다.`;
  }
  if (!exactFields(value, [...Object.keys(INPUT_LIMITS), 'primaryColor', 'tone', 'templateMode', 'cardCount'])) {
    errors.form = '지원하지 않는 입력 항목이 있습니다.';
  }
  if (Object.keys(errors).length) return { success: false, errors };
  return {
    success: true,
    data: {
      brandName: text.brandName,
      primaryColor,
      brandMarkdown: text.brandMarkdown,
      sourceContent: text.sourceContent,
      outline: text.outline,
      audience: text.audience,
      mustFollow: text.mustFollow,
      tone: value.tone as Tone,
      templateMode: value.templateMode as TemplateMode,
      cardCount,
    },
  };
}

export function validateCards(value: unknown, count: number): ValidationResult<Card[]> {
  if (!Array.isArray(value) || value.length !== count) {
    return { success: false, errors: { cards: `카드가 정확히 ${count}장이어야 합니다.` } };
  }
  const roles = cardRoles(count);
  const cards: Card[] = [];
  const errors: Record<string, string> = {};
  for (let index = 0; index < count; index += 1) {
    const card: unknown = value[index];
    const path = `cards.${index}`;
    if (!isRecord(card) || !exactFields(card, ['id', 'role', 'title', 'body'])) {
      errors[path] = '카드 데이터 형식이 올바르지 않습니다.';
      continue;
    }
    if (card.id !== index + 1 || card.role !== roles[index]) errors[path] = '카드 순서 또는 역할이 올바르지 않습니다.';
    const title = trimmedText(card.title, 1, CARD_LIMITS.title);
    const body = trimmedText(card.body, 1, CARD_LIMITS.body);
    if (title === null) errors[`${path}.title`] = `제목은 1~${CARD_LIMITS.title}자여야 합니다.`;
    if (body === null) errors[`${path}.body`] = `본문은 1~${CARD_LIMITS.body}자여야 합니다.`;
    if (title !== null && body !== null) cards.push({ id: index + 1, role: roles[index], title, body });
  }
  return Object.keys(errors).length ? { success: false, errors } : { success: true, data: cards };
}

/** 배치 선택 배열. strict 모드 응답에는 없으므로 없으면 빈 배열로 본다. */
export function validateLayoutChoices(value: unknown, count: number): ValidationResult<CardLayoutChoice[]> {
  if (value === undefined) return { success: true, data: [] };
  if (!Array.isArray(value) || value.length !== count) {
    return { success: false, errors: { layouts: '배치 선택이 카드 수와 맞지 않습니다.' } };
  }
  const errors: Record<string, string> = {};
  const layouts: CardLayoutChoice[] = [];
  for (let index = 0; index < count; index += 1) {
    const choice: unknown = value[index];
    const path = `layouts.${index}`;
    if (!isRecord(choice) || !exactFields(choice, ['cardId', 'variant', 'photoBrief', 'photoQuery', 'photoSource'])) {
      errors[path] = '배치 선택 형식이 올바르지 않습니다.';
      continue;
    }
    const variant = trimmedText(choice.variant, 1, 60);
    const photoBrief = trimmedText(choice.photoBrief, 0, PHOTO_BRIEF_MAX);
    const photoQuery = trimmedText(choice.photoQuery, 0, PHOTO_QUERY_MAX);
    if (choice.cardId !== index + 1) errors[path] = '배치 선택의 카드 번호가 올바르지 않습니다.';
    if (variant === null) errors[`${path}.variant`] = '배치 이름이 올바르지 않습니다.';
    if (photoBrief === null) errors[`${path}.photoBrief`] = `사진 설명은 ${PHOTO_BRIEF_MAX}자 이내여야 합니다.`;
    if (photoQuery === null) errors[`${path}.photoQuery`] = `사진 검색어는 ${PHOTO_QUERY_MAX}자 이내여야 합니다.`;
    if (variant !== null && photoBrief !== null && photoQuery !== null) {
      layouts.push({
        cardId: index + 1,
        variant,
        photoBrief,
        photoQuery,
        // 모르는 값이 오면 찾기부터 한다. 찾기가 실패하면 어차피 만들기로 넘어간다.
        photoSource: PHOTO_SOURCES.includes(choice.photoSource as PhotoSource)
          ? (choice.photoSource as PhotoSource)
          : 'search',
      });
    }
  }
  return Object.keys(errors).length ? { success: false, errors } : { success: true, data: layouts };
}

export function validateGenerateResponse(value: unknown, count: number): ValidationResult<GenerateResponse> {
  if (!isRecord(value) || !exactFields(value, ['cards', 'layouts', 'warnings'])) return { success: false, errors: { response: '생성 결과 형식이 올바르지 않습니다.' } };
  const cards = validateCards(value.cards, count);
  const choices = validateLayoutChoices(value.layouts, count);
  const errors: Record<string, string> = {
    ...(cards.success ? {} : cards.errors),
    ...(choices.success ? {} : choices.errors),
  };
  const warnings: string[] = [];
  if (!Array.isArray(value.warnings) || value.warnings.length > 3) errors.warnings = '확인 안내는 0~3개여야 합니다.';
  else {
    for (let index = 0; index < value.warnings.length; index += 1) {
      const warning = trimmedText(value.warnings[index], 1, 200);
      if (warning === null) errors[`warnings.${index}`] = '확인 안내는 1~200자여야 합니다.';
      else warnings.push(warning);
    }
  }
  if (!cards.success || !choices.success || Object.keys(errors).length) return { success: false, errors };
  return { success: true, data: { cards: cards.data, layouts: choices.data, warnings } };
}
