import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test, type TestContext } from 'node:test';
import { CARD_COUNT, INPUT_LIMITS, type GenerateInput } from '../shared/contracts';
import type { TemplateManifest } from '../shared/templateManifest';
import { loadInput, loadTemplate, saveInput, saveTemplate } from '../src/lib/persist';

const fallback: GenerateInput = {
  brandName: '기본 브랜드', primaryColor: '#0055ff', brandMarkdown: '기본 브랜드 자료',
  sourceContent: '기본으로 전달할 내용입니다.', outline: '', audience: '기본 독자', mustFollow: '',
  tone: 'friendly', templateMode: 'body', cardCount: CARD_COUNT.default,
};

function storage(t: TestContext, value: unknown) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });
}

function savedInput(t: TestContext, input: unknown) {
  storage(t, { getItem: () => JSON.stringify(input) });
}

test('invalid stored enum, color and count fall back individually while valid fields survive', (t) => {
  savedInput(t, { brandName: '저장한 브랜드', tone: 'loud', primaryColor: 'red', cardCount: 3.5, audience: '새 독자' });
  assert.deepEqual(loadInput(fallback), { ...fallback, brandName: '저장한 브랜드', audience: '새 독자' });
});

test('card count restores only contract-bounded integers', (t) => {
  let count: unknown = CARD_COUNT.min;
  storage(t, { getItem: () => JSON.stringify({ cardCount: count }) });
  for (const valid of [CARD_COUNT.min, CARD_COUNT.max]) {
    count = valid;
    assert.equal(loadInput(fallback).cardCount, valid);
  }
  for (const invalid of [CARD_COUNT.min - 1, CARD_COUNT.max + 1, 3.5, '7', null, true, [], {}]) {
    count = invalid;
    assert.equal(loadInput(fallback).cardCount, fallback.cardCount);
  }
});

test('valid tone and hex colors restore with color whitespace normalized', (t) => {
  let tone = 'calm';
  storage(t, { getItem: () => JSON.stringify({ tone, primaryColor: ' #Aa00fF ' }) });
  for (const valid of ['friendly', 'calm', 'professional']) {
    tone = valid;
    assert.equal(loadInput(fallback).tone, valid);
    assert.equal(loadInput(fallback).primaryColor, '#Aa00fF');
  }
});

test('stored text obeys contract limits and does not split unicode code points', (t) => {
  const exact = '😀'.repeat(INPUT_LIMITS.brandName.max);
  let saved: Record<string, unknown> = { brandName: exact, sourceContent: '짧음', audience: 123 };
  storage(t, { getItem: () => JSON.stringify(saved) });
  assert.equal(loadInput(fallback).brandName, exact);
  assert.equal(loadInput(fallback).sourceContent, fallback.sourceContent);
  assert.equal(loadInput(fallback).audience, fallback.audience);
  saved = { brandName: exact + '😀', brandMarkdown: '', mustFollow: '가'.repeat(INPUT_LIMITS.mustFollow.max + 1) };
  assert.deepEqual(loadInput(fallback), fallback);
});

test('objects impersonating enum values and unknown keys do not enter restored input', (t) => {
  savedInput(t, { tone: ['friendly'], templateMode: {}, primaryColor: ['#aabbcc'], unknown: 'ignored', brandName: '유효한 이름' });
  assert.deepEqual(loadInput(fallback), { ...fallback, brandName: '유효한 이름' });
});

test('null, arrays, scalars, malformed JSON and empty storage safely restore defaults', (t) => {
  let raw: string | null = null;
  storage(t, { getItem: () => raw });
  for (const value of [null, '', '{bad', 'null', '[]', '[{"tone":"calm"}]', '42', '"hello"', 'true']) {
    raw = value;
    assert.deepEqual(loadInput(fallback), fallback);
    assert.equal(loadTemplate(), null);
  }
});

test('blocked storage never breaks reading, saving or clearing', (t) => {
  const blocked = () => { throw new Error('storage unavailable'); };
  storage(t, { getItem: blocked, setItem: blocked, removeItem: blocked });
  assert.deepEqual(loadInput(fallback), fallback);
  assert.equal(loadTemplate(), null);
  assert.doesNotThrow(() => saveInput(fallback));
  assert.doesNotThrow(() => saveTemplate(null));
});

test('storage getter denial is handled before any method can be called', (t) => {
  storage(t, {});
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true, get() { throw new Error('SecurityError'); },
  });
  assert.deepEqual(loadInput(fallback), fallback);
  assert.equal(loadTemplate(), null);
  assert.doesNotThrow(() => saveInput(fallback));
  assert.doesNotThrow(() => saveTemplate(null));
});

test('valid reference data survives a save/load cycle and clearing', (t) => {
  const data = new Map<string, string>();
  storage(t, { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) });
  const manifest = JSON.parse(readFileSync(new URL('./fixtures/reference.json', import.meta.url), 'utf8')) as TemplateManifest;
  saveInput(fallback);
  assert.deepEqual(loadInput(fallback), fallback);
  saveTemplate(manifest);
  assert.deepEqual(loadTemplate(), manifest);
  saveTemplate(null);
  assert.equal(loadTemplate(), null);
});
