/**
 * 레퍼런스는 사용자가 직접 고른 프레임을 읽는다.
 * 정리용 프레임·그룹 안에 있어도 카드일 수 있으므로 부모 종류로 판정하지 않는다.
 */
export function selectedReferenceFrames(selection: readonly SceneNode[]): FrameNode[] {
  const picked = [...new Set(selection.filter((node): node is FrameNode => node.type === 'FRAME'))];
  const selected = new Set<BaseNode>(picked);
  return picked.filter((frame) => {
    // 부모와 자식을 함께 골랐으면 같은 내용을 두 장으로 읽지 않는다.
    for (let parent = frame.parent; parent; parent = parent.parent) {
      if (selected.has(parent)) return false;
    }
    return true;
  });
}
