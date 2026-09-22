import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { GenerateInput } from '../shared/contracts';
import { extractTokens } from '../shared/designTokens';
import { parseManifest, type TemplateManifest } from '../shared/templateManifest';
import { matchesDraft, parseLayoutResult, stableStringify, type LayoutResult } from '../shared/workflow';

const fixture = readFileSync(new URL('./fixtures/reference.json', import.meta.url), 'utf8');
const raw = () => JSON.parse(fixture) as Record<string, unknown>;
const frameOf = (value: Record<string, unknown>) => (value.frames as Record<string, unknown>[])[0];
const slotOf = (value: Record<string, unknown>) => (frameOf(value).textSlots as Record<string, unknown>[])[0];
function recover(value: unknown): TemplateManifest {
  const parsed = parseManifest(JSON.stringify(value));
  assert.ok(parsed.ok, !parsed.ok ? parsed.reason : '');
  return parsed.manifest;
}
const hash = (value: unknown) => createHash('sha256').update(stableStringify(value)).digest('hex');

test('완전한 기존 레퍼런스의 값·순서·해시를 변경하지 않는다', () => {
  const original = raw();
  const parsed = recover(original);
  assert.deepEqual(parsed, original);
  assert.equal(hash(parsed), hash(original));
});

test('프레임과 레이어 이름이 중복되어도 원래 이름과 순서를 보존한다', () => {
  const original = raw();
  const frames = original.frames as Record<string, unknown>[];
  for (const frame of frames) {
    frame.frameName = '중복된 이름';
    for (const slot of frame.textSlots as Record<string, unknown>[]) slot.name = '중복된 이름';
  }
  const parsed = recover(original);
  assert.deepEqual(parsed, original);
  assert.equal(parsed.frames.length, frames.length);
});

test('빠진 파일 정보·노드 메타데이터·선택 목록을 안정된 값으로 보완한다', () => {
  const original = raw();
  for (const key of ['readAt', 'fileName', 'pageName', 'notes']) delete original[key];
  const frame = frameOf(original);
  for (const key of ['frameName', 'shapes', 'imageSlots']) delete frame[key];
  const slot = slotOf(original);
  delete slot.name;
  delete slot.nodePath;
  const parsed = recover(original);
  assert.equal(typeof parsed.fileName, 'string');
  assert.equal(typeof parsed.pageName, 'string');
  assert.equal(parsed.readAt, '', '알 수 없는 읽기 시각을 지어내지 않는다');
  assert.ok(Array.isArray(parsed.notes));
  assert.deepEqual(parsed.frames[0].shapes, []);
  assert.deepEqual(parsed.frames[0].imageSlots, []);
  assert.equal(typeof parsed.frames[0].textSlots[0].name, 'string');
  assert.ok(Array.isArray(parsed.frames[0].textSlots[0].nodePath));
  assert.deepEqual(recover(original), parsed, '같은 입력을 다시 읽어도 시각·이름이 바뀌지 않아야 한다');
  assert.deepEqual(recover(parsed), parsed);
});

test('문자열 좌표·크기를 숫자로 바꾸고 짧은 색 표기와 생략된 alpha를 보완한다', () => {
  const original = raw();
  const frame = frameOf(original);
  frame.width = String(frame.width);
  frame.height = String(frame.height);
  const slot = slotOf(original);
  const rect = slot.rect as Record<string, unknown>;
  const expected = { ...rect };
  for (const key of ['x', 'y', 'width', 'height']) rect[key] = String(rect[key]);
  slot.color = { hex: '#fff' };
  const parsed = recover(original);
  assert.equal(parsed.frames[0].width, 1080);
  assert.deepEqual(parsed.frames[0].textSlots[0].rect, expected);
  assert.deepEqual(parsed.frames[0].textSlots[0].color, { hex: '#ffffff', alpha: 1 });
});

test('누락·역전된 글자 예산은 원문 분량으로 보완하며 측정 방식은 지어내지 않는다', () => {
  for (const budget of [undefined, { min: 1000, max: 1 }]) {
    const original = raw();
    const slot = slotOf(original);
    slot.budget = budget;
    delete slot.autoResize;
    delete slot.letterSpacing;
    delete slot.lineHeight;
    const parsed = recover(original).frames[0].textSlots[0];
    assert.equal(parsed.budget.max, [...parsed.characters].length);
    assert.ok(parsed.budget.min >= 0 && parsed.budget.min <= parsed.budget.max);
    assert.equal(parsed.autoResize, 'NONE');
    assert.ok(parsed.letterSpacing);
    assert.ok(parsed.lineHeight);
  }
});

test('불명확한 글꼴은 mixed로 남기고 임의의 글꼴 이름을 만들지 않는다', () => {
  const original = raw();
  const slot = slotOf(original);
  slot.fontSize = '알 수 없음';
  delete slot.fontFamily;
  slot.fontStyle = '';
  const parsed = recover(original).frames[0].textSlots[0];
  assert.equal(parsed.fontSize, 'mixed');
  assert.equal(parsed.fontFamily, 'mixed');
  assert.equal(parsed.fontStyle, 'mixed');
});

test('디자인 시스템이 없거나 잘못되면 유효한 프레임 자료에서 다시 추출한다', () => {
  for (const system of [undefined, { cardSize: { width: 0, height: 0 }, colors: null }]) {
    const original = raw();
    original.system = system;
    const parsed = recover(original);
    assert.deepEqual(parsed.system.cardSize, { width: 1080, height: 1350 });
    assert.ok(parsed.system.colors.length > 0);
    assert.ok(parsed.system.typeScale.length > 0);
    const observedFonts = new Set(parsed.frames.flatMap((frame) => frame.textSlots.map((slot) => slot.fontFamily)));
    assert.ok(parsed.system.typeScale.every((entry) => observedFonts.has(entry.fontFamily)));
    assert.doesNotThrow(() => extractTokens(parsed));
    assert.deepEqual(recover(parsed), parsed);
  }
});

test('좌표를 잃은 레이어만 제외하고 다른 레이어와 프레임 순서는 보존한다', () => {
  const original = raw();
  const frame = frameOf(original);
  const slots = frame.textSlots as Record<string, unknown>[];
  const expectedNames = slots.slice(1).map((slot) => slot.name);
  delete slots[0].rect;
  const parsed = recover(original);
  assert.equal(parsed.frames.length, (original.frames as unknown[]).length);
  assert.deepEqual(parsed.frames[0].textSlots.map((slot) => slot.name), expectedNames);
  assert.ok(parsed.notes.length > ((original.notes as string[]).length));
  assert.deepEqual(recover(parsed), parsed);
});

test('보완한 명세를 재파싱·전달해도 작업 해시와 화면의 입력 대응이 유지된다', () => {
  const original = raw();
  delete original.readAt;
  delete original.system;
  delete frameOf(original).imageSlots;
  slotOf(original).color = { hex: '#fff' };
  slotOf(original).budget = { min: 1000, max: 1 };
  const manifest = recover(original);
  const roundTrip = recover(manifest);
  assert.equal(hash(manifest), hash(roundTrip));
  const input: GenerateInput = {
    brandName: '검증 브랜드', primaryColor: '#0055ff', brandMarkdown: '알아보기 쉬운 설명을 제공합니다.',
    sourceContent: '작은 기록을 매일 남기는 방법을 소개합니다.', outline: '', audience: '기록 입문자',
    mustFollow: '', tone: 'friendly', templateMode: 'body', cardCount: 3,
  };
  const identity = { briefId: 'aaf73a2b-9bbc-4a13-b930-aed9691d4fbc', templateHash: hash(manifest) };
  const result: LayoutResult = {
    ...identity, input, manifest,
    deck: { ...identity, schemaVersion: 1, cards: [1, 2, 3].map((id) => ({
      id, background: 'paper', blocks: [{ kind: 'panel', rect: { x: 0, y: 0, width: 100, height: 100 }, color: 'paper' }],
    })) },
  };
  const response = parseLayoutResult(result);
  assert.ok(response.ok, !response.ok ? response.reason : '');
  assert.equal(matchesDraft(response.result, input, roundTrip), true);
  assert.equal(response.result.templateHash, hash(response.result.manifest));
});

test('기본값 보완 후 크기 상한을 넘는 자료는 가져오기 단계에서 거부한다', () => {
  const slot = { characters: '가', rect: { x: 0, y: 0, width: 100, height: 100 } };
  const text = JSON.stringify({ schemaVersion: 1, frames: [{ width: 1080, height: 1350, textSlots: Array(7500).fill(slot) }] });
  assert.ok(Buffer.byteLength(text) < 2 * 1024 * 1024);
  const result = parseManifest(text);
  assert.equal(result.ok, false, '불러오기는 성공하지만 저장·재파싱이 실패하는 자료를 남기지 않는다');
  if (!result.ok) assert.match(result.reason, /크|용량/);
});
