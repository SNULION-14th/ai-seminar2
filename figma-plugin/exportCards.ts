/**
 * 만든 카드를 PNG로 뽑는다.
 *
 * 왜 필요한가. 지금까지 AI는 좌표를 내놓고 그걸로 끝이었다. 자기가 만든 게 어떻게 보이는지
 * 한 번도 본 적이 없다. 눈 감고 그리는 것과 같아서 결과가 이상해도 고칠 방법이 없었다.
 * 뽑은 PNG를 에이전트가 열어 보고 고치면 그제서야 "AI가 디자인한다"가 성립한다.
 */

export type Progress = (message: string) => void;

/** 1080×1350을 절반으로. 글자를 읽기엔 충분하고 주고받기엔 가볍다. */
const SCALE = 0.5;

export type Render = { name: string; bytes: Uint8Array };

/**
 * 선택한 것에서 카드 프레임을 찾는다.
 * 카드 만들기 직후에는 묶음 하나가 선택돼 있다. 그 안의 카드들을 뽑아야지 묶음을 통째로
 * 뽑으면 한 장짜리 긴 그림이 나온다.
 */
export function cardsInSelection(selection: readonly SceneNode[]): FrameNode[] {
  const frames = selection.filter((node): node is FrameNode => node.type === 'FRAME');
  if (frames.length !== 1) return frames;

  // 묶음을 골랐으면 그 안의 카드를 한 장씩 뽑아야 한다. 묶음째 뽑으면 한 장짜리 긴 그림이 된다.
  // 다만 카드 한 장을 골랐을 때 그 안의 사진 프레임을 카드로 착각하면 안 된다. 카드 묶음은
  // 자식이 전부 프레임이고, 둘 이상이고, 크기가 같다. 카드 한 장은 글자와 도형을 직접 품는다.
  const children = frames[0].children;
  const allFrames = children.every((node): node is FrameNode => node.type === 'FRAME');
  if (!allFrames || children.length < 2) return frames;

  const first = children[0];
  const sameSize = children.every(
    (node) => Math.abs(node.width - first.width) < 1 && Math.abs(node.height - first.height) < 1,
  );
  return sameSize ? (children as FrameNode[]).slice() : frames;
}

export async function exportCards(report: Progress = () => {}): Promise<Render[]> {
  const cards = cardsInSelection(figma.currentPage.selection);
  if (cards.length === 0) {
    throw new Error('뽑을 카드를 선택해 주세요. 카드 묶음을 선택하면 그 안의 카드를 한 장씩 뽑습니다.');
  }

  const renders: Render[] = [];
  for (let i = 0; i < cards.length; i += 1) {
    report(`${i + 1}/${cards.length}장 뽑는 중`);
    const bytes = await cards[i].exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: SCALE } });
    // 이름이 겹치면 나중 것이 앞의 것을 덮는다. 순번을 앞에 붙여 순서도 같이 보이게 한다.
    renders.push({ name: `${String(i + 1).padStart(2, '0')}-${cards[i].name}`, bytes });
  }
  report(`${renders.length}장 뽑았습니다.`);
  return renders;
}
