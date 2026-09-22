import { isRecord, type GenerateInput } from '../../shared/contracts';
import type { TemplateManifest } from '../../shared/templateManifest';
import { hasIdentity, parseLayoutResult, sameIdentity, type BriefIdentity, type LayoutResult } from '../../shared/workflow';

/**
 * 브라우저와 에이전트 사이의 다리.
 *
 * 브라우저는 디스크에 못 쓰고, 에이전트는 브라우저 안을 못 본다. 그래서 파일로 주고받는다.
 * 모델을 부르는 코드는 여기 없다. 부르는 건 사람이 대화로 한다.
 */

export type BriefSaved = BriefIdentity & { saved: string; cards: number; reference: string; frames: number };

/** 작업 불일치와 연결 오류를 구분해 안전한 복구 동작만 안내한다. */
export class LayoutLoadError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'LayoutLoadError';
    this.status = status;
  }
}

async function post(path: string, body: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('개발 서버에 연결하지 못했습니다. npm run dev 가 떠 있는지 확인해 주세요.');
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `저장에 실패했습니다. (HTTP ${response.status})`;
    throw new Error(message);
  }
  return payload;
}

/** 입력과 레퍼런스를 brief/latest.json으로 남긴다. 그다음은 에이전트에게 말하면 된다. */
export async function saveBrief(input: GenerateInput, manifest: TemplateManifest): Promise<BriefSaved> {
  const payload = await post('/api/brief', { input, manifest: JSON.stringify(manifest) });
  if (!isRecord(payload) || !hasIdentity(payload) || typeof payload.saved !== 'string'
    || typeof payload.cards !== 'number' || typeof payload.reference !== 'string' || typeof payload.frames !== 'number') {
    throw new Error('저장된 작업 정보를 읽지 못했습니다. 개발 서버를 재시작하고 다시 저장해 주세요.');
  }
  return payload as BriefSaved;
}

/** 에이전트가 brief/layout.json에 남긴 배치를 가져온다. 아직 없으면 null. */
export async function loadLayout(expected?: BriefIdentity): Promise<LayoutResult | null> {
  let response: Response;
  try {
    const query = expected ? `?${new URLSearchParams({ briefId: expected.briefId, templateHash: expected.templateHash })}` : '';
    response = await fetch(`/api/layout${query}`, { cache: 'no-store' });
  } catch {
    throw new Error('개발 서버에 연결하지 못했습니다.');
  }
  if (response.status === 404) return null;
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new LayoutLoadError(isRecord(payload) && typeof payload.error === 'string'
      ? payload.error : `결과를 읽지 못했습니다. (HTTP ${response.status})`, response.status);
  }
  const parsed = parseLayoutResult(payload);
  if (!parsed.ok) throw new Error(parsed.reason);
  if (expected && !sameIdentity(parsed.result, expected)) throw new LayoutLoadError('다른 작업의 결과입니다. 최신 저장 결과를 확인하거나 현재 입력으로 다시 만들어 주세요.', 409);
  return parsed.result;
}
