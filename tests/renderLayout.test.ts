/// <reference types="@figma/plugin-typings" />

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test, type TestContext } from 'node:test';
import { runInNewContext } from 'node:vm';
import { renderLayout } from '../figma-plugin/renderLayout';
import { redraw } from '../figma-plugin/redraw';
import type { DesignTokens } from '../shared/designTokens';
import type { LayoutDeck, TextBlock } from '../shared/layout';

const tokens: DesignTokens = {
  cardSize: { width: 300, height: 400 },
  palette: [{ role: 'paper', hex: '#ffffff', uses: 1 }, { role: 'ink', hex: '#000000', uses: 1 }],
  typeScale: [{ fontFamily: 'Test', fontSize: 20, fontStyle: 'Regular', role: 'body', uses: 1 }],
  margins: { min: 20, max: 20, values: [20] }, photoColor: null, photoAreaRatio: null,
  signatures: [], density: null, metrics: null, notes: [],
};
const textBlock = (changes: Partial<TextBlock> = {}): TextBlock => ({
  kind: 'text', text: '제목', rect: { x: 20, y: 20, width: 200, height: 30 },
  fontSize: 20, fontStyle: 'Regular', color: 'ink', align: 'left', ...changes,
});
const deckFor = (...blocks: TextBlock[]): LayoutDeck => ({ schemaVersion: 1, cards: [{ id: 1, background: 'paper', blocks }] });

type Options = { actualHeight?: number; failCharacters?: boolean; failFont?: boolean };
function installGlobal(t: TestContext, key: string, value: unknown): void {
  const before = Object.getOwnPropertyDescriptor(globalThis, key);
  Object.defineProperty(globalThis, key, { configurable: true, value });
  t.after(() => {
    if (before) Object.defineProperty(globalThis, key, before);
    else Reflect.deleteProperty(globalThis, key);
  });
}

function fixture(t: TestContext, options: Options = {}) {
  class Node {
    name = ''; x = 0; y = 0; width = 100; height = 100; removed = false;
    parent: Node | null = null;
    children: Node[] = [];
    textAutoResize = 'NONE';
    lineHeight: unknown = { unit: 'AUTO' };
    private text = '';
    readonly type: string;
    constructor(type: string) { this.type = type; }
    get characters() { return this.text; }
    set characters(value: string) {
      if (options.failCharacters) throw new Error('text setter failed');
      this.text = value;
    }
    appendChild(node: Node) {
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
      this.children.push(node);
      node.parent = this;
    }
    resize(width: number, height: number) {
      this.width = width;
      this.height = this.type === 'TEXT' && this.textAutoResize === 'HEIGHT' ? options.actualHeight ?? 24 : height;
    }
    setPluginData() {}
    remove() {
      for (const child of [...this.children]) child.remove();
      this.parent?.children.splice(this.parent.children.indexOf(this), 1);
      this.parent = null;
      this.removed = true;
    }
  }
  const page = new Node('PAGE');
  const original = new Node('FRAME');
  original.name = '원본'; original.x = 10; original.y = 40;
  page.appendChild(original);
  const created: Node[] = [];
  const create = (type: string) => {
    const node = new Node(type);
    created.push(node);
    page.appendChild(node);
    return node;
  };
  installGlobal(t, 'figma', {
    currentPage: page,
    createFrame: () => create('FRAME'), createText: () => create('TEXT'), createRectangle: () => create('RECTANGLE'),
    loadFontAsync: async () => { if (options.failFont) throw new Error('missing font'); },
  });
  const checkClean = () => {
    assert.deepEqual(page.children, [original]);
    assert.equal(original.name, '원본');
    assert.equal(original.x, 10); assert.equal(original.y, 40);
    assert.equal(original.removed, false);
    assert.ok(created.every((node) => node.removed), 'all newly created nodes, including the unfinished card, must be removed');
  };
  return { page, original, created, checkClean };
}

test('render uses real font metrics and preserves the original', async (t) => {
  const { page, original, created } = fixture(t);
  const result = await renderLayout(deckFor(textBlock()), tokens, {});
  assert.equal(result.result.created, 1);
  assert.equal(page.children.length, 2);
  assert.equal(page.children[0], original);
  assert.equal(original.x, 10);
  assert.equal(result.group.children.length, 1);
  assert.deepEqual(created.find((node) => node.type === 'TEXT')?.lineHeight, { unit: 'AUTO' });
});

test('explicit line height is kept for the real Figma measurement', async (t) => {
  const { created } = fixture(t);
  await renderLayout(deckFor(textBlock({ lineHeight: 100 })), tokens, {});
  assert.deepEqual(created.find((node) => node.type === 'TEXT')?.lineHeight, { value: 100, unit: 'PERCENT' });
});

test('text taller than its allocated rectangle cancels and cleans the entire run', async (t) => {
  const { checkClean } = fixture(t, { actualHeight: 48 });
  const deck = deckFor(textBlock({ rect: { x: 20, y: 20, width: 200, height: 60 } }));
  deck.cards.push({ id: 2, background: 'paper', blocks: [textBlock()] });
  await assert.rejects(renderLayout(deck, tokens, {}), /2번 카드.*실제 높이.*넘습니다/);
  checkClean();
});

test('text outside the card cancels and removes generated frames', async (t) => {
  const { checkClean } = fixture(t);
  await assert.rejects(renderLayout(deckFor(textBlock({ rect: { x: 20, y: 390, width: 200, height: 30 } })), tokens, {}), /카드 밖/);
  checkClean();
});

test('actual text box overlap cancels and cleans every created node', async (t) => {
  const { checkClean } = fixture(t);
  await assert.rejects(renderLayout(deckFor(textBlock(), textBlock({ rect: { x: 40, y: 30, width: 200, height: 30 } })), tokens, {}), /겹칩니다/);
  checkClean();
});

test('failure while configuring a text node does not orphan the card or text', async (t) => {
  const { checkClean } = fixture(t, { failCharacters: true });
  await assert.rejects(renderLayout(deckFor(textBlock()), tokens, {}), /text setter failed/);
  checkClean();
});

test('missing fonts fail before any canvas changes', async (t) => {
  const { checkClean, created } = fixture(t, { failFont: true });
  await assert.rejects(renderLayout(deckFor(textBlock()), tokens, {}), /쓸 수 없는 글꼴/);
  assert.equal(created.length, 0);
  checkClean();
});

test('redraw also removes text nodes that fail before configuration finishes', async (t) => {
  const { checkClean } = fixture(t, { failCharacters: true });
  await assert.rejects(redraw({
    schemaVersion: 1, readAt: '2026-09-22', fileName: 'Test', pageName: 'Page', notes: [],
    system: { colors: [], typeScale: [], margins: [], cardSize: { width: 300, height: 400 } },
    frames: [{ frameName: 'Card', width: 300, height: 400, background: null, shapes: [], imageSlots: [],
      textSlots: [{ nodePath: [0], name: 'Text', characters: '제목', rect: { x: 20, y: 20, width: 200, height: 30 },
        fontSize: 20, fontFamily: 'Test', fontStyle: 'Regular', autoResize: 'HEIGHT', budget: { min: 1, max: 10 },
        mixedStyles: false, color: null, letterSpacing: { value: 0, unit: 'PIXELS' }, lineHeight: 'auto' }] }],
  }), /text setter failed/);
  checkClean();
});

test('plugin serializes asynchronous operations and waits before allowing close', async (t) => {
  let finishExport: (value: Uint8Array) => void = () => {};
  const exportPromise = new Promise<Uint8Array>((resolve) => { finishExport = resolve; });
  let calls = 0;
  let closed = 0;
  const messages: Array<{ type: string; busy?: boolean; count?: number }> = [];
  const ui = { postMessage: (message: { type: string; busy?: boolean }) => { messages.push(message); }, onmessage: async (_message: unknown) => {} };
  installGlobal(t, '__html__', '');
  installGlobal(t, 'figma', {
    showUI() {}, on() {}, root: { name: 'Test' }, ui,
    closePlugin() { closed += 1; },
    currentPage: { name: 'Page', selection: [{ type: 'FRAME', name: 'Card', children: [], width: 300, height: 400,
      parent: { type: 'FRAME', parent: { type: 'PAGE', parent: null } },
      exportAsync: () => { calls += 1; return exportPromise; } }] },
  });
  await import('../figma-plugin/code');
  assert.equal(messages.find((message) => message.type === 'selection')?.count, 1, 'nested card remains selectable');
  const first = ui.onmessage({ type: 'exportCards' });
  await ui.onmessage({ type: 'exportCards' });
  await ui.onmessage({ type: 'readTemplate' });
  await ui.onmessage({ type: 'cancel' });
  assert.equal(calls, 1);
  assert.equal(closed, 0);
  finishExport(new Uint8Array([1]));
  await first;
  assert.deepEqual(messages.at(-1), { type: 'busy', busy: false });
  await ui.onmessage({ type: 'cancel' });
  assert.equal(closed, 1);
});

test('plugin UI enables selected frames and explains malformed cards instead of crashing', async () => {
  const html = await readFile(new URL('../figma-plugin/ui.html', import.meta.url), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  type Element = { value: string; textContent: string; disabled: boolean; className: string; innerHTML: string; hidden: boolean; handlers: Record<string, () => void>; addEventListener: (kind: string, handler: () => void) => void; appendChild: () => void; append: () => void };
  const elements = new Map<string, Element>();
  const element = (id: string): Element => {
    if (!elements.has(id)) elements.set(id, { value: '', textContent: '', disabled: false, className: '', innerHTML: '', hidden: false, handlers: {},
      addEventListener(kind, handler) { this.handlers[kind] = handler; }, appendChild() {}, append() {} });
    return elements.get(id)!;
  };
  const context = { document: { getElementById: element, createElement: () => element('new') }, parent: { postMessage() {} },
    onmessage: (_event: { data: { pluginMessage: { type: string; count: number; total: number; names: string[] } } }) => {} };
  runInNewContext(script, context);
  for (const count of [8, 2]) {
    context.onmessage({ data: { pluginMessage: { type: 'selection', count, total: count, names: ['카드 1080×1350'] } } });
    assert.equal(element('read').disabled, false);
    assert.match(element('selectionInfo').textContent, new RegExp(`프레임 ${count}개`));
    assert.doesNotMatch(element('selectionInfo').textContent, /카드 안쪽 묶음/);
  }
  for (const cards of [{}, [null], [{ id: 1, blocks: {} }], [{ id: 1, blocks: [null] }], [{ id: 1, blocks: [{ kind: 'text', text: 42 }] }]]) {
    element('payload').value = JSON.stringify({ kind: 'cardnews', deck: { cards }, manifest: {} });
    assert.doesNotThrow(() => element('payload').handlers.input());
    assert.equal(element('run').disabled, true);
    assert.match(element('message').textContent, /형식이 올바르지/);
  }
});
