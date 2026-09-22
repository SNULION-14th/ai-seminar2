import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import { clearTimeout, setTimeout } from 'node:timers';
import type { Plugin } from 'vite';
import { buildBrief } from './shared/brief';
import { isRecord, validateGenerateInput } from './shared/contracts';
import { MAX_MANIFEST_BYTES, parseManifest } from './shared/templateManifest';
import {
  hasIdentity,
  parseJobLayout,
  sameIdentity,
  stableStringify,
  type BriefIdentity,
  type LayoutResult,
} from './shared/workflow';

/** 로컬 개발 서버와 파일을 읽는 에이전트 사이의 작업 전달 통로. */
const BRIEF_PATH = 'brief/latest.json';
const LAYOUT_PATH = 'brief/layout.json';
// 명세 문자열을 JSON에 넣으면 따옴표·역슬래시가 이중 인코딩된다. 명세 한도와 요청 한도를 구분한다.
const MAX_BYTES = MAX_MANIFEST_BYTES * 2 + 1024 * 1024;

class RequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function send(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

function readBody(stream: IncomingMessage): Promise<string> {
  return new Promise((done, fail) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;
    const reject = (error: unknown) => {
      if (settled) return;
      settled = true;
      chunks.length = 0;
      clearTimeout(timeout);
      fail(error);
    };
    const timeout = setTimeout(() => reject(new RequestError(408, '입력 전송 시간이 초과되었습니다. 다시 저장해 주세요.')), 30_000);
    stream.on('data', (chunk: Buffer) => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_BYTES) reject(new RequestError(413, '입력이 너무 큽니다.'));
      else chunks.push(chunk);
    });
    stream.on('end', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      done(Buffer.concat(chunks).toString('utf8'));
    });
    stream.on('aborted', () => reject(new RequestError(400, '입력 전송이 중단되었습니다.')));
    stream.on('error', reject);
  });
}

/** 로컬 UI와 CLI만 허용한다. 외부 웹페이지가 개발 서버의 파일을 덮어쓸 수 없게 한다. */
function checkRequest(request: IncomingMessage): void {
  const host = request.headers.host;
  if (typeof host !== 'string' || !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/i.test(host)) {
    throw new RequestError(403, '로컬 주소로만 접근할 수 있습니다.');
  }
  const origin = request.headers.origin;
  if (origin !== undefined && origin !== `http://${host}`) {
    throw new RequestError(403, '다른 웹페이지에서는 로컬 작업에 접근할 수 없습니다.');
  }
  const site = request.headers['sec-fetch-site'];
  if (site !== undefined && site !== 'same-origin' && site !== 'none') {
    throw new RequestError(403, '다른 웹페이지에서는 로컬 작업에 접근할 수 없습니다.');
  }
}

/** .gitignore는 HTTP 접근을 막지 않는다. /@fs·인코딩 경로에도 같은 제한을 적용한다. */
function privatePath(url: string): boolean {
  let pathname = url.split('?')[0];
  try {
    for (let i = 0; i < 2; i += 1) pathname = decodeURIComponent(pathname);
  } catch {
    throw new RequestError(400, '요청 경로 형식이 올바르지 않습니다.');
  }
  return pathname.replaceAll('\\', '/').split('/').some((part) =>
    ['brief', 'renders', '.git', '.codex', '.claude', '.gemini', '.mcp.json'].includes(part.toLowerCase())
    || /^\.env(?:\.|$)/i.test(part) || /(?:_token\.txt|\.(?:pem|key|crt))$/i.test(part));
}

function parseJson(text: string, status: number, message: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new RequestError(status, message);
  }
}

function templateHash(manifest: unknown): string {
  return createHash('sha256').update(stableStringify(manifest)).digest('hex');
}

function expectedIdentity(url: string | undefined): BriefIdentity | undefined {
  const params = new URL(url ?? '/', 'http://localhost').searchParams;
  if (!params.has('briefId') && !params.has('templateHash')) return undefined;
  const identity = { briefId: params.get('briefId'), templateHash: params.get('templateHash') };
  if (!hasIdentity(identity)) throw new RequestError(400, '확인할 브리프 식별자가 올바르지 않습니다.');
  return identity;
}

async function readCurrentBrief(root: string) {
  const value = parseJson(
    await readFile(resolve(root, BRIEF_PATH), 'utf8'),
    422,
    '브리프 파일의 JSON을 읽지 못했습니다. 브리프를 다시 저장해 주세요.',
  );
  if (!hasIdentity(value)) {
    throw new RequestError(409, '이전 형식의 브리프입니다. 브리프를 다시 저장하고 새 결과를 생성해 주세요.');
  }
  const fields = value as BriefIdentity & Record<string, unknown>;
  const input = validateGenerateInput(fields.input);
  const manifest = parseManifest(JSON.stringify(fields.manifest) ?? 'null');
  if (!input.success || !manifest.ok) {
    throw new RequestError(422, '브리프 입력 또는 레퍼런스 명세가 올바르지 않습니다. 브리프를 다시 저장해 주세요.');
  }
  if (templateHash(manifest.manifest) !== value.templateHash) {
    throw new RequestError(409, '브리프의 레퍼런스가 저장 후 변경되었습니다. 브리프를 다시 저장해 주세요.');
  }
  return {
    briefId: value.briefId,
    templateHash: value.templateHash,
    input: input.data,
    manifest: manifest.manifest,
  };
}

async function saveAtomically(file: string, text: string, briefId: string): Promise<void> {
  const temporary = `${file}.${briefId}.tmp`;
  try {
    await writeFile(temporary, text, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, file);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

function sendError(response: ServerResponse, error: unknown, fallback: string) {
  if (error instanceof RequestError) send(response, error.status, { error: error.message });
  else if (isRecord(error) && error.code === 'ENOENT') send(response, 404, { error: '아직 브리프 또는 결과 파일이 없습니다.' });
  else send(response, 500, { error: fallback });
}

export function briefPlugin(): Plugin {
  return {
    name: 'cardnews-brief',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        try {
          checkRequest(request);
          const pathname = (request.url ?? '/').split('?')[0];
          if (pathname !== '/api/brief' && privatePath(pathname)) {
            throw new RequestError(403, '이 파일은 웹으로 제공하지 않습니다.');
          }
          next();
        } catch (error) {
          sendError(response, error, '요청을 처리하지 못했습니다.');
        }
      });
      server.middlewares.use('/api/layout', (request, response, next) => {
        if (request.method !== 'GET') {
          next();
          return;
        }
        void (async () => {
          try {
            const expected = expectedIdentity(request.url);
            const brief = await readCurrentBrief(server.config.root);
            if (expected && !sameIdentity(expected, brief)) {
              throw new RequestError(409, '다른 브리프가 저장되었습니다. 현재 입력으로 브리프를 다시 저장해 주세요.');
            }
            const value = parseJson(
              await readFile(resolve(server.config.root, LAYOUT_PATH), 'utf8'),
              422,
              '결과 JSON이 완성되지 않았거나 형식이 잘못되었습니다. 생성을 마친 뒤 다시 불러와 주세요.',
            );
            if (!hasIdentity(value) || !sameIdentity(value, brief)) {
              throw new RequestError(409, '현재 브리프에 해당하는 결과가 아닙니다. 최신 브리프로 결과를 다시 생성해 주세요.');
            }
            const layout = parseJobLayout(value);
            if (!layout.ok) throw new RequestError(422, `결과 형식이 올바르지 않습니다: ${layout.reason}`);
            if (layout.deck.cards.length !== brief.input.cardCount || layout.deck.cards.some((card, index) => card.id !== index + 1)) {
              throw new RequestError(422, `결과는 카드 ${brief.input.cardCount}장이며 번호가 1부터 순서대로 있어야 합니다.`);
            }
            // 읽는 중 다른 탭에서 새 브리프를 저장했다면 이전 결과를 응답하지 않는다.
            const current = await readCurrentBrief(server.config.root);
            if (!sameIdentity(current, brief) || stableStringify(current) !== stableStringify(brief)) {
              throw new RequestError(409, '결과를 읽는 동안 브리프가 변경되었습니다. 다시 불러와 주세요.');
            }
            const result: LayoutResult = { ...brief, deck: layout.deck };
            send(response, 200, result);
          } catch (error) {
            sendError(response, error, '결과 파일을 읽지 못했습니다. 파일 접근 권한을 확인해 주세요.');
          }
        })();
      });

      server.middlewares.use('/api/brief', (request, response, next) => {
        if (request.method !== 'POST') {
          next();
          return;
        }
        void (async () => {
          try {
            if (request.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
              throw new RequestError(415, 'JSON 형식으로 전송해 주세요.');
            }
            const payload = parseJson(await readBody(request), 400, '입력 JSON 형식이 올바르지 않습니다.');
            if (!isRecord(payload) || typeof payload.manifest !== 'string') {
              throw new RequestError(400, '레퍼런스 명세가 없습니다. 먼저 레퍼런스를 읽어 주세요.');
            }
            const manifest = parseManifest(payload.manifest);
            if (!manifest.ok) throw new RequestError(400, `레퍼런스 명세를 읽지 못했습니다: ${manifest.reason}`);
            const input = validateGenerateInput(payload.input);
            if (!input.success) {
              send(response, 400, { error: '입력을 확인해 주세요.', fields: input.errors });
              return;
            }
            const identity: BriefIdentity = { briefId: randomUUID(), templateHash: templateHash(manifest.manifest) };
            const brief = buildBrief(input.data, manifest.manifest, new Date().toISOString(), identity);
            await mkdir(resolve(server.config.root, 'brief'), { recursive: true });
            await saveAtomically(resolve(server.config.root, BRIEF_PATH), JSON.stringify(brief, null, 2), identity.briefId);
            server.config.logger.info(`[brief] ${BRIEF_PATH} · 카드 ${input.data.cardCount}장`);
            send(response, 200, {
              ...identity,
              saved: BRIEF_PATH,
              cards: input.data.cardCount,
              reference: manifest.manifest.fileName,
              frames: manifest.manifest.frames.length,
            });
          } catch (error) {
            sendError(response, error, '브리프를 저장하지 못했습니다. 파일 접근 권한을 확인해 주세요.');
          }
        })();
      });
    },
  };
}
