import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { test, type TestContext } from 'node:test';
import type { Connect, ViteDevServer } from 'vite';
import { briefPlugin } from '../vite-brief';
import type { Brief } from '../shared/brief';
import type { GenerateInput } from '../shared/contracts';
import { parseManifest, type TemplateManifest } from '../shared/templateManifest';
import { hasIdentity, type BriefIdentity, type JobLayout, type LayoutResult } from '../shared/workflow';

const manifest = JSON.parse(readFileSync(new URL('./fixtures/reference.json', import.meta.url), 'utf8')) as TemplateManifest;
const input: GenerateInput = {
  brandName: '브랜드 A',
  primaryColor: '#0055ff',
  brandMarkdown: '친절하고 정확하게 설명하는 브랜드',
  sourceContent: '처음 시작하는 사람에게 작은 습관을 만드는 방법을 소개합니다.',
  outline: '',
  audience: '처음 접하는 사람',
  mustFollow: '',
  tone: 'friendly',
  templateMode: 'body',
  cardCount: 3,
};

type Reply = { status: number; body: Record<string, unknown>; headers: Record<string, string> };

async function fixture(t: TestContext) {
  const root = await mkdtemp(join(tmpdir(), 'cardnews-brief-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const handlers: { path: string; handler: Connect.NextHandleFunction }[] = [];
  const server = {
    config: { root, server: { host: 'localhost', port: 5173 }, logger: { info() {} } },
    middlewares: {
      use(pathOrHandler: string | Connect.NextHandleFunction, handler?: Connect.NextHandleFunction) {
        if (typeof pathOrHandler === 'function') handlers.push({ path: '', handler: pathOrHandler });
        else {
          assert.ok(handler);
          handlers.push({ path: pathOrHandler, handler });
        }
      },
    },
  };
  const hook = briefPlugin().configureServer;
  assert.equal(typeof hook, 'function');
  if (typeof hook !== 'function') throw new Error('configureServer hook missing');
  await hook.call({} as never, server as unknown as ViteDevServer);

  function request(path: string, method: string, body?: unknown, requestHeaders: Record<string, string> = {}): Promise<Reply> {
    return new Promise((resolve, reject) => {
      const stream = new PassThrough();
      const req = Object.assign(stream, {
        method,
        url: path,
        originalUrl: path,
        headers: { host: 'localhost:5173', 'content-type': 'application/json', ...requestHeaders },
        socket: { encrypted: false },
      }) as unknown as Connect.IncomingMessage;
      const headers: Record<string, string> = {};
      const response = {
        statusCode: 200,
        setHeader(name: string, value: string) { headers[name] = value; },
        end(text = '{}') {
          let parsed: Record<string, unknown>;
          try { parsed = JSON.parse(text) as Record<string, unknown>; }
          catch { parsed = { error: text }; }
          resolve({ status: this.statusCode, headers, body: parsed });
        },
      };
      let index = 0;
      const next: Connect.NextFunction = (error) => {
        if (error) { reject(error); return; }
        req.url = path;
        const pathname = new URL(path, 'http://localhost').pathname;
        while (index < handlers.length) {
          const entry = handlers[index++];
          if (entry.path && pathname !== entry.path && !pathname.startsWith(`${entry.path}/`)) continue;
          req.url = entry.path ? path.slice(entry.path.length) || '/' : path;
          if (req.url.startsWith('?')) req.url = `/${req.url}`;
          entry.handler(req, response as unknown as ServerResponse, next);
          return;
        }
        response.statusCode = 404;
        response.end();
      };
      next();
      stream.end(body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body));
    });
  }

  async function save(nextInput = input, nextManifest = manifest): Promise<BriefIdentity> {
    const reply = await request('/api/brief', 'POST', { input: nextInput, manifest: JSON.stringify(nextManifest) });
    assert.equal(reply.status, 200, JSON.stringify(reply.body));
    assert.ok(hasIdentity(reply.body));
    return { briefId: reply.body.briefId, templateHash: reply.body.templateHash };
  }

  async function writeLayout(identity: BriefIdentity, count = input.cardCount): Promise<JobLayout> {
    const deck: JobLayout = {
      ...identity,
      schemaVersion: 1,
      cards: Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        background: 'paper',
        blocks: [{ kind: 'panel', rect: { x: 0, y: 0, width: 1080, height: 1080 }, color: 'paper' }],
      })),
    };
    await writeFile(join(root, 'brief/layout.json'), JSON.stringify(deck));
    return deck;
  }

  async function readBrief(): Promise<Brief> {
    return JSON.parse(await readFile(join(root, 'brief/latest.json'), 'utf8')) as Brief;
  }

  return { root, request, save, writeLayout, readBrief };
}

test('새 브리프 저장 후 이전 결과를 거부하고 새 작업의 스냅샷만 돌려준다', async (t) => {
  const api = await fixture(t);
  const jobA = await api.save();
  const deckA = await api.writeLayout(jobA);
  const first = await api.request('/api/layout', 'GET');
  assert.equal(first.status, 200);
  assert.equal(first.headers['Cache-Control'], 'no-store');
  assert.deepEqual(first.body.deck, deckA);
  assert.deepEqual(first.body.manifest, manifest);
  assert.deepEqual(first.body.input, input);

  const nextInput = { ...input, brandName: '브랜드 B', cardCount: 7 };
  const jobB = await api.save(nextInput);
  assert.notEqual(jobA.briefId, jobB.briefId);
  assert.equal(jobA.templateHash, jobB.templateHash);
  const stale = await api.request('/api/layout', 'GET');
  assert.equal(stale.status, 409);
  assert.match(String(stale.body.error), /최신 브리프/);
  // 이전 결과를 삭제하거나 새 식별자로 덮어 씌우지 않는다.
  assert.deepEqual(JSON.parse(await readFile(join(api.root, 'brief/layout.json'), 'utf8')), deckA);

  await api.writeLayout(jobB, 7);
  const current = await api.request('/api/layout', 'GET');
  assert.equal(current.status, 200);
  const result = current.body as unknown as LayoutResult;
  assert.equal(result.briefId, jobB.briefId);
  assert.equal(result.deck.cards.length, 7);
  assert.deepEqual(result.input, nextInput);

  const oldTab = await api.request(`/api/layout?briefId=${jobA.briefId}&templateHash=${jobA.templateHash}`, 'GET');
  assert.equal(oldTab.status, 409);
  const currentTab = await api.request(`/api/layout?briefId=${jobB.briefId}&templateHash=${jobB.templateHash}`, 'GET');
  assert.equal(currentTab.status, 200);
});

test('동일 입력을 다시 저장해도 새 작업 ID를 만들고 프롬프트와 파일에 같은 식별자를 쓴다', async (t) => {
  const api = await fixture(t);
  const first = await api.save();
  const second = await api.save();
  assert.notEqual(first.briefId, second.briefId);
  assert.equal(first.templateHash, second.templateHash);
  const brief = await api.readBrief();
  assert.equal(brief.briefId, second.briefId);
  assert.equal(brief.templateHash, second.templateHash);
  assert.ok(brief.prompt.includes(`"briefId": "${second.briefId}"`));
  assert.ok(brief.prompt.includes(`"templateHash": "${second.templateHash}"`));
  assert.deepEqual(await readdir(join(api.root, 'brief')), ['latest.json']);
});

test('레퍼런스의 변경은 해시를 바꾸고 JSON 키 순서 변경은 바꾸지 않는다', async (t) => {
  const api = await fixture(t);
  const original = await api.save();
  const reordered = Object.fromEntries(Object.entries(manifest).reverse()) as TemplateManifest;
  const same = await api.save(input, reordered);
  assert.equal(original.templateHash, same.templateHash);
  const changed = await api.save(input, { ...manifest, fileName: '새 레퍼런스' });
  assert.notEqual(original.templateHash, changed.templateHash);
});

test('식별자 없는 기존 결과와 해시가 다른 결과를 받아들이지 않는다', async (t) => {
  const api = await fixture(t);
  const identity = await api.save();
  const deck = await api.writeLayout(identity);
  await writeFile(join(api.root, 'brief/layout.json'), JSON.stringify({ schemaVersion: 1, cards: deck.cards }));
  assert.equal((await api.request('/api/layout', 'GET')).status, 409);
  await api.writeLayout({ ...identity, templateHash: '0'.repeat(64) });
  assert.equal((await api.request('/api/layout', 'GET')).status, 409);
});

test('기존 형식의 브리프는 재생성을 안내하며 자동으로 수정하지 않는다', async (t) => {
  const api = await fixture(t);
  const identity = await api.save();
  await api.writeLayout(identity);
  const brief = await api.readBrief();
  const legacy = { savedAt: brief.savedAt, input: brief.input, manifest: brief.manifest, prompt: brief.prompt };
  const path = join(api.root, 'brief/latest.json');
  const text = JSON.stringify(legacy);
  await writeFile(path, text);
  const reply = await api.request('/api/layout', 'GET');
  assert.equal(reply.status, 409);
  assert.match(String(reply.body.error), /다시 저장/);
  assert.equal(await readFile(path, 'utf8'), text);
});

test('저장 후 브리프의 레퍼런스가 바뀌면 무결성 오류를 반환한다', async (t) => {
  const api = await fixture(t);
  const identity = await api.save();
  await api.writeLayout(identity);
  const brief = await api.readBrief();
  brief.manifest.fileName = '몰래 바뀐 레퍼런스';
  await writeFile(join(api.root, 'brief/latest.json'), JSON.stringify(brief));
  const reply = await api.request('/api/layout', 'GET');
  assert.equal(reply.status, 409);
  assert.match(String(reply.body.error), /저장 후 변경/);
});

test('카드 장수와 번호 순서가 브리프에 맞지 않으면 결과를 거부한다', async (t) => {
  const api = await fixture(t);
  const identity = await api.save();
  await api.writeLayout(identity, 1);
  assert.equal((await api.request('/api/layout', 'GET')).status, 422);
  const deck = await api.writeLayout(identity);
  deck.cards[1].id = 1;
  await writeFile(join(api.root, 'brief/layout.json'), JSON.stringify(deck));
  assert.equal((await api.request('/api/layout', 'GET')).status, 422);
});

test('아직 없는 결과, 미완성 JSON, 구조 오류, 파일 접근 오류를 구분한다', async (t) => {
  const api = await fixture(t);
  assert.equal((await api.request('/api/layout', 'GET')).status, 404);
  const identity = await api.save();
  assert.equal((await api.request('/api/layout', 'GET')).status, 404);
  const path = join(api.root, 'brief/layout.json');
  await writeFile(path, '{"schemaVersion":');
  assert.equal((await api.request('/api/layout', 'GET')).status, 422);
  await writeFile(path, JSON.stringify({ ...identity, schemaVersion: 1, cards: [null] }));
  assert.equal((await api.request('/api/layout', 'GET')).status, 422);
  await rm(path);
  await mkdir(path);
  assert.equal((await api.request('/api/layout', 'GET')).status, 500);
});

test('일부 식별자만 있는 조회와 잘못된 저장 요청은 기존 브리프를 보존한다', async (t) => {
  const api = await fixture(t);
  const identity = await api.save();
  assert.equal((await api.request(`/api/layout?briefId=${identity.briefId}`, 'GET')).status, 400);
  assert.equal((await api.request('/api/brief', 'POST', '{')).status, 400);
  assert.equal((await api.request('/api/brief', 'POST', { input: {}, manifest: JSON.stringify(manifest) })).status, 400);
  assert.equal((await api.readBrief()).briefId, identity.briefId);
});

test('동시 저장에도 latest.json에는 완성된 작업 하나만 남고 임시 파일을 정리한다', async (t) => {
  const api = await fixture(t);
  const jobs = await Promise.all(Array.from({ length: 8 }, (_, index) => api.save({ ...input, brandName: `동시 작업 ${index}` })));
  const brief = await api.readBrief();
  const index = jobs.findIndex((job) => job.briefId === brief.briefId);
  assert.ok(index >= 0);
  assert.equal(brief.input.brandName, `동시 작업 ${index}`);
  assert.ok(brief.prompt.includes(brief.briefId));
  assert.equal(new Set(jobs.map((job) => job.briefId)).size, 8);
  assert.deepEqual(await readdir(join(api.root, 'brief')), ['latest.json']);
});

test('외부 Origin·Host·null Origin·cross-site 요청은 브리프를 덮어쓰지 못한다', async (t) => {
  const api = await fixture(t);
  const original = await api.save();
  const body = { input: { ...input, brandName: '외부 요청' }, manifest: JSON.stringify(manifest) };
  const cases: Record<string, string>[] = [
    { origin: 'https://example.com' },
    { origin: 'http://localhost:8080' },
    { origin: 'null' },
    { host: 'example.com:5173' },
    { 'sec-fetch-site': 'cross-site' },
  ];
  for (const headers of cases) {
    const reply = await api.request('/api/brief', 'POST', body, headers);
    assert.equal(reply.status, 403, JSON.stringify(headers));
    assert.equal((await api.readBrief()).briefId, original.briefId);
  }
});

test('동일 Origin 브라우저와 Origin 없는 로컬 CLI는 브리프를 저장할 수 있다', async (t) => {
  const api = await fixture(t);
  const body = { input, manifest: JSON.stringify(manifest) };
  const browser = await api.request('/api/brief', 'POST', body, {
    origin: 'http://localhost:5173',
    'sec-fetch-site': 'same-origin',
  });
  assert.equal(browser.status, 200, JSON.stringify(browser.body));
  assert.ok(hasIdentity(browser.body));
  const cli = await api.request('/api/brief', 'POST', body);
  assert.equal(cli.status, 200, JSON.stringify(cli.body));
  assert.ok(hasIdentity(cli.body));
  assert.notEqual(browser.body.briefId, cli.body.briefId);
});

test('브리프·렌더·환경 파일은 일반 경로와 /@fs 경로 모두 직접 제공하지 않는다', async (t) => {
  const api = await fixture(t);
  await api.save();
  const paths = [
    '/brief/latest.json',
    '/renders/x.png',
    '/.env',
    '/.env.local',
    `/@fs/${api.root}/brief/latest.json`,
    `/@fs/${api.root}/renders/x.png`,
    `/@fs/${api.root}/.env`,
    '/%62rief/latest.json',
    '/brief/latest.json?raw',
  ];
  for (const path of paths) {
    const reply = await api.request(path, 'GET');
    assert.equal(reply.status, 403, path);
    assert.equal('input' in reply.body, false);
  }
});

test('크기 제한을 넘는 요청은 거부하고 기존 브리프를 보존한다', async (t) => {
  const api = await fixture(t);
  const original = await api.save();
  const reply = await api.request('/api/brief', 'POST', ' '.repeat(5 * 1024 * 1024 + 1));
  assert.equal(reply.status, 413);
  assert.equal((await api.readBrief()).briefId, original.briefId);
});

test('일부 정보가 빠진 레퍼런스도 저장 후 같은 작업의 결과를 다시 불러온다', async (t) => {
  const api = await fixture(t);
  const partial = JSON.parse(JSON.stringify(manifest)) as Record<string, unknown>;
  delete partial.system;
  delete partial.readAt;
  const frame = (partial.frames as Record<string, unknown>[])[0];
  delete frame.shapes;
  delete (frame.textSlots as Record<string, unknown>[])[0].budget;
  const saved = await api.request('/api/brief', 'POST', { input, manifest: JSON.stringify(partial) });
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.ok(hasIdentity(saved.body));
  const brief = await api.readBrief();
  assert.equal(brief.templateHash, saved.body.templateHash);
  assert.ok(brief.manifest.notes.length > manifest.notes.length);
  await api.writeLayout(saved.body);
  const result = await api.request(`/api/layout?briefId=${saved.body.briefId}&templateHash=${saved.body.templateHash}`, 'GET');
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.deepEqual(result.body.manifest, brief.manifest);
  assert.equal(result.body.briefId, saved.body.briefId);
});

test('허용 크기의 레퍼런스는 JSON 문자열 이중 인코딩 후에도 저장할 수 있다', async (t) => {
  const api = await fixture(t);
  const parsed = parseManifest(JSON.stringify({ schemaVersion: 1, frames: [{ width: 1080, height: 1350,
    textSlots: Array.from({ length: 6000 }, () => ({ characters: '문구', rect: { x: 0, y: 0, width: 100, height: 50 } })),
  }] }));
  assert.ok(parsed.ok, !parsed.ok ? parsed.reason : '');
  const payload = JSON.stringify({ input, manifest: JSON.stringify(parsed.manifest) });
  assert.ok(Buffer.byteLength(JSON.stringify(parsed.manifest)) < 2 * 1024 * 1024);
  assert.ok(Buffer.byteLength(payload) > 2 * 1024 * 1024);
  const saved = await api.request('/api/brief', 'POST', payload);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.ok(hasIdentity(saved.body));
});
