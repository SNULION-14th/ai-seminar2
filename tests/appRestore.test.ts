import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import type { GenerateInput } from '../shared/contracts';
import type { TemplateManifest } from '../shared/templateManifest';
import type { LayoutResult } from '../shared/workflow';
import { LayoutLoadError } from '../src/lib/api';

const manifest = JSON.parse(await readFile(new URL('./fixtures/reference.json', import.meta.url), 'utf8')) as TemplateManifest;
const input: GenerateInput = {
  brandName: '저장된 브랜드', primaryColor: '#0055ff', brandMarkdown: '브랜드 소개 자료입니다.',
  sourceContent: '저장된 작업에서 전달하려던 원본 내용입니다.', outline: '', audience: '대학생', mustFollow: '',
  tone: 'friendly', templateMode: 'free', cardCount: 3,
};
const identity = { briefId: '7c4ea5e6-c0a7-4bab-bfde-851199c78ca3', templateHash: 'a'.repeat(64) };
const snapshot: LayoutResult = {
  ...identity, input, manifest,
  deck: { ...identity, schemaVersion: 1, cards: [1, 2, 3].map((id) => ({
    id, background: 'paper',
    blocks: [{ kind: 'text', text: '저장된 문구', fontSize: 30, fontStyle: 'Regular', color: 'ink', align: 'left', rect: { x: 20, y: 200, width: 1000, height: 180 } }],
  })) },
};

type View = { type: string; props: Record<string, unknown> & { children?: unknown } };
function elements(value: unknown): View[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== 'object' || !('props' in value)) return [];
  const view = value as View;
  return [view, ...elements(view.props.children)];
}
function label(value: unknown): string {
  if (Array.isArray(value)) return value.map(label).join('');
  if (value && typeof value === 'object' && 'props' in value) return label((value as View).props.children);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}
function button(view: View, text: string): View | undefined {
  return elements(view).find((element) => element.type === 'button' && label(element) === text);
}

// Exercise the component's own handlers/effects without adding a DOM test dependency.
const compiled = await build({
  entryPoints: [fileURLToPath(new URL('../src/App.tsx', import.meta.url))], bundle: true, write: false,
  platform: 'node', format: 'cjs', jsx: 'automatic', logLevel: 'silent',
  plugins: [{ name: 'app-test-ports', setup(builder) {
    builder.onResolve({ filter: /^(react|react\/jsx-runtime)$|\.\/components\/(BrandForm|LayoutPreview)$|\.\/lib\/(api|persist|clipboard)$/ }, (args) => ({ path: args.path, namespace: 'ports' }));
    builder.onLoad({ filter: /.*/, namespace: 'ports' }, ({ path }) => {
      if (path === 'react') return { contents: 'export const {useState,useRef,useEffect,useMemo}=globalThis.hooks;' };
      if (path === 'react/jsx-runtime') return { contents: 'export const jsx=(type,props)=>({type,props});export const jsxs=jsx;' };
      if (path.includes('/components/')) return { contents: `export default ${JSON.stringify(path.split('/').at(-1))};` };
      if (path.endsWith('/api')) return { contents: 'export const {LayoutLoadError,loadLayout,saveBrief}=globalThis.ports;' };
      if (path.endsWith('/persist')) return { contents: 'export const {loadInput,loadTemplate,saveInput,saveTemplate}=globalThis.ports;' };
      return { contents: 'export const {copyToClipboard}=globalThis.ports;' };
    });
  } }],
});

function harness(options: { sameDraft?: boolean } = {}) {
  let cursor = 0;
  const slots: unknown[] = [];
  const effectSlots = new Set<number>();
  let pendingEffects: Array<() => unknown> = [];
  let resolveInitial: (value: LayoutResult | null) => void = () => {};
  const initial = new Promise<LayoutResult | null>((resolve) => { resolveInitial = resolve; });
  let subsequentLoad: (expected: unknown) => Promise<LayoutResult | null> = async () => null;
  const requested: unknown[] = [];
  const draft = options.sameDraft ? input : { ...input, brandName: '브라우저 초안', templateMode: 'strict' as const };
  const draftManifest = options.sameDraft ? manifest : { ...manifest, readAt: '2026-09-23T03:00:00Z',
    system: { ...manifest.system, cardSize: { width: 200, height: 300 },
      typeScale: [{ fontSize: 12, fontFamily: 'Draft Only Font', fontStyle: 'Regular', uses: 1 }] } };
  const copied: string[] = [];
  const saved = { ...identity, briefId: '260424b0-d304-4e53-a1a5-73cfbfbe7ad8', saved: 'brief/latest.json', cards: 3, reference: '새 작업', frames: 1 };
  const hooks = {
    useState(initialValue: unknown) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initialValue === 'function' ? initialValue() : initialValue;
      return [slots[index], (value: unknown) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initialValue: unknown) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initialValue };
      return slots[index];
    },
    useEffect(effect: () => unknown) {
      const index = cursor++;
      if (!effectSlots.has(index)) { effectSlots.add(index); pendingEffects.push(effect); }
    },
    useMemo(factory: () => unknown) { return factory(); },
  };
  const ports = {
    LayoutLoadError,
    loadInput: () => draft, loadTemplate: () => draftManifest, saveInput() {}, saveTemplate() {},
    loadLayout: (expected: unknown) => { requested.push(expected); return requested.length === 1 ? initial : subsequentLoad(expected); },
    saveBrief: async () => saved,
    copyToClipboard: async (text: string) => { copied.push(text); return true; },
  };
  const module = { exports: {} as { default: () => View } };
  runInNewContext(compiled.outputFiles[0].text, { module, exports: module.exports, hooks, ports, Error });
  const render = () => { cursor = 0; const view = module.exports.default(); const effects = pendingEffects; pendingEffects = []; effects.forEach((effect) => effect()); return view; };
  return { render, resolveInitial, requested, draft, draftManifest, saved, copied,
    setLoad: (next: typeof subsequentLoad) => { subsequentLoad = next; } };
}

const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
function formOf(view: View): View { return elements(view).find((element) => element.type === 'BrandForm')!; }
function previewOf(view: View): View | undefined { return elements(view).find((element) => element.type === 'LayoutPreview'); }
function payloadOf(view: View) {
  const handoff = elements(view).find((element) => element.props.className === 'handoff-payload')!;
  assert.ok(handoff, 'a loaded result should immediately expose its handoff');
  return JSON.parse(handoff.props.value as string);
}
function assertDraftUnchanged(view: View, app: ReturnType<typeof harness>): void {
  assert.equal(formOf(view).props.value, app.draft);
  assert.equal(formOf(view).props.template, app.draftManifest);
}
function assertSnapshotVisible(view: View): void {
  assert.equal(previewOf(view)?.props.deck, snapshot.deck);
  const payload = payloadOf(view);
  assert.deepEqual(payload.manifest, snapshot.manifest);
  assert.equal(payload.referenceMode, snapshot.input.templateMode);
  assert.equal(payload.deck.briefId, snapshot.briefId);
  assert.equal(button(view, '결과 복사')!.props.disabled, false);
  assert.equal(button(view, '저장된 결과의 입력·레퍼런스로 열기'), undefined);
  assert.equal(button(view, '최신 저장 결과 확인'), undefined);
}

test('initial mismatched results display immediately with a reference notice and unchanged draft', async () => {
  const app = harness();
  app.render(); app.resolveInitial(snapshot); await settle();
  const view = app.render();
  assertDraftUnchanged(view, app);
  assertSnapshotVisible(view);
  assert.match(label(view), /현재 레퍼런스와 다른 레퍼런스로 만든 결과/);
  assert.match(label(view), /현재 입력과 다른 내용/);
  assert.ok(app.requested.every((expected) => expected === undefined));
});

test('manual mismatched results display immediately without changing the draft', async () => {
  const app = harness();
  app.render(); app.resolveInitial(null); await settle();
  let view = app.render();
  app.setLoad(async () => snapshot);
  (button(view, '결과 불러오기')!.props.onClick as () => void)();
  await settle();
  view = app.render();
  assertDraftUnchanged(view, app);
  assertSnapshotVisible(view);
  assert.match(label(view), /현재 레퍼런스와 다른 레퍼런스로 만든 결과/);
});

test('preview, validation and clipboard use the result reference and mode, never the draft reference', async () => {
  const app = harness();
  app.render(); app.resolveInitial(snapshot); await settle();
  const view = app.render();
  const tokens = previewOf(view)!.props.tokens as { cardSize: { width: number; height: number }; typeScale: Array<{ fontFamily: string }> };
  assert.equal(tokens.cardSize.width, 1080);
  assert.equal(tokens.cardSize.height, 1350);
  assert.ok(tokens.typeScale.some((entry) => entry.fontFamily === 'Pretendard Variable'));
  assert.ok(tokens.typeScale.every((entry) => entry.fontFamily !== 'Draft Only Font'));
  assert.match(label(view), /검사를 모두 통과했습니다/);
  assert.doesNotMatch(label(view), /왼쪽 여백|상자를 .*만 채웁니다/);
  assert.equal(button(view, '결과 복사')!.props.disabled, false);
  (button(view, '결과 복사')!.props.onClick as () => void)();
  await settle();
  const copied = JSON.parse(app.copied[0]);
  assert.deepEqual(copied.manifest, snapshot.manifest);
  assert.equal(copied.referenceMode, 'free');
  assert.equal(copied.deck.briefId, snapshot.briefId);
});

test('a remembered older saved job ID is informational and is never sent on load', async () => {
  const app = harness();
  app.render(); app.resolveInitial(null); await settle();
  let view = app.render();
  (formOf(view).props.onSubmit as () => void)();
  await settle();
  view = app.render();
  app.setLoad(async (expected) => { assert.equal(expected, undefined); return snapshot; });
  (button(view, '결과 불러오기')!.props.onClick as () => void)();
  await settle();
  view = app.render();
  assertDraftUnchanged(view, app);
  assertSnapshotVisible(view);
  assert.match(label(view), /마지막으로 저장한 브리프와 다른 작업/);
  assert.ok(app.requested.every((expected) => expected === undefined));
});

test('editing inputs or the reference keeps the loaded result and updates only the notices', async () => {
  const app = harness({ sameDraft: true });
  app.render(); app.resolveInitial(snapshot); await settle();
  let view = app.render();
  assert.doesNotMatch(label(view), /현재 레퍼런스와 다른|현재 입력과 다른/);
  (formOf(view).props.onChange as (field: string, value: string) => void)('brandName', '편집한 브랜드');
  view = app.render();
  assertSnapshotVisible(view);
  assert.match(label(view), /현재 입력과 다른/);
  assert.doesNotMatch(label(view), /현재 레퍼런스와 다른/);
  (formOf(view).props.onTemplate as (next: TemplateManifest | null) => void)(null);
  view = app.render();
  assertSnapshotVisible(view);
  assert.match(label(view), /현재 레퍼런스와 다른/);
  assert.equal((formOf(view).props.value as GenerateInput).brandName, '편집한 브랜드');
  assert.equal(formOf(view).props.template, null);
});

test('the same reference does not receive a reference mismatch notice', async () => {
  const app = harness({ sameDraft: true });
  app.render(); app.resolveInitial(snapshot); await settle();
  const view = app.render();
  assertSnapshotVisible(view);
  assert.doesNotMatch(label(view), /현재 레퍼런스와 다른 레퍼런스/);
});

test('initial results arriving after editing cannot override the newer interaction', async () => {
  const app = harness();
  const view = app.render();
  (formOf(view).props.onChange as (field: string, value: string) => void)('brandName', '입력 중인 브랜드');
  app.resolveInitial(snapshot);
  await settle();
  const after = app.render();
  assert.equal(previewOf(after), undefined);
  assert.equal((formOf(after).props.value as GenerateInput).brandName, '입력 중인 브랜드');
});

test('editing during reload preserves the visible result and ignores the late replacement', async () => {
  const app = harness();
  app.render(); app.resolveInitial(snapshot); await settle();
  let view = app.render();
  let resolveReload: (value: LayoutResult) => void = () => {};
  app.setLoad(() => new Promise((resolve) => { resolveReload = resolve; }));
  (button(view, '다시 불러오기')!.props.onClick as () => void)();
  view = app.render();
  (formOf(view).props.onChange as (field: string, value: string) => void)('brandName', '조회 중 편집');
  resolveReload({ ...snapshot, deck: { ...snapshot.deck, cards: snapshot.deck.cards.slice(0, 1) } });
  await settle();
  view = app.render();
  assertSnapshotVisible(view);
  assert.equal((formOf(view).props.value as GenerateInput).brandName, '조회 중 편집');
});

for (const status of [409, 422]) {
  test(`server validation failure ${status} still blocks the corrupt result`, async () => {
    const app = harness();
    app.render(); app.resolveInitial(null); await settle();
    let view = app.render();
    app.setLoad(async () => { throw new LayoutLoadError('저장된 결과 데이터가 유효하지 않습니다.', status); });
    (button(view, '결과 불러오기')!.props.onClick as () => void)();
    await settle();
    view = app.render();
    assertDraftUnchanged(view, app);
    assert.equal(previewOf(view), undefined);
    assert.equal(button(view, '결과 복사'), undefined);
    assert.match(label(view), /저장된 결과 데이터가 유효하지 않습니다/);
  });
}
