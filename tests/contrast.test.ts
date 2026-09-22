import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DesignTokens } from '../shared/designTokens';
import { validateLayout, type Block, type LayoutDeck } from '../shared/layout';

const tokens: DesignTokens = {
  cardSize: { width: 1080, height: 1350 },
  palette: [
    { role: 'paper', hex: '#ffffff', uses: 1 },
    { role: 'ink', hex: '#000000', uses: 1 },
  ],
  typeScale: [{ fontSize: 40, fontFamily: 'Test Font', fontStyle: 'Regular', uses: 1, role: 'body' }],
  margins: { min: 0, max: 0, values: [] }, photoColor: null, photoAreaRatio: null,
  signatures: [], density: null, metrics: null, notes: [],
};
const full = { x: 0, y: 0, width: 1080, height: 1350 };
const text: Block = { kind: 'text', text: '읽을 수 있나요', rect: { x: 100, y: 100, width: 300, height: 80 }, fontSize: 40, fontStyle: 'Regular', color: 'paper', align: 'left' };
const check = (...blocks: Block[]) => validateLayout({ schemaVersion: 1, cards: [{ id: 1, background: 'paper', blocks }] } satisfies LayoutDeck, tokens, 'free');

test('흰 바탕의 옅은 검정 막을 불투명 검정으로 오인하지 않는다', () => {
  const result = check({ kind: 'panel', rect: full, color: 'ink', opacity: 0.1 }, text);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((problem) => problem.code === 'CONTRAST' && problem.severity === 'error'));
});

test('여러 반투명 면은 순서대로 합성하며 충분히 어두운 바탕은 허용한다', () => {
  const result = check(
    { kind: 'panel', rect: full, color: 'ink', opacity: 0.5 },
    { kind: 'panel', rect: full, color: 'ink', opacity: 0.5 },
    text,
  );
  assert.equal(result.problems.some((problem) => problem.code === 'CONTRAST'), false);
});

test('사진 위 반투명 막은 실제 사진의 대비를 확인하도록 경고한다', () => {
  const result = check(
    { kind: 'photo', rect: full, brief: '밝기가 알려지지 않은 사진' },
    { kind: 'panel', rect: full, color: 'ink', opacity: 0.3 },
    text,
  );
  assert.ok(result.problems.some((problem) => problem.code === 'SCRIM' && problem.severity === 'warning'));
  const opaque = check(
    { kind: 'photo', rect: full, brief: '사진' },
    { kind: 'panel', rect: full, color: 'ink' },
    text,
  );
  assert.equal(opaque.problems.some((problem) => problem.code === 'SCRIM'), false);
});

test('글자 중심만 덮는 면이 있어도 모서리의 낮은 대비를 잡는다', () => {
  const result = check({ kind: 'panel', rect: { x: 230, y: 90, width: 40, height: 100 }, color: 'ink' }, text);
  assert.ok(result.problems.some((problem) => problem.code === 'CONTRAST' && problem.severity === 'error'));
  assert.ok(result.problems.some((problem) => problem.code === 'BACKGROUND'));
});

test('나중에 놓은 불투명 면과 사진이 글자 전체를 덮으면 차단한다', () => {
  for (const covering of [
    { kind: 'panel', rect: full, color: 'ink' },
    { kind: 'photo', rect: full, brief: '사진' },
  ] as Block[]) {
    const result = check({ kind: 'panel', rect: full, color: 'ink' }, text, covering);
    assert.ok(result.problems.some((problem) => problem.code === 'OCCLUDED' && problem.severity === 'error'));
  }
});

test('나중의 부분 가림과 반투명 가림은 확인 경고로 남긴다', () => {
  for (const covering of [
    { kind: 'panel', rect: full, color: 'paper', opacity: 0.5 },
    { kind: 'panel', rect: { x: 380, y: 100, width: 60, height: 80 }, color: 'paper' },
  ] as Block[]) {
    const result = check({ kind: 'panel', rect: full, color: 'ink' }, text, covering);
    assert.ok(result.problems.some((problem) => problem.code === 'OCCLUDED' && problem.severity === 'warning'));
  }
});


test('앞의 부분 가림 경고가 뒤의 전체 가림 오류를 숨기지 않는다', () => {
  const result = check(
    { kind: 'panel', rect: full, color: 'ink' }, text,
    { kind: 'panel', rect: full, color: 'paper', opacity: 0.2 },
    { kind: 'photo', rect: full, brief: '글자 전체를 가리는 사진' },
  );
  assert.equal(result.problems.filter((problem) => problem.code === 'OCCLUDED').length, 1);
  assert.ok(result.problems.some((problem) => problem.code === 'OCCLUDED' && problem.severity === 'error'));
});

test('장식 밑줄은 일부 글자 상자와 겹쳐도 가림으로 판정하지 않는다', () => {
  const result = check(
    { kind: 'panel', rect: full, color: 'ink' }, text,
    { kind: 'rule', rect: { x: 100, y: 178, width: 300, height: 2 }, color: 'paper' },
  );
  assert.equal(result.problems.some((problem) => problem.code === 'OCCLUDED'), false);
});

test('일부 배경이 나중의 불투명 면으로 완전히 덮이면 배경 변화 경고를 지운다', () => {
  const result = check(
    { kind: 'photo', rect: { x: 90, y: 90, width: 150, height: 100 }, brief: '작은 사진' },
    { kind: 'panel', rect: full, color: 'ink' }, text,
  );
  assert.equal(result.problems.some((problem) => problem.code === 'SCRIM' || problem.code === 'BACKGROUND'), false);
});
