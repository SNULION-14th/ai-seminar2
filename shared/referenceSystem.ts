import type { DesignSystem, FrameSpec } from './templateManifest';

/**
 * 프레임들에서 공통으로 반복되는 것을 뽑는다.
 * 한 번만 쓰인 값도 버리지 않고 횟수를 같이 넘긴다. 무엇이 규칙이고 무엇이 예외인지는
 * 쓰는 쪽이 판단해야 한다.
 */
export function designSystemOf(frames: FrameSpec[]): DesignSystem {
  const colors = new Map<string, number>();
  const type = new Map<string, { fontSize: number; fontFamily: string; fontStyle: string; uses: number }>();
  const margins = new Map<number, number>();
  const bump = (map: Map<string, number>, key: string | null) => {
    if (key) map.set(key, (map.get(key) ?? 0) + 1);
  };

  for (const frame of frames) {
    bump(colors, frame.background && frame.background.hex);
    for (const shape of frame.shapes) {
      bump(colors, shape.fill && shape.fill.hex);
      bump(colors, shape.stroke && shape.stroke.hex);
      margins.set(shape.rect.x, (margins.get(shape.rect.x) ?? 0) + 1);
    }
    for (const slot of frame.textSlots) {
      bump(colors, slot.color && slot.color.hex);
      margins.set(slot.rect.x, (margins.get(slot.rect.x) ?? 0) + 1);
      if (slot.fontSize === 'mixed') continue;
      const key = `${slot.fontSize}|${slot.fontFamily}|${slot.fontStyle}`;
      const seen = type.get(key);
      if (seen) seen.uses += 1;
      else type.set(key, { fontSize: slot.fontSize, fontFamily: slot.fontFamily, fontStyle: slot.fontStyle, uses: 1 });
    }
    for (const slot of frame.imageSlots) {
      margins.set(slot.rect.x, (margins.get(slot.rect.x) ?? 0) + 1);
    }
  }

  const first = frames[0];
  return {
    colors: [...colors].map(([hex, uses]) => ({ hex, uses })).sort((a, b) => b.uses - a.uses),
    typeScale: [...type.values()].sort((a, b) => b.fontSize - a.fontSize),
    // 한 번만 나온 x는 여백 규칙이 아니라 그냥 그 요소의 자리다.
    margins: [...margins]
      .filter(([, uses]) => uses > 1)
      .map(([value, uses]) => ({ value, uses }))
      .sort((a, b) => b.uses - a.uses),
    cardSize: { width: first ? first.width : 0, height: first ? first.height : 0 },
  };
}
