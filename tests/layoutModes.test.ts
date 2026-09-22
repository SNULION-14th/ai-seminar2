import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { extractTokens } from '../shared/designTokens';
import { validateLayout, type LayoutDeck } from '../shared/layout';
import type { TemplateManifest } from '../shared/templateManifest';

const manifest = JSON.parse(readFileSync(new URL('./fixtures/reference.json', import.meta.url), 'utf8')) as TemplateManifest;
const tokens = extractTokens(manifest);
const deck: LayoutDeck = {
  schemaVersion: 1,
  cards: [1, 2, 3].map((id) => ({
    id, background: 'paper', blocks: [
      { kind: 'photo', rect: { x: 700, y: 300, width: 150, height: 150 }, brief: '작은 사진' },
      { kind: 'text', text: '여백', rect: { x: 95, y: 700, width: 600, height: 216 }, fontSize: 30, fontStyle: 'Regular', color: 'ink', align: 'left' },
    ],
  })),
};

test('재구성할 장에는 원본 여백·사진면적·글자밀도 권장을 강요하지 않는다', () => {
  const referenceCodes = new Set(['MARGIN', 'PHOTO_AREA', 'SPARSE']);
  for (const mode of ['strict', 'body', 'free'] as const) {
    const check = validateLayout(deck, tokens, mode);
    assert.equal(check.ok, true);
    for (const id of [1, 2, 3]) {
      const warnings = check.problems.filter((p) => p.cardId === id && referenceCodes.has(p.code));
      assert.equal(warnings.length > 0, mode === 'strict' || (mode === 'body' && id !== 2));
    }
    assert.equal(check.problems.some((p) => p.code === 'SIGNATURE'), mode !== 'free');
  }
});

test('자유 배치에서도 넘침·겹침·대비·판형 검사는 유지한다', () => {
  const bad = structuredClone(deck);
  for (const card of bad.cards) {
    card.blocks.push(
      { kind: 'text', text: '가'.repeat(1000), rect: { x: 95, y: 700, width: 600, height: 50 }, fontSize: 30, fontStyle: 'Regular', color: 'paper', align: 'left' },
      { kind: 'panel', rect: { x: -10, y: -10, width: 20, height: 20 }, color: 'accent' },
    );
  }
  for (const mode of ['strict', 'body', 'free'] as const) {
    const check = validateLayout(bad, tokens, mode);
    assert.equal(check.ok, false);
    for (const code of ['OVERFLOW', 'OVERLAP', 'CONTRAST', 'BOUNDS']) {
      assert.ok(check.problems.some((p) => p.code === code && p.severity === 'error'), `${mode}: ${code}`);
    }
  }
});
