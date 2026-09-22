import { extractTokens } from '../shared/designTokens';
import { parseLayout, validateLayout } from '../shared/layout';
import { parseManifest } from '../shared/templateManifest';
import { normalizeReferenceMode } from '../shared/referenceModes';
import { exportCards } from './exportCards';
import { readTemplate } from './readTemplate';
import { redraw } from './redraw';
import { renderLayout } from './renderLayout';
import { selectedReferenceFrames } from './selection';

/**
 * 플러그인 본체. 이 파일이 하는 일은 셋뿐이다.
 *
 *   ① 레퍼런스 읽기 — 이미 만들어 둔 카드뉴스를 명세로 바꿔 내보낸다
 *   ② 카드 만들기   — 에이전트가 짠 배치를 그린다
 *   ③ 내보내기      — 만든 카드를 PNG로 뽑는다
 *
 * 앞서 있던 두 경로(코드에 박아 둔 배치로 그리기, 원본 프레임 복제하기)는 걷어냈다.
 * 전자는 개발자 취향이 디자인으로 굳은 자리였고, 후자는 매번 같은 카드만 나왔다.
 */

/** 카드 번호(문자열) → 이미지 바이트. 구조화 복제가 Uint8Array를 지원한다. */
type PhotoBytes = Record<string, Uint8Array>;

type UiMessage =
  | { type: 'renderLayout'; deck: unknown; manifest: string; referenceMode?: unknown; photos?: PhotoBytes }
  | { type: 'readTemplate' }
  | { type: 'redraw'; manifest: string }
  | { type: 'exportCards' }
  | { type: 'cancel' };

/**
 * Figma가 띄우는 오류 대화상자는 내용을 복사할 수가 없다. 무슨 일이 났는지 알 방법이 없으면
 * 고칠 수도 없다. 그래서 모든 오류를 우리 창 안에 선택 가능한 글자로 띄운다.
 */
function crash(where: 'read' | 'make', error: unknown): void {
  const detail = error instanceof Error ? `${error.message}\n\n${error.stack ?? ''}`.trim() : String(error);
  console.error('[카드뉴스]', detail);
  figma.ui.postMessage({ type: 'failed', where, message: detail });
}

figma.showUI(__html__, { width: 420, height: 560, themeColors: true });
figma.ui.postMessage({ type: 'context', fileName: figma.root.name, pageName: figma.currentPage.name });

function reportSelection(): void {
  const cards = selectedReferenceFrames(figma.currentPage.selection);
  figma.ui.postMessage({
    type: 'selection',
    count: cards.length,
    total: figma.currentPage.selection.length,
    names: cards.slice(0, 5).map((node) => `${node.name} ${Math.round(node.width)}×${Math.round(node.height)}`),
  });
}
reportSelection();
figma.on('selectionchange', reportSelection);

const handleMessage = async (message: UiMessage): Promise<void> => {
  if (message.type === 'renderLayout') {
    const report = (text: string) => figma.ui.postMessage({ type: 'progress', where: 'make', text });

    // 레퍼런스가 있어야 색 역할과 글꼴을 풀 수 있다. 배치만으로는 그릴 수가 없다.
    const manifest = parseManifest(message.manifest);
    if (!manifest.ok) {
      crash('make', new Error(`레퍼런스 명세를 읽지 못했습니다: ${manifest.reason}`));
      return;
    }
    const parsed = parseLayout(message.deck);
    if (!parsed.ok) {
      crash('make', new Error(`배치를 읽지 못했습니다: ${parsed.reason}`));
      return;
    }

    // 웹앱에서 이미 봤더라도 여기서 한 번 더 본다. 붙여넣는 사이에 무엇이든 바뀔 수 있다.
    const tokens = extractTokens(manifest.manifest);
    const check = validateLayout(parsed.deck, tokens, normalizeReferenceMode(message.referenceMode));
    const blocking = check.problems.filter((problem) => problem.severity === 'error');
    if (blocking.length > 0) {
      crash('make', new Error(
        `배치에 문제가 ${blocking.length}건 있어 그리지 않았습니다.\n\n` +
          blocking.map((problem) => `· ${problem.cardId}번 카드: ${problem.message}`).join('\n'),
      ));
      return;
    }

    const { group, result } = await renderLayout(parsed.deck, tokens, message.photos ?? {}, report);
    figma.currentPage.selection = [group];
    figma.viewport.scrollAndZoomIntoView([group]);
    figma.notify(`카드 ${result.created}장을 만들었습니다.`);
    const warnings = check.problems
      .filter((problem) => problem.severity === 'warning')
      .map((problem) => `${problem.cardId}번 카드: ${problem.message}`);
    figma.ui.postMessage({ type: 'built', created: result.created, problems: [...result.problems, ...warnings] });
    return;
  }

  if (message.type === 'redraw') {
    // 읽은 값이 원본과 같은지 눈으로 확인하는 자리. 카드를 만드는 게 아니다.
    const report = (text: string) => figma.ui.postMessage({ type: 'progress', where: 'read', text });
    const parsed = parseManifest(message.manifest);
    if (!parsed.ok) {
      crash('read', new Error(`명세를 읽지 못했습니다: ${parsed.reason}`));
      return;
    }
    const group = await redraw(parsed.manifest, report);
    figma.currentPage.selection = [group];
    figma.viewport.scrollAndZoomIntoView([group]);
    figma.ui.postMessage({
      type: 'progress',
      where: 'read',
      text: '원본 오른쪽에 다시 그렸습니다. 다른 곳이 있으면 그게 명세가 놓친 것입니다.',
    });
    return;
  }

  if (message.type === 'exportCards') {
    const report = (text: string) => figma.ui.postMessage({ type: 'progress', where: 'make', text });
    const renders = await exportCards(report);
    figma.ui.postMessage({ type: 'exported', renders });
    return;
  }

  if (message.type === 'readTemplate') {
    // 선택한 프레임을 읽어 레퍼런스 명세를 만든다. 원본은 건드리지 않는다.
    const report = (text: string) => {
      console.log('[레퍼런스 읽기]', text);
      figma.ui.postMessage({ type: 'progress', where: 'read', text });
    };
    const manifest = await readTemplate(new Date().toISOString(), report);
    const slots = manifest.frames.reduce((sum, frame) => sum + frame.textSlots.length, 0);
    const photos = manifest.frames.reduce((sum, frame) => sum + frame.imageSlots.length, 0);
    figma.ui.postMessage({
      type: 'template',
      json: JSON.stringify(manifest, null, 2),
      summary: `프레임 ${manifest.frames.length}개 · 텍스트 칸 ${slots}개 · 사진 칸 ${photos}개`,
      notes: manifest.notes,
    });
  }
};

let active = false;
figma.ui.onmessage = async (message: UiMessage) => {
  if (!message || typeof message !== 'object') return;
  if (active) {
    // UI 외에서 중복 메시지가 와도 임시 측정 노드나 생성 중인 카드를 다시 읽지 않는다.
    figma.ui.postMessage({ type: 'busy', busy: true });
    return;
  }
  if (message.type === 'cancel') {
    figma.closePlugin();
    return;
  }
  if (!['readTemplate', 'redraw', 'renderLayout', 'exportCards'].includes(message.type)) return;
  active = true;
  figma.ui.postMessage({ type: 'busy', busy: true });
  try {
    await handleMessage(message);
  } catch (error) {
    crash(message.type === 'readTemplate' || message.type === 'redraw' ? 'read' : 'make', error);
  } finally {
    active = false;
    figma.ui.postMessage({ type: 'busy', busy: false });
  }
};
