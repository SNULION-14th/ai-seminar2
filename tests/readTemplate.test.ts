/// <reference types="@figma/plugin-typings" />

import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { readTemplate } from '../figma-plugin/readTemplate';

type Options = {
  autoResize?: 'HEIGHT' | 'WIDTH_AND_HEIGHT';
  mixedProperty?: 'fontName' | 'fills' | 'lineHeight';
  failProbe?: 'characters' | 'name';
  failFont?: boolean;
  staticHeight?: boolean;
  parentType?: 'FRAME' | 'GROUP' | 'SECTION';
};

/** The mock follows the documented clone parent (currentPage), and refuses all original writes. */
function fixture(t: TestContext, options: Options = {}) {
  const mixed = Symbol('mixed');
  const mutations: string[] = [];
  const probes: Array<{
    removed: boolean;
    width: number;
    height: number;
    x: number;
    y: number;
    textAutoResize: string;
    characters: string;
    name: string;
    remove: () => void;
  }> = [];
  const parentChildren: unknown[] = [];
  const page = {
    id: 'page', type: 'PAGE', name: '테스트 페이지', parent: null,
    children: [] as unknown[], selection: [] as unknown[],
  };
  const wrapper = options.parentType ? {
    id: 'wrapper', type: options.parentType, name: '카드 모음', parent: page,
    x: 0, y: 0, width: 1200, height: 1000, children: [] as unknown[],
  } : null;
  const frame = {
    id: 'card', type: 'FRAME', name: '원본 카드', parent: wrapper ?? page,
    layoutMode: 'HORIZONTAL', width: 1000, height: 800, x: 40, y: 60,
    absoluteTransform: [[1, 0, 40], [0, 1, 60]],
    absoluteBoundingBox: { x: 40, y: 60, width: 1000, height: 800 },
    fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
    children: parentChildren,
  };
  const barrier = Object.freeze({
    type: 'RECTANGLE', name: '옆 사진', visible: true,
    absoluteTransform: [[1, 0, 390], [0, 1, 80]],
    absoluteBoundingBox: { x: 390, y: 80, width: 200, height: 300 },
    width: 200, height: 300, fills: [],
  });
  const rangeStyles = Object.freeze([
    { start: 0, end: 2, fontName: { family: 'Test', style: 'Bold' } },
    { start: 2, end: 5, fontName: { family: 'Test', style: 'Regular' } },
  ]);
  const originalData = {
    type: 'TEXT', name: '제목', visible: true, parent: frame,
    width: 80, height: options.autoResize === 'WIDTH_AND_HEIGHT' ? 20 : 40,
    x: 100, y: 20,
    characters: '브랜드 이야기', textAutoResize: options.autoResize ?? 'HEIGHT',
    absoluteTransform: [[1, 0, 140], [0, 1, 80]],
    absoluteBoundingBox: { x: 140, y: 80, width: 80, height: options.autoResize === 'WIDTH_AND_HEIGHT' ? 20 : 40 },
    fontName: { family: 'Test', style: 'Regular' } as unknown,
    fontSize: 20, fontWeight: 400, textStyleId: '',
    fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }] as unknown,
    letterSpacing: { value: 0, unit: 'PIXELS' },
    lineHeight: { value: 20, unit: 'PIXELS' } as unknown,
    paragraphIndent: 0, paragraphSpacing: 0, listSpacing: 0,
    textCase: 'ORIGINAL', textDecoration: 'NONE', leadingTrim: 'NONE',
    textWrapStyle: 'AUTO', openTypeFeatures: {},
    getRangeAllFontNames: () => [{ family: 'Test', style: 'Regular' }],
    getStyledTextSegments: () => rangeStyles,
    resize: () => { mutations.push('resize'); throw new Error('original resize forbidden'); },
    setRangeFontName: () => { mutations.push('range style'); throw new Error('original range style forbidden'); },
    clone: () => {
      assert.deepEqual(frame.children, [original, barrier], 'cloning must not reparent into original auto-layout');
      let text = originalData.characters;
      const probe = {
        removed: false, width: originalData.width, height: originalData.height,
        x: originalData.x, y: originalData.y, textAutoResize: originalData.textAutoResize,
        get name() { return 'probe'; },
        set name(_value: string) {
          if (options.failProbe === 'name') throw new Error('probe setup failed');
        },
        get characters() { return text; },
        set characters(value: string) {
          if (options.failProbe === 'characters') throw new Error('probe write failed');
          text = value;
          if (!options.staticHeight) this.height = Math.ceil([...value].length / Math.floor(this.width / 10)) * 20;
        },
        resize(width: number, height: number) { this.width = width; this.height = height; },
        remove() {
          this.removed = true;
          page.children.splice(page.children.indexOf(this), 1);
        },
      };
      page.children.push(probe);
      probes.push(probe);
      return probe;
    },
  };
  if (options.mixedProperty) originalData[options.mixedProperty] = mixed;
  const original = new Proxy(originalData, {
    set(_target, key) {
      mutations.push(String(key));
      throw new Error(`original ${String(key)} write forbidden`);
    },
  });
  parentChildren.push(original, barrier);
  Object.freeze(parentChildren);
  if (wrapper) {
    wrapper.children.push(frame);
    Object.freeze(wrapper.children);
    Object.freeze(wrapper);
  }
  page.children.push(wrapper ?? frame);
  page.selection.push(frame);
  const originalGlobal = Object.getOwnPropertyDescriptor(globalThis, 'figma');
  Object.defineProperty(globalThis, 'figma', {
    configurable: true,
    value: {
      currentPage: page, root: { name: '원본 파일' }, mixed,
      loadFontAsync: async () => { if (options.failFont) throw new Error('missing font'); },
    },
  });
  t.after(() => {
    if (originalGlobal) Object.defineProperty(globalThis, 'figma', originalGlobal);
    else Reflect.deleteProperty(globalThis, 'figma');
  });
  const checkUnchanged = () => {
    assert.deepEqual(mutations, [], 'the original must never receive even temporary mutations');
    assert.deepEqual(page.children, [wrapper ?? frame], 'all scratch nodes must be removed');
    if (wrapper) {
      assert.deepEqual(wrapper.children, [frame], 'nested frames must remain in their original parent');
      assert.equal(frame.parent, wrapper);
      assert.equal(wrapper.width, 1200);
      assert.equal(wrapper.height, 1000);
    }
    assert.deepEqual(frame.children, [original, barrier]);
    assert.deepEqual(page.selection, [frame]);
    assert.equal(original.characters, '브랜드 이야기');
    assert.equal(original.width, 80);
    assert.equal(original.x, 100);
    assert.equal(original.y, 20);
    assert.equal(original.height, options.autoResize === 'WIDTH_AND_HEIGHT' ? 20 : 40);
    assert.equal(original.textAutoResize, options.autoResize ?? 'HEIGHT');
    assert.equal(original.getStyledTextSegments(), rangeStyles);
    assert.ok(probes.every((probe) => probe.removed));
  };
  return { checkUnchanged, probes, original };
}

test('측정 성공: 원본 문구·범위 서식·크기·자동배치는 수정하지 않고 임시 노드를 제거한다', async (t) => {
  const f = fixture(t);
  const manifest = await readTemplate('2026-09-23T00:00:00Z');
  f.checkUnchanged();
  assert.equal(f.probes.length, 1);
  assert.ok(f.probes[0].x > 1040, 'probe is outside all original page content');
  assert.equal(manifest.notes.length, 0);
  const slot = manifest.frames[0].textSlots[0];
  assert.deepEqual(slot.rect, { x: 100, y: 20, width: 80, height: 40 });
  assert.equal(slot.budget.max, 15);
});

for (const parentType of ['FRAME', 'GROUP', 'SECTION'] as const) {
  test(`${parentType} 안에 직접 선택한 카드 프레임도 읽고 부모·원본을 보존한다`, async (t) => {
    const f = fixture(t, { parentType });
    const manifest = await readTemplate('2026-09-23T00:00:00Z');
    f.checkUnchanged();
    assert.equal(manifest.frames.length, 1);
    assert.equal(manifest.frames[0].frameName, '원본 카드');
    assert.equal(manifest.frames[0].textSlots[0].characters, '브랜드 이야기');
    assert.deepEqual(manifest.frames[0].textSlots[0].rect, { x: 100, y: 20, width: 80, height: 40 });
    assert.equal(f.probes.length, 1);
    assert.ok(f.probes[0].x > 1200, 'probe stays outside the whole parent container');
    assert.equal(manifest.notes.length, 0);
  });
}

test('WIDTH_AND_HEIGHT 폭과 장애물은 임시 작업영역 대신 원본 위치에서 계산한다', async (t) => {
  const f = fixture(t, { autoResize: 'WIDTH_AND_HEIGHT' });
  const manifest = await readTemplate('2026-09-23T00:00:00Z');
  f.checkUnchanged();
  assert.equal(f.probes[0].width, 250, 'photo starts at x350, original text starts at x100');
  const slot = manifest.frames[0].textSlots[0];
  assert.deepEqual(slot.rect, { x: 100, y: 20, width: 80, height: 20 });
  assert.equal(slot.autoResize, 'WIDTH_AND_HEIGHT');
  assert.equal(slot.budget.max, 23);
});

for (const failProbe of ['characters', 'name'] as const) {
  test(`측정 ${failProbe} 실패에도 임시 노드를 제거하고 원문 분량으로 대체한다`, async (t) => {
    const f = fixture(t, { failProbe });
    const manifest = await readTemplate('2026-09-23T00:00:00Z');
    f.checkUnchanged();
    assert.equal(f.probes.length, 1);
    assert.match(manifest.notes[0], /재는 중 문제가 생겨/);
    assert.equal(manifest.frames[0].textSlots[0].budget.max, [...f.original.characters].length);
  });
}

for (const mixedProperty of ['fontName', 'fills', 'lineHeight'] as const) {
  test(`혼합 ${mixedProperty}는 측정하지 않고 원본 서식과 원문 분량을 보존한다`, async (t) => {
    const f = fixture(t, { mixedProperty });
    const manifest = await readTemplate('2026-09-23T00:00:00Z');
    f.checkUnchanged();
    assert.equal(f.probes.length, 0);
    assert.match(manifest.notes[0], /혼합 서식.*측정하지 않았습니다/);
    assert.equal(manifest.frames[0].textSlots[0].mixedStyles, true);
    assert.equal(manifest.frames[0].textSlots[0].budget.max, [...f.original.characters].length);
  });
}

test('폰트 로딩 실패는 원본이나 임시 노드에 쓰지 않는다', async (t) => {
  const f = fixture(t, { failFont: true });
  const manifest = await readTemplate('2026-09-23T00:00:00Z');
  f.checkUnchanged();
  assert.equal(f.probes.length, 0);
  assert.match(manifest.notes[0], /폰트를 불러오지 못해/);
});

test('높이 고정으로 측정할 수 없는 경우에도 임시 노드를 제거한다', async (t) => {
  const f = fixture(t, { staticHeight: true });
  const manifest = await readTemplate('2026-09-23T00:00:00Z');
  f.checkUnchanged();
  assert.equal(f.probes.length, 1);
  assert.match(manifest.notes[0], /상자 높이가 글자 수에 반응하지 않습니다/);
});
