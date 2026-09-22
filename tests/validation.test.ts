import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { extractTokens } from '../shared/designTokens';
import { parseLayout, type LayoutDeck } from '../shared/layout';
import { parseManifest, summarize, type TemplateManifest } from '../shared/templateManifest';

const fixture = readFileSync(new URL('./fixtures/reference.json', import.meta.url), 'utf8');
const reference = () => JSON.parse(fixture) as TemplateManifest;
const validDeck = (): LayoutDeck => ({ schemaVersion: 1, cards: [{ id: 1, background: 'paper', blocks: [
  { kind: 'text', text: '검증 문구', rect: { x: 40, y: 60, width: 300, height: 80 }, fontSize: 40, fontStyle: 'Regular', color: 'ink', align: 'left' },
] }] });

test('완전한 레퍼런스는 파싱 후 요약과 디자인 규칙 추출까지 안전하다', () => {
  const parsed = parseManifest(fixture);
  assert.equal(parsed.ok, true, !parsed.ok ? parsed.reason : '');
  if (!parsed.ok) return;
  assert.ok(summarize(parsed.manifest).frames > 0);
  assert.ok(extractTokens(parsed.manifest).palette.length > 0);
});

test('누락된 선택 구조와 디자인 시스템은 복구해 사용할 수 있다', () => {
  const mutations: Array<(value: Record<string, unknown>) => void> = [
    (value) => { delete value.system; },
    (value) => { (value.frames as Record<string, unknown>[])[0].shapes = undefined; },
    (value) => { (value.frames as Record<string, unknown>[])[0].imageSlots = null; },
    (value) => { (value.system as Record<string, unknown>).colors = {}; },
    (value) => { (value.system as Record<string, unknown>).cardSize = { width: 0, height: 1350 }; },
  ];
  for (const mutate of mutations) {
    const value = JSON.parse(fixture) as Record<string, unknown>;
    mutate(value);
    const result = parseManifest(JSON.stringify(value));
    assert.equal(result.ok, true, !result.ok ? result.reason : '');
    if (result.ok) {
      assert.doesNotThrow(() => summarize(result.manifest));
      assert.doesNotThrow(() => extractTokens(result.manifest));
    }
  }
});

test('사용할 프레임과 판형이 없거나 지원하지 않는 명세는 거부한다', () => {
  for (const width of [0, -1, 9000, Infinity, NaN]) {
    const value = reference();
    value.frames[0].width = width;
    assert.equal(parseManifest(JSON.stringify(value)).ok, false);
  }
  assert.equal(parseManifest('{"schemaVersion":1,"frames":[{"frameName":"x","textSlots":[]}]}').ok, false);
  assert.equal(parseManifest('{"schemaVersion":1,"frames":[]}').ok, false);
  assert.equal(parseManifest('{"schemaVersion":2,"frames":[]}').ok, false);
  assert.equal(parseManifest('{broken json').ok, false);
  assert.equal(parseManifest(fixture.replace('1080', '1e999')).ok, false, 'JSON 숫자 overflow도 차단');
});

test('명세는 프레임 수와 실제 UTF-8 바이트 상한을 적용한다', () => {
  const value = reference();
  value.frames = Array.from({ length: 101 }, () => value.frames[0]);
  assert.equal(parseManifest(JSON.stringify(value)).ok, false);
  const unicode = reference();
  unicode.notes = Array.from({ length: 80 }, () => '가'.repeat(10_000));
  const text = JSON.stringify(unicode);
  assert.ok(text.length < 2 * 1024 * 1024);
  const result = parseManifest(text);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /너무 큽니다/);
});

test('배치의 누락된 색·정렬, NaN, Infinity, 잘못된 글자 및 크기를 차단한다', () => {
  const mutations: Array<(block: Record<string, unknown>) => void> = [
    (block) => { delete block.color; },
    (block) => { block.color = 'invented'; },
    (block) => { delete block.align; },
    (block) => { block.align = 'justify'; },
    (block) => { block.align = ['left']; },
    (block) => { block.fontSize = NaN; },
    (block) => { block.fontSize = Infinity; },
    (block) => { block.fontSize = 0; },
    (block) => { block.fontStyle = ''; },
    (block) => { block.lineHeight = NaN; },
    (block) => { block.rect = { x: 0, y: 0, width: 0, height: 20 }; },
    (block) => { block.text = ' '; },
    (block) => { block.text = '가'.repeat(10_001); },
  ];
  for (const mutate of mutations) {
    const value = validDeck();
    mutate(value.cards[0].blocks[0] as unknown as Record<string, unknown>);
    assert.equal(parseLayout(value).ok, false);
  }
  const panel = validDeck();
  panel.cards[0].blocks = [{ kind: 'panel', rect: { x: 0, y: 0, width: 100, height: 100 }, color: 'ink', opacity: NaN }];
  assert.equal(parseLayout(panel).ok, false);
});

test('배치의 중복 id·빈 블록·자원 한도를 차단하되 한 장 검사는 허용한다', () => {
  const valid = validDeck();
  assert.equal(parseLayout(valid).ok, true);
  assert.equal(parseLayout({ ...valid, cards: [valid.cards[0], valid.cards[0]] }).ok, false);
  for (const id of [0, -1, 1.2, NaN, Infinity]) {
    assert.equal(parseLayout({ ...valid, cards: [{ ...valid.cards[0], id }] }).ok, false);
  }
  assert.equal(parseLayout({ ...valid, cards: [{ ...valid.cards[0], background: 'invented' }] }).ok, false);
  assert.equal(parseLayout({ ...valid, cards: [{ ...valid.cards[0], blocks: [] }] }).ok, false);
  assert.equal(parseLayout({ ...valid, cards: [{ ...valid.cards[0], blocks: Array(201).fill(valid.cards[0].blocks[0]) }] }).ok, false);
  assert.equal(parseLayout({ ...valid, cards: Array.from({ length: 11 }, (_, index) => ({ ...valid.cards[0], id: index + 1 })) }).ok, false);
});


test('잘못된 레퍼런스 열거형은 보완하고 잘못된 배치 종류는 거부한다', () => {
  const value = JSON.parse(fixture) as Record<string, unknown>;
  const frame = (value.frames as Record<string, unknown>[])[0];
  const slot = (frame.textSlots as Record<string, unknown>[])[0];
  slot.autoResize = { toString: {} };
  const recovered = parseManifest(JSON.stringify(value));
  assert.equal(recovered.ok, true);
  if (recovered.ok) assert.equal(recovered.manifest.frames[0].textSlots[0].autoResize, 'NONE');
  const deck = validDeck();
  (deck.cards[0].blocks[0] as unknown as Record<string, unknown>).kind = { toString: {} };
  assert.equal(parseLayout(deck).ok, false);
});
