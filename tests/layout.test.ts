import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractTokens } from '../shared/designTokens';
import { parseLayout, validateLayout, type LayoutCard, type LayoutDeck, type Rect } from '../shared/layout';
import type { TemplateManifest } from '../shared/templateManifest';

const manifest = JSON.parse(
  readFileSync(new URL('./fixtures/reference.json', import.meta.url), 'utf8'),
) as TemplateManifest;
const tokens = extractTokens(manifest);

/** 레퍼런스를 지키는 평범한 카드 한 장. 각 테스트가 여기서 한 군데씩 어긋뜨린다. */
function goodCard(): LayoutCard {
  return {
    id: 1,
    background: 'paper',
    blocks: [
      { kind: 'photo', rect: { x: 0, y: 0, width: 1080, height: 700 }, brief: '아침 식탁' },
      { kind: 'rule', rect: { x: 80, y: 800, width: 2, height: 120 }, color: 'accent' },
      {
        kind: 'text', text: '01', rect: { x: 106, y: 800, width: 140, height: 137 },
        fontSize: 115, fontStyle: 'Regular', color: 'accent', align: 'left',
      },
      {
        kind: 'text', text: '아침을 바꾸면\n하루가 바뀐다', rect: { x: 280, y: 810, width: 429, height: 98 },
        fontSize: 41, fontStyle: 'SemiBold', color: 'ink', align: 'left',
      },
      {
        kind: 'text',
        text: '일찍 일어나 냉장고에 있는 재료로 아침을 차려 먹습니다. 거창하지 않아도 됩니다. 계란 하나, 밥 한 공기면 충분합니다. 이 십 분이 하루의 속도를 정합니다. 부엉이형 인간이던 저도 이 루틴 덕분에 아침이 가벼워졌어요.',
        rect: { x: 80, y: 980, width: 901, height: 216 },
        fontSize: 30, fontStyle: 'Regular', color: 'ink', align: 'left',
      },
    ],
  };
}

const deckOf = (...cards: LayoutCard[]): LayoutDeck => ({ schemaVersion: 1, cards });

test('레퍼런스를 지킨 카드는 통과한다', () => {
  const result = validateLayout(deckOf(goodCard()), tokens);
  assert.equal(result.ok, true, JSON.stringify(result.problems, null, 2));
  assert.equal(result.problems.filter((p) => p.severity === 'error').length, 0);
});

test('레퍼런스에 없는 글자 크기는 막는다', () => {
  const card = goodCard();
  // 33px는 레퍼런스 어디에도 없다. 지어낸 크기다.
  (card.blocks[4] as { fontSize: number }).fontSize = 33;
  const result = validateLayout(deckOf(card), tokens);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.code === 'FONT'));
});

test('레퍼런스에 없는 색 역할은 막는다', () => {
  const card = goodCard();
  (card.blocks[3] as { color: string }).color = 'brand' as never;
  const result = validateLayout(deckOf(card), tokens);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.code === 'COLOR'));
});

test('글자가 상자를 넘치면 막는다', () => {
  const card = goodCard();
  const body = card.blocks[4] as { text: string };
  body.text = body.text.repeat(4);
  const result = validateLayout(deckOf(card), tokens);
  assert.equal(result.ok, false);
  const overflow = result.problems.find((p) => p.code === 'OVERFLOW');
  assert.ok(overflow, '넘침을 못 잡았다');
  assert.match(overflow.message, /넘칩니다/);
});

test('상자가 휑하면 경고하되 막지는 않는다', () => {
  const card = goodCard();
  (card.blocks[4] as { text: string }).text = '짧다';
  const result = validateLayout(deckOf(card), tokens);
  // 예전에 58%만 채워 "카드가 비었다"는 말을 들었다. 이제는 잡힌다.
  assert.ok(result.problems.some((p) => p.code === 'SPARSE'));
  assert.equal(result.ok, true, '휑한 건 경고지 오류가 아니다');
});

test('글자끼리 겹치면 막는다', () => {
  const card = goodCard();
  (card.blocks[3] as { rect: Rect }).rect = { x: 106, y: 800, width: 429, height: 98 };
  const result = validateLayout(deckOf(card), tokens);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.code === 'OVERLAP'));
});

test('글자가 사진 위에 오는 건 겹침이 아니다', () => {
  const card = goodCard();
  // 사진 위에 제목을 얹는 건 표지의 기본 구성이다.
  card.blocks.push({
    kind: 'text', text: '나중엔 그리워질\n학교생활', rect: { x: 68, y: 200, width: 628, height: 238 },
    fontSize: 100, fontStyle: 'ExtraBold', color: 'paper', align: 'left',
  });
  const result = validateLayout(deckOf(card), tokens);
  assert.equal(result.problems.some((p) => p.code === 'OVERLAP'), false);
});

test('카드 밖으로 나가면 막는다 — 다만 사진은 재단을 허용한다', () => {
  const out = goodCard();
  (out.blocks[3] as { rect: { y: number } }).rect.y = 1300;
  assert.ok(validateLayout(deckOf(out), tokens).problems.some((p) => p.code === 'BOUNDS'));

  const bleed = goodCard();
  (bleed.blocks[0] as { rect: { width: number } }).rect.width = 1200;
  assert.equal(validateLayout(deckOf(bleed), tokens).problems.some((p) => p.code === 'BOUNDS'), false);
});

test('읽히지 않는 조합은 막는다', () => {
  const card = goodCard();
  // 흰 종이에 흰 글자.
  (card.blocks[4] as { color: string }).color = 'paper';
  const result = validateLayout(deckOf(card), tokens);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.code === 'CONTRAST'));
});

test('색 면 위라면 같은 흰 글자도 통과한다', () => {
  const card = goodCard();
  card.blocks.push(
    { kind: 'panel', rect: { x: 440, y: 190, width: 558, height: 400 }, color: 'accent' },
    {
      kind: 'text', text: '아침에 일찍 일어나서\n아침밥 해먹고 등교하기',
      rect: { x: 480, y: 240, width: 470, height: 98 },
      fontSize: 41, fontStyle: 'SemiBold', color: 'paper', align: 'left',
    },
  );
  const result = validateLayout(deckOf(card), tokens);
  // 파란 면 위의 흰 글자다. 레퍼런스 프레임 38이 정확히 이 구성이다.
  assert.equal(result.problems.some((p) => p.code === 'CONTRAST' && p.severity === 'error'), false);
});

test('레퍼런스의 여백 줄에서 벗어나면 경고한다', () => {
  const card = goodCard();
  // 95px는 왼쪽 가장자리에 붙었는데 68·80·106 어디와도 안 맞는다.
  // 137px처럼 가장자리를 벗어난 값은 "두 번째 단"일 수 있어 보지 않는다 — 레퍼런스의
  // 280px가 실제로 그런 자리다. 여백 규칙은 진짜 가장자리에만 건다.
  (card.blocks[4] as { rect: { x: number } }).rect.x = 95;
  const result = validateLayout(deckOf(card), tokens);
  assert.ok(result.problems.some((p) => p.code === 'MARGIN'));
  assert.equal(result.ok, true, '여백은 범위지 규칙이 아니므로 경고만');
});

test('서명 요소가 한 장에도 없으면 경고한다', () => {
  const card = goodCard();
  card.blocks = card.blocks.filter((block) => block.kind !== 'rule');
  const result = validateLayout(deckOf(card), tokens);
  assert.ok(result.problems.some((p) => p.code === 'SIGNATURE'));
});

test('구조가 깨진 입력은 파싱 단계에서 걸린다', () => {
  assert.equal(parseLayout(null).ok, false);
  assert.equal(parseLayout({ schemaVersion: 2, cards: [] }).ok, false);
  assert.equal(parseLayout({ schemaVersion: 1, cards: [] }).ok, false);
  const bad = parseLayout({
    schemaVersion: 1,
    cards: [{ id: 1, background: 'paper', blocks: [{ kind: 'sticker', rect: { x: 0, y: 0, width: 1, height: 1 } }] }],
  });
  assert.equal(bad.ok, false);
  assert.match(bad.ok === false ? bad.reason : '', /모르는 블록 종류/);
});

test('정상 입력은 파싱을 통과한다', () => {
  const parsed = parseLayout(JSON.parse(JSON.stringify(deckOf(goodCard()))));
  assert.equal(parsed.ok, true);
});

test('밀도는 레퍼런스에서 역산한 값이다', () => {
  assert.ok(tokens.density, '밀도를 얻지 못했다');
  // 지어낸 상수가 아니라 실측 예산 6개에서 나왔다.
  assert.equal(tokens.density.samples, 6);
  // em 단위라 1보다 작다. 글자 수로 세면 1.096이지만 그 모델은 숫자에서 두 배 틀렸다.
  assert.ok(tokens.density.mean > 0.85 && tokens.density.mean < 1.0, `예상 밖: ${tokens.density.mean}`);
  // 넘침 판정에는 최솟값을 쓴다. 평균을 쓰면 후해서 잘려 나가는 걸 통과시킨다.
  assert.ok(tokens.density.safe <= tokens.density.mean);
  // em 모델로 바꾸며 퍼짐이 0.077에서 0.050으로 줄었다. 데이터에 더 맞는다는 뜻이다.
  assert.ok(tokens.density.spread < 0.06, `퍼짐이 너무 크다: ${tokens.density.spread}`);
});
