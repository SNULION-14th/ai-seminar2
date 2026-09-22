import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colorFor, contrast, extractTokens } from '../shared/designTokens';
import type { TemplateManifest } from '../shared/templateManifest';

/**
 * 지어낸 데이터로 재면 아무것도 못 잡는다. 사용자가 실제 Figma 파일에서 읽어 온 명세를 쓴다.
 * 이 파일 덕분에 "옆에 사진이 있는데 프레임 끝까지 쓸 수 있다고 착각하던" 결함을 찾았다.
 */
const manifest = JSON.parse(
  readFileSync(new URL('./fixtures/reference.json', import.meta.url), 'utf8'),
) as TemplateManifest;

test('사진 자리는 IMAGE 채우기가 아니라 반복되는 회색 사각형에서 찾는다', () => {
  const tokens = extractTokens(manifest);
  // 진짜 이미지는 로고 둘뿐이다. 사진 자리는 전부 #d9d9d9 도형이다.
  assert.equal(tokens.photoColor, '#d9d9d9');
  assert.equal(colorFor(tokens, 'photo'), '#d9d9d9');
});

test('색이 역할로 갈린다 — 종이·잉크·강조', () => {
  const tokens = extractTokens(manifest);
  assert.equal(colorFor(tokens, 'paper'), '#ffffff');
  assert.equal(colorFor(tokens, 'ink'), '#000000');
  assert.equal(colorFor(tokens, 'accent'), '#0055ff');
});

test('표지 한 장에만 쓰인 배경색은 강조색으로 승격되지 않는다', () => {
  const tokens = extractTokens(manifest);
  // #9f9f9f는 표지 배경 한 번뿐이다. 브랜드색이 아니다.
  const grey = tokens.palette.find((entry) => entry.hex === '#9f9f9f');
  assert.equal(grey?.role, 'other');
});

test('폰트 위계는 이름이 아니라 크기 비율로 나뉜다', () => {
  const tokens = extractTokens(manifest);
  const roleOf = (size: number, style: string) =>
    tokens.typeScale.find((entry) => entry.fontSize === size && entry.fontStyle === style)?.role;

  // 30이 본문이다. 가장 작으면서 여러 번 쓰였다.
  assert.equal(roleOf(30, 'Regular'), 'body');
  // 같은 크기의 굵은 글자도 본문 급이다. 굵기는 강조지 위계가 아니다.
  assert.equal(roleOf(30, 'Bold'), 'body');
  // 41은 본문보다 크지만 두 배는 아니다.
  assert.equal(roleOf(41, 'SemiBold'), 'heading');
  // 115·100·90은 본문의 두 배를 넘는다.
  assert.equal(roleOf(115, 'Regular'), 'display');
  assert.equal(roleOf(100, 'ExtraBold'), 'display');
  assert.equal(roleOf(90, 'Bold'), 'display');
});

test('서명 요소 — 번호 옆 2px 파란 세로선을 찾아낸다', () => {
  const tokens = extractTokens(manifest);
  const rule = tokens.signatures.find((item) => item.fill === '#0055ff' && item.orientation === 'vertical');
  assert.ok(rule, '반복되는 파란 세로선을 찾지 못했다');
  assert.equal(rule.thickness, 2);
  // 35·36·37·38 네 카드에 있다. 35에는 둘이지만 카드 수로 센다.
  assert.equal(rule.frames, 4);
  assert.deepEqual(rule.length, { min: 110, max: 120 });
});

test('한 카드에만 있는 막대는 서명이 아니다', () => {
  const tokens = extractTokens(manifest);
  // 표지의 흰 7px 막대는 그 카드 것이다.
  assert.equal(tokens.signatures.some((item) => item.fill === '#ffffff'), false);
});

test('여백은 고정값이 아니라 범위다. 전폭(0)은 여백이 아니다', () => {
  const tokens = extractTokens(manifest);
  assert.deepEqual(tokens.margins.values, [68, 80, 106]);
  assert.equal(tokens.margins.min, 68);
  assert.equal(tokens.margins.max, 106);
});

test('사진은 카드의 큰 면적을 차지한다', () => {
  const tokens = extractTokens(manifest);
  assert.ok(tokens.photoAreaRatio, '사진 면적을 재지 못했다');
  // 가장 작은 사진이 360×480 = 12%, 가장 큰 것이 1080×721 = 53%.
  assert.ok(tokens.photoAreaRatio.min >= 0.1, `너무 작다: ${tokens.photoAreaRatio.min}`);
  assert.ok(tokens.photoAreaRatio.max >= 0.5, `너무 작다: ${tokens.photoAreaRatio.max}`);
});

test('대비비는 취향이 아니라 계산이다', () => {
  // 흰 바탕의 검은 글자는 최대 대비다.
  assert.equal(contrast('#ffffff', '#000000'), 21);
  // 흰 바탕의 브랜드 파랑은 본문에도 쓸 수 있다(AA 기준 4.5 이상).
  // 감마 보정을 빼먹으면 여기가 2.91로 나와 멀쩡한 브랜드색이 반려된다.
  const blueOnWhite = contrast('#ffffff', '#0055ff');
  assert.ok(blueOnWhite >= 4.5, `본문에 못 쓰는 색으로 잘못 계산됨: ${blueOnWhite}`);
  // 회색 사진 자리 위의 흰 글자는 읽히지 않는다. 사진 없이 그대로 두면 안 된다는 뜻이다.
  assert.ok(contrast('#d9d9d9', '#ffffff') < 1.5);
});

test('레퍼런스가 비어도 터지지 않는다', () => {
  const empty: TemplateManifest = {
    schemaVersion: 1,
    readAt: '2026-09-22T00:00:00.000Z',
    fileName: '빈 파일',
    pageName: '페이지',
    frames: [],
    notes: [],
    system: { colors: [], typeScale: [], margins: [], cardSize: { width: 0, height: 0 } },
  };
  const tokens = extractTokens(empty);
  assert.equal(tokens.photoColor, null);
  assert.equal(tokens.signatures.length, 0);
  assert.equal(tokens.margins.min, 0);
  // 못 찾았으면 조용히 넘어가지 않고 이유를 남긴다.
  assert.equal(tokens.notes.length, 2);
});
