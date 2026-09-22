/// <reference types="@figma/plugin-typings" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectedReferenceFrames } from '../figma-plugin/selection';

type TestNode = {
  id: string;
  type: 'PAGE' | 'FRAME' | 'GROUP' | 'SECTION' | 'RECTANGLE';
  name: string;
  width: number;
  height: number;
  parent: TestNode | null;
  children: TestNode[];
};

function node(id: string, type: TestNode['type'], parent: TestNode | null = null, name = id): TestNode {
  const value: TestNode = { id, type, name, parent, width: 1080, height: 1350, children: [] };
  parent?.children.push(value);
  return value;
}

function select(...nodes: TestNode[]): FrameNode[] {
  return selectedReferenceFrames(nodes as unknown as SceneNode[]);
}

for (const parentType of ['FRAME', 'GROUP', 'SECTION'] as const) {
  test(`directly selected FRAME under ${parentType} is accepted`, () => {
    const page = node('page', 'PAGE');
    const parent = node('parent', parentType, page);
    const card = node('card', 'FRAME', parent);
    assert.deepEqual(select(card), [card]);
  });
}

test('deeply nested frames are accepted without name or size heuristics', () => {
  const page = node('page', 'PAGE');
  const section = node('section', 'SECTION', page);
  const container = node('container', 'FRAME', section);
  const group = node('group', 'GROUP', container);
  const card = node('card', 'FRAME', group, '무제');
  card.width = 50;
  card.height = 70;
  assert.deepEqual(select(card), [card]);
});

test('eight identically named cards preserve the selection order and remain distinct', () => {
  const page = node('page', 'PAGE');
  const container = node('container', 'FRAME', page);
  const cards = Array.from({ length: 8 }, (_, index) => node(`card-${index}`, 'FRAME', container, 'Frame 1'));
  const chosen = [cards[6], cards[1], cards[4], cards[3], cards[0], cards[7], cards[2], cards[5]];
  assert.deepEqual(select(...chosen), chosen);
});

test('duplicate selections return a frame only once', () => {
  const card = node('card', 'FRAME');
  const other = node('other', 'FRAME');
  assert.deepEqual(select(card, other, card, other), [card, other]);
});

test('a selected ancestor frame replaces selected descendants regardless of input order', () => {
  const page = node('page', 'PAGE');
  const parent = node('parent', 'FRAME', page);
  const child = node('child', 'FRAME', parent);
  const grandchild = node('grandchild', 'FRAME', child);
  assert.deepEqual(select(grandchild, child, parent), [parent]);
  assert.deepEqual(select(parent, grandchild, child), [parent]);
  assert.deepEqual(select(grandchild, child), [child]);
});

test('ancestor deduplication follows parents through unselected groups', () => {
  const parent = node('parent', 'FRAME');
  const group = node('group', 'GROUP', parent);
  const child = node('child', 'FRAME', group);
  const other = node('other', 'FRAME');
  assert.deepEqual(select(child, other, parent, group), [other, parent]);
});

test('non-frame selections do not expand groups or sections into cards', () => {
  const group = node('group', 'GROUP');
  const section = node('section', 'SECTION');
  node('inside-group', 'FRAME', group);
  node('inside-section', 'FRAME', section);
  const rectangle = node('rectangle', 'RECTANGLE');
  assert.deepEqual(select(group, section, rectangle), []);
  assert.deepEqual(select(), []);
});

test('a selected non-frame parent does not hide an explicitly selected card', () => {
  const section = node('section', 'SECTION');
  const group = node('group', 'GROUP', section);
  const card = node('card', 'FRAME', group);
  assert.deepEqual(select(section, card, group), [card]);
});
