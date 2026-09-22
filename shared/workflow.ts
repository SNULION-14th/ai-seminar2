import { isRecord, validateGenerateInput, type GenerateInput } from './contracts';
import { parseLayout, type LayoutDeck } from './layout';
import { parseManifest, type TemplateManifest } from './templateManifest';

/** 같은 입력으로 다시 생성해도 별개의 작업이다. */
export type BriefIdentity = { briefId: string; templateHash: string };
export type JobLayout = LayoutDeck & BriefIdentity;
export type LayoutResult = BriefIdentity & {
  deck: JobLayout;
  input: GenerateInput;
  manifest: TemplateManifest;
};

/** JSON 키 순서와 무관하게 레퍼런스와 입력 스냅샷을 비교한다. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function hasIdentity(value: unknown): value is BriefIdentity & Record<string, unknown> {
  return isRecord(value)
    && typeof value.briefId === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.briefId)
    && typeof value.templateHash === 'string'
    && /^[0-9a-f]{64}$/.test(value.templateHash);
}

export function sameIdentity(a: BriefIdentity, b: BriefIdentity): boolean {
  return a.briefId === b.briefId && a.templateHash === b.templateHash;
}

export function parseJobLayout(value: unknown): { ok: true; deck: JobLayout } | { ok: false; reason: string } {
  if (!hasIdentity(value)) return { ok: false, reason: '결과에 작업 정보가 없습니다. 현재 브리프로 다시 만들어 주세요.' };
  const parsed = parseLayout(value);
  if (!parsed.ok) return parsed;
  return { ok: true, deck: { ...parsed.deck, briefId: value.briefId, templateHash: value.templateHash } };
}

export function parseLayoutResult(value: unknown): { ok: true; result: LayoutResult } | { ok: false; reason: string } {
  if (!isRecord(value) || !hasIdentity(value)) return { ok: false, reason: '결과의 작업 정보를 읽지 못했습니다.' };
  const deck = parseJobLayout(value.deck);
  if (!deck.ok) return deck;
  if (!sameIdentity(value, deck.deck)) return { ok: false, reason: '브리프와 결과의 작업 정보가 다릅니다.' };
  const input = validateGenerateInput(value.input);
  if (!input.success) return { ok: false, reason: '결과의 입력 자료를 읽지 못했습니다.' };
  const manifest = parseManifest(JSON.stringify(value.manifest) ?? '');
  if (!manifest.ok) return { ok: false, reason: manifest.reason };
  if (deck.deck.cards.length !== input.data.cardCount || deck.deck.cards.some((card, index) => card.id !== index + 1)) {
    return { ok: false, reason: '결과의 카드 장수 또는 순서가 브리프와 다릅니다.' };
  }
  return {
    ok: true,
    result: { briefId: value.briefId, templateHash: value.templateHash, deck: deck.deck, input: input.data, manifest: manifest.manifest },
  };
}

/** 화면에서 편집 중인 자료와 저장 당시 자료가 같을 때만 결과를 사용할 수 있다. */
export function matchesDraft(result: LayoutResult, input: GenerateInput, manifest: TemplateManifest | null): boolean {
  const parsed = validateGenerateInput(input);
  return manifest !== null && parsed.success
    && stableStringify(parsed.data) === stableStringify(result.input)
    && stableStringify(manifest) === stableStringify(result.manifest);
}
