import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { GenerateInput } from '../shared/contracts';
import type { TemplateManifest } from '../shared/templateManifest';
import { matchesDraft, parseLayoutResult, sameIdentity, stableStringify, type LayoutResult } from '../shared/workflow';
import { LayoutLoadError, loadLayout, saveBrief } from '../src/lib/api';

const manifest = JSON.parse(readFileSync(new URL('./fixtures/reference.json', import.meta.url), 'utf8')) as TemplateManifest;
const input: GenerateInput = {
  brandName: '브랜드', primaryColor: '#0055ff', brandMarkdown: '브랜드의 소개', sourceContent: '매일 기록을 통해 배운 점을 나눕니다.',
  outline: '', audience: '대학생', mustFollow: '', tone: 'friendly', templateMode: 'strict', cardCount: 3,
};
const identity = { briefId: '7c4ea5e6-c0a7-4bab-bfde-851199c78ca3', templateHash: 'a'.repeat(64) };
const result: LayoutResult = {
  ...identity, input, manifest,
  deck: { ...identity, schemaVersion: 1, cards: [1, 2, 3].map((id) => ({ id, background: 'paper', blocks: [{ kind: 'panel', rect: { x: 0, y: 0, width: 100, height: 100 }, color: 'paper' }] })) },
};

test('결과는 저장 당시 입력과 레퍼런스에만 대응한다', () => {
  assert.equal(matchesDraft(result, input, manifest), true);
  assert.equal(matchesDraft(result, { ...input, brandName: '다른 브랜드' }, manifest), false);
  assert.equal(matchesDraft(result, { ...input, templateMode: 'free' }, manifest), false);
  assert.equal(matchesDraft(result, { ...input, cardCount: 7 }, manifest), false);
  assert.equal(matchesDraft(result, input, { ...manifest, readAt: '새로 읽은 버전' }), false);
  assert.equal(matchesDraft(result, input, null), false);
  assert.equal(matchesDraft(result, { ...input, brandName: '  브랜드  ' }, manifest), true);
});

test('JSON 키 순서는 바뀌어도 스냅샷은 같고 같은 입력의 새 작업 ID는 다르다', () => {
  assert.equal(stableStringify({ b: [1, { d: 4, c: 3 }], a: 0 }), stableStringify({ a: 0, b: [1, { c: 3, d: 4 }] }));
  assert.equal(sameIdentity(identity, { ...identity, briefId: '260424b0-d304-4e53-a1a5-73cfbfbe7ad8' }), false);
});

test('결과 envelope는 ID 불일치와 장수·순서 오류를 거부한다', () => {
  assert.equal(parseLayoutResult(result).ok, true);
  assert.equal(parseLayoutResult(result.deck).ok, false);
  assert.equal(parseLayoutResult({ ...result, deck: { ...result.deck, templateHash: 'b'.repeat(64) } }).ok, false);
  assert.equal(parseLayoutResult({ ...result, input: { ...input, cardCount: 7 } }).ok, false);
  assert.equal(parseLayoutResult({ ...result, deck: { ...result.deck, cards: [...result.deck.cards].reverse() } }).ok, false);
});

test('클라이언트는 기대하는 ID를 보내고 서버가 다른 작업을 보내면 거부한다', async (t) => {
  let requested = '';
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request) => {
    requested = String(url);
    return new Response(JSON.stringify(result), { status: 200 });
  });
  assert.deepEqual(await loadLayout(identity), result);
  const query = new URL(requested, 'http://localhost').searchParams;
  assert.equal(query.get('briefId'), identity.briefId);
  assert.equal(query.get('templateHash'), identity.templateHash);
  await assert.rejects(loadLayout({ ...identity, briefId: '260424b0-d304-4e53-a1a5-73cfbfbe7ad8' }), /다른 작업/);
});

test('클라이언트는 오래된 결과 오류를 그대로 알리고 없는 결과는 null로 받는다', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: '현재 브리프와 다른 작업입니다.' }), { status: 409 }));
  await assert.rejects(loadLayout(identity), /현재 브리프와 다른 작업/);
  fetchMock.mock.mockImplementation(async () => new Response('{}', { status: 404 }));
  assert.equal(await loadLayout(), null);
  fetchMock.mock.mockImplementation(async () => new Response(JSON.stringify(result.deck), { status: 200 }));
  await assert.rejects(loadLayout(), /작업 정보/);
});

test('작업 충돌의 HTTP 상태를 보존하며 기대 ID 검사도 충돌 오류로 분류한다', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: '다른 브리프입니다.' }), { status: 409 }));
  await assert.rejects(loadLayout(identity), (error: unknown) => error instanceof LayoutLoadError && error.status === 409 && error.message === '다른 브리프입니다.');
  fetchMock.mock.mockImplementation(async () => new Response(JSON.stringify(result), { status: 200 }));
  await assert.rejects(loadLayout({ ...identity, briefId: '260424b0-d304-4e53-a1a5-73cfbfbe7ad8' }),
    (error: unknown) => error instanceof LayoutLoadError && error.status === 409);
  fetchMock.mock.mockImplementation(async () => new Response(JSON.stringify({ error: '서버 오류' }), { status: 500 }));
  await assert.rejects(loadLayout(), (error: unknown) => error instanceof LayoutLoadError && error.status === 500);
});

test('ID 없는 구형 서버 응답은 저장 성공으로 취급하지 않는다', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ saved: 'brief/latest.json', cards: 3, reference: '예시', frames: 5 }), { status: 200 }));
  await assert.rejects(saveBrief(input, manifest), /개발 서버를 재시작/);
});
