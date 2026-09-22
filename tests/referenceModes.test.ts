import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBrief } from '../shared/brief';
import { TEMPLATE_MODES, validateGenerateInput, type GenerateInput } from '../shared/contracts';
import { describeReferenceMode, isReferenceKeptCard, normalizeReferenceMode } from '../shared/referenceModes';
import type { TemplateManifest } from '../shared/templateManifest';
import { loadInput } from '../src/lib/persist';

const manifest = JSON.parse(
  readFileSync(new URL('./fixtures/reference.json', import.meta.url), 'utf8'),
) as TemplateManifest;
const input: GenerateInput = {
  brandName: '하루', primaryColor: '#0055ff', brandMarkdown: '기록을 돕는 브랜드입니다.',
  sourceContent: '일주일을 기록하는 방법을 소개하고 직접 써보게 합니다.', outline: '',
  audience: '기록을 시작하는 대학생', mustFollow: '', tone: 'friendly', templateMode: 'strict', cardCount: 5,
};
const identity = { briefId: 'c8811e5e-7617-4a33-b64e-18e771a80c56', templateHash: 'a'.repeat(64) };

test('입력은 세 가지 레퍼런스 방식만 허용한다', () => {
  for (const templateMode of TEMPLATE_MODES) {
    const result = validateGenerateInput({ ...input, templateMode });
    assert.ok(result.success);
    assert.equal(result.data.templateMode, templateMode);
  }
  assert.equal(validateGenerateInput({ ...input, templateMode: 'reference' }).success, false);
  assert.equal(validateGenerateInput({ ...input, templateMode: 'unknown' }).success, false);
});

test('본문 재구성은 3장과 10장 모두 첫 장·끝 장만 유지한다', () => {
  for (const count of [3, 10]) {
    for (let index = 0; index < count; index += 1) {
      assert.equal(isReferenceKeptCard('strict', index, count), true);
      assert.equal(isReferenceKeptCard('body', index, count), index === 0 || index === count - 1);
      assert.equal(isReferenceKeptCard('free', index, count), false);
    }
  }
});

test('레퍼런스와 요청 장수가 달라도 배열의 첫·끝 프레임을 유지 대상으로 명시한다', () => {
  const frames = [{ frameName: '99 표지' }, { frameName: '5 본문' }, { frameName: '1 마무리' }];
  const prompt = describeReferenceMode('body', 7, frames);
  assert.match(prompt, /1장\(표지\): 첫 프레임 “99 표지”의 배치·형식 유지/);
  assert.match(prompt, /7장\(마무리\): 마지막 프레임 “1 마무리”의 배치·형식 유지/);
  for (let id = 2; id < 7; id += 1) {
    assert.ok(prompt.includes(`${id}장(본문): 사진·글자·정보의 구성을 새로 설계`));
  }
  const oneFrame = describeReferenceMode('body', 3, [{ frameName: '유일한 카드' }]);
  assert.match(oneFrame, /첫 프레임 “유일한 카드”/);
  assert.match(oneFrame, /마지막 프레임 “유일한 카드”/);
});

test('모드별 브리프가 구성 범위와 자유를 지시하며 작업 식별자를 보존한다', () => {
  const strict = buildBrief(input, manifest, '2026-09-22T00:00:00Z', identity);
  const body = buildBrief({ ...input, templateMode: 'body' }, manifest, strict.savedAt, identity);
  const free = buildBrief({ ...input, templateMode: 'free' }, manifest, strict.savedAt, identity);
  assert.match(strict.prompt, /선택한 방식: 레퍼런스 유지/);
  assert.equal((strict.prompt.match(/의 배치·형식 유지/g) ?? []).length, 5);
  assert.equal((body.prompt.match(/의 배치·형식 유지/g) ?? []).length, 2);
  assert.equal((free.prompt.match(/사진·글자·정보의 구성을 새로 설계/g) ?? []).length, 5);
  assert.doesNotMatch(free.prompt, /의 배치·형식 유지/);
  for (const brief of [body, free]) {
    assert.match(brief.prompt, /문구나 사진만 교체하는 것은 재구성이 아닙니다/);
    assert.match(brief.prompt, /원본 여백 값·사진 면적 비율·서명 요소·상자 채움 비율을 강제하지 않습니다/);
    assert.match(brief.prompt, /채움 하한이 없습니다/);
    assert.match(brief.prompt, /2단 비교/);
    assert.match(brief.prompt, /고정 프리셋이나 필수 목록이 아닙니다/);
    assert.match(brief.prompt, /꼭 지킬 것[\s\S]*브랜드 자료/);
    assert.equal(brief.briefId, identity.briefId);
    assert.equal(brief.templateHash, identity.templateHash);
    assert.ok(brief.prompt.includes(`"briefId": "${identity.briefId}"`));
    assert.ok(brief.prompt.includes(`"templateHash": "${identity.templateHash}"`));
  }
});

test('예전 참고용 모드와 알 수 없는 저장값을 안전하게 마이그레이션한다', (context) => {
  assert.equal(normalizeReferenceMode('reference'), 'strict');
  assert.equal(normalizeReferenceMode('strict'), 'strict');
  assert.equal(normalizeReferenceMode('body'), 'body');
  assert.equal(normalizeReferenceMode('free'), 'free');
  assert.equal(normalizeReferenceMode(undefined), 'strict');
  assert.equal(normalizeReferenceMode('unknown', 'body'), 'body');

  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let saved: string | null = null;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true, value: { getItem: () => saved },
  });
  context.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });

  for (const [stored, expected] of [['reference', 'strict'], ['strict', 'strict'], ['body', 'body'], ['free', 'free'], ['unknown', 'strict']]) {
    saved = JSON.stringify({ brandName: '저장된 브랜드', templateMode: stored });
    const restored = loadInput(input);
    assert.equal(restored.templateMode, expected);
    assert.equal(restored.brandName, '저장된 브랜드');
  }
  saved = JSON.stringify({ templateMode: 'unknown' });
  assert.equal(loadInput({ ...input, templateMode: 'free' }).templateMode, 'free');
  saved = '{broken json';
  assert.equal(loadInput(input).templateMode, 'strict');
  saved = null;
  assert.deepEqual(loadInput(input), input);
});
