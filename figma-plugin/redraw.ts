import type { TemplateManifest } from '../shared/templateManifest';

/**
 * 읽은 명세를 **그대로 다시 그린다.** 카드를 만드는 기능이 아니라 리더를 검증하는 기능이다.
 *
 * 왜 필요한가. 지금까지 "읽은 값이 원본과 같은지" 확인할 방법이 없었다. 그래서 회전된
 * 가로선을 세로선으로 기록하고도 아무도 몰랐고, 그 틀린 값을 근거로 "이 브랜드는 세로선을
 * 쓴다"는 결론까지 냈다. 원본 옆에 다시 그려 두면 어긋난 곳이 눈에 바로 보인다.
 *
 * 명세에 없는 것(그림자·그라디언트·마스크)은 여기서도 안 나온다. 그게 정확히 요점이다.
 * 다시 그린 것과 원본의 차이가 곧 **명세가 잃어버린 것**이다.
 */

export type Progress = (message: string) => void;

const GAP = 120;

function hexToRgb(hex: string): RGB {
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  };
}

function paint(color: { hex: string; alpha: number }): SolidPaint {
  return { type: 'SOLID', color: hexToRgb(color.hex), opacity: color.alpha };
}

function own<T extends SceneNode>(parent: FrameNode, node: T): T {
  try {
    parent.appendChild(node);
    return node;
  } catch (error) {
    node.remove();
    throw error;
  }
}

export async function redraw(manifest: TemplateManifest, report: Progress = () => {}): Promise<FrameNode> {
  // 명세에 적힌 글꼴을 전부 불러온다. 없으면 어디가 다른지 비교할 수가 없다.
  const fonts = new Map<string, FontName>();
  for (const frame of manifest.frames) {
    for (const slot of frame.textSlots) {
      if (slot.fontFamily === 'mixed' || slot.fontStyle === 'mixed') continue;
      fonts.set(`${slot.fontFamily}|${slot.fontStyle}`, { family: slot.fontFamily, style: slot.fontStyle });
    }
  }
  report('글꼴을 불러오는 중…');
  const missing: string[] = [];
  for (const font of fonts.values()) {
    try {
      await figma.loadFontAsync(font);
    } catch {
      missing.push(`${font.family} ${font.style}`);
    }
  }
  if (missing.length > 0) throw new Error(`글꼴을 불러오지 못했습니다: ${missing.join(', ')}`);

  const group = figma.createFrame();
  try {
    group.name = `읽은 대로 다시 그림 · ${manifest.fileName}`;
    group.fills = [];
    group.clipsContent = false;
    figma.currentPage.appendChild(group);

    let right = -Infinity;
    for (const node of figma.currentPage.children) {
      if (node === group) continue;
      right = Math.max(right, node.x + node.width);
    }
    const width = manifest.frames[0]?.width ?? 1080;
    const height = manifest.frames[0]?.height ?? 1350;
    group.resize(width * manifest.frames.length + GAP * (manifest.frames.length - 1), height);
    group.x = right === -Infinity ? 0 : right + GAP * 2;
    // 원본 아래가 아니라 오른쪽에 둔다. 나란히 놓아야 비교가 된다.
    group.y = 0;

    manifest.frames.forEach((spec, index) => {
      report(`${index + 1}/${manifest.frames.length}장 다시 그리는 중`);
      const frame = own(group, figma.createFrame());
      frame.name = `${spec.frameName} (다시 그림)`;
      frame.resize(spec.width, spec.height);
      frame.clipsContent = true;
      frame.fills = spec.background ? [paint(spec.background)] : [];
      frame.x = index * (spec.width + GAP);
      frame.y = 0;

      // 명세에 담긴 순서 그대로 놓는다. 겹침 순서가 달라지면 그것도 차이로 보여야 한다.
      for (const shape of spec.shapes) {
        const box = own(frame, figma.createRectangle());
        box.name = shape.name;
        box.resize(Math.max(1, shape.rect.width), Math.max(1, shape.rect.height));
        box.fills = shape.fill ? [paint(shape.fill)] : [];
        box.strokes = shape.stroke ? [paint(shape.stroke)] : [];
        if (typeof shape.cornerRadius === 'number') box.cornerRadius = shape.cornerRadius;
        box.x = shape.rect.x;
        box.y = shape.rect.y;
      }
      for (const slot of spec.imageSlots) {
        const box = own(frame, figma.createRectangle());
        box.name = `${slot.name} (사진 자리)`;
        box.resize(Math.max(1, slot.rect.width), Math.max(1, slot.rect.height));
        box.fills = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
        box.x = slot.rect.x;
        box.y = slot.rect.y;
      }
      for (const slot of spec.textSlots) {
        if (slot.fontFamily === 'mixed' || slot.fontStyle === 'mixed' || slot.fontSize === 'mixed') continue;
        const node = own(frame, figma.createText());
        node.name = slot.name;
        node.fontName = { family: slot.fontFamily, style: slot.fontStyle };
        node.fontSize = slot.fontSize;
        node.characters = slot.characters;
        if (slot.color) node.fills = [paint(slot.color)];
        node.textAutoResize = 'HEIGHT';
        node.resize(Math.max(1, slot.rect.width), node.height);
        node.x = slot.rect.x;
        node.y = slot.rect.y;
      }
    });
    report('끝났습니다. 원본과 나란히 놓고 비교해 보세요.');
  } catch (error) {
    group.remove();
    throw error;
  }

  return group;
}
