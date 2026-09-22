import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMarkdownLoader } from '../src/lib/markdownFile';

function deferredFile(name = 'brand.md') {
  let resolve!: (text: string) => void;
  let reject!: (error: Error) => void;
  const pending = new Promise<string>((done, fail) => { resolve = done; reject = fail; });
  return { file: { name, size: 200, text: () => pending }, resolve, reject };
}

function screen() {
  const state = { text: '현재 자료', error: '', reading: true, settled: 0 };
  return {
    state,
    callbacks: () => ({
      onText: (text: string) => { state.text = text; },
      onError: (message: string) => { state.error = message; },
      onSettled: () => { state.reading = false; state.settled += 1; },
    }),
  };
}

test('최신 파일이 먼저 도착하면 이전 파일의 늦은 결과가 내용을 덮지 않는다', async () => {
  const reader = createMarkdownLoader();
  const ui = screen();
  const first = deferredFile('first.md');
  const second = deferredFile('second.md');
  const a = reader.read(first.file, ui.callbacks());
  const b = reader.read(second.file, ui.callbacks());
  second.resolve('최신 파일');
  await b;
  first.resolve('오래된 파일');
  await a;
  assert.equal(ui.state.text, '최신 파일');
  assert.equal(ui.state.settled, 1);
});

test('이전 읽기가 끝나도 최신 파일이 대기 중이면 저장 잠금을 해제하지 않는다', async () => {
  const reader = createMarkdownLoader();
  const ui = screen();
  const first = deferredFile();
  const second = deferredFile();
  const a = reader.read(first.file, ui.callbacks());
  const b = reader.read(second.file, ui.callbacks());
  first.resolve('오래된 파일');
  await a;
  assert.equal(ui.state.reading, true);
  assert.equal(ui.state.text, '현재 자료');
  second.resolve('새 파일');
  await b;
  assert.equal(ui.state.reading, false);
});

test('수동 입력·저장으로 읽기를 취소한 뒤 늦게 도착한 문구를 버린다', async () => {
  const reader = createMarkdownLoader();
  const ui = screen();
  const pending = deferredFile();
  const read = reader.read(pending.file, ui.callbacks());
  reader.cancel();
  ui.state.text = '직접 수정한 최신 자료';
  pending.resolve('이전 파일 내용');
  await read;
  assert.equal(ui.state.text, '직접 수정한 최신 자료');
  assert.equal(ui.state.reading, false);
  assert.equal(ui.state.settled, 1);
});

test('취소한 요청의 읽기 오류가 최신 성공 화면에 남지 않는다', async () => {
  const reader = createMarkdownLoader();
  const ui = screen();
  const first = deferredFile();
  const a = reader.read(first.file, ui.callbacks());
  await reader.read({ name: 'latest.md', size: 20, text: async () => '성공한 자료' }, ui.callbacks());
  first.reject(new Error('오래된 실패'));
  await a;
  assert.equal(ui.state.text, '성공한 자료');
  assert.equal(ui.state.error, '');
});

test('읽기 실패·잘못된 파일은 기존 자료를 보존하고 저장 잠금을 해제한다', async () => {
  for (const file of [
    { name: 'bad.txt', size: 20, text: async () => '문구' },
    { name: 'huge.md', size: 51 * 1024, text: async () => '문구' },
    { name: 'invalid.md', size: 20, text: async () => '�' },
    { name: 'fail.md', size: 20, text: async () => { throw new Error('디스크 오류'); } },
  ]) {
    const ui = screen();
    await createMarkdownLoader().read(file, ui.callbacks());
    assert.equal(ui.state.text, '현재 자료');
    assert.ok(ui.state.error.length > 0);
    assert.equal(ui.state.reading, false);
  }
});
