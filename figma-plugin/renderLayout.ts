import type { ColorRole, DesignTokens } from '../shared/designTokens';
import type { Block, LayoutCard, LayoutDeck, TextBlock } from '../shared/layout';

/**
 * 에이전트가 짠 배치를 Figma에 그린다.
 *
 * 배치는 미리 검사하지만 글꼴의 실제 줄바꿈은 Figma에서 확인해야 한다.
 * 지정한 상자를 벗어나거나 글자가 겹치면 이번 실행을 취소하고 생성한 노드를 제거한다.
 *
 * 색을 역할로 받는 이유가 여기서 드러난다. 'accent'가 어떤 색인지는 레퍼런스가 정하므로,
 * 에이전트가 무슨 짓을 해도 브랜드 팔레트를 벗어난 색이 캔버스에 들어올 수 없다.
 */

export type Progress = (message: string) => void;

/** 카드 사이 간격. 한 줄로 늘어놓아 전체 흐름이 한눈에 보이게 한다. */
const GAP = 120;
const PLUGIN_KEY_ID = 'cardNewsLayoutId';

export type RenderReport = { created: number; problems: string[] };

function hexToRgb(hex: string): RGB {
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  };
}

function solid(hex: string, opacity = 1): SolidPaint {
  return { type: 'SOLID', color: hexToRgb(hex), opacity };
}

function resolveColor(tokens: DesignTokens, role: ColorRole): string | null {
  return tokens.palette.find((entry) => entry.role === role)?.hex ?? null;
}

/**
 * 글꼴 이름은 배치에 없다. 크기와 굵기로 레퍼런스의 타입 스케일에서 찾는다.
 * 검증이 이미 "레퍼런스에 있는 조합"만 통과시켰으므로 여기서 못 찾는 일은 없어야 한다.
 */
function familyFor(tokens: DesignTokens, fontSize: number, fontStyle: string): string | null {
  return (
    tokens.typeScale.find((entry) => entry.fontSize === fontSize && entry.fontStyle === fontStyle)?.fontFamily ?? null
  );
}

function fontsIn(deck: LayoutDeck, tokens: DesignTokens): FontName[] {
  const seen = new Map<string, FontName>();
  for (const card of deck.cards) {
    for (const block of card.blocks) {
      if (block.kind !== 'text') continue;
      const family = familyFor(tokens, block.fontSize, block.fontStyle);
      if (!family) continue;
      seen.set(`${family}|${block.fontStyle}`, { family, style: block.fontStyle });
    }
  }
  return [...seen.values()];
}

/**
 * 쓰이는 글꼴을 미리 전부 불러온다.
 * 하나라도 없으면 그 글자만 빠지는 게 아니라 만들다 말고 멈추므로, 그리기 전에 확인한다.
 */
async function loadFonts(fonts: FontName[]): Promise<void> {
  const missing: string[] = [];
  for (const font of fonts) {
    try {
      await figma.loadFontAsync(font);
    } catch {
      missing.push(`${font.family} ${font.style}`);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `이 파일에서 쓸 수 없는 글꼴이 있습니다: ${missing.join(', ')}. ` +
        '레퍼런스를 읽은 파일에서 실행하고 있는지 확인해 주세요.',
    );
  }
}

function place(node: SceneNode, block: Block): void {
  node.x = block.rect.x;
  node.y = block.rect.y;
}

/** 속성 설정이나 이미지 처리가 실패해도 묶음을 지우면 함께 정리되도록 먼저 연결한다. */
function own<T extends SceneNode>(parent: FrameNode, node: T): T {
  try {
    parent.appendChild(node);
    return node;
  } catch (error) {
    node.remove();
    throw error;
  }
}

function addText(frame: FrameNode, block: TextBlock, tokens: DesignTokens): TextNode {
  const family = familyFor(tokens, block.fontSize, block.fontStyle);
  const hex = resolveColor(tokens, block.color);
  if (!family || !hex) {
    throw new Error(`글자 "${block.text.slice(0, 12)}"의 글꼴이나 색을 찾지 못했습니다.`);
  }

  const node = own(frame, figma.createText());
  node.name = block.text.split('\n')[0].slice(0, 30) || 'Text';
  node.fontName = { family, style: block.fontStyle };
  node.fontSize = block.fontSize;
  node.characters = block.text;
  // 생략 시 실제 글꼴 기본값을 쓴다. 레퍼런스에서 추정한 평균을 강제로 적용하지 않는다.
  node.lineHeight = block.lineHeight === undefined ? { unit: 'AUTO' } : { value: block.lineHeight, unit: 'PERCENT' };
  node.fills = [solid(hex)];
  node.textAlignHorizontal = block.align === 'center' ? 'CENTER' : block.align === 'right' ? 'RIGHT' : 'LEFT';

  // 폭은 배치가 정한 값을 그대로 쓰고 높이만 글자를 따라가게 둔다. 폭까지 글자에 맡기면
  // 배치가 잡아 둔 단이 무너지고, 검증이 통과시킨 그 모양이 아니게 된다.
  node.textAutoResize = 'HEIGHT';
  node.resize(block.rect.width, node.height);
  place(node, block);
  return node;
}

function addBox(frame: FrameNode, block: Block, hex: string, name: string, opacity = 1): void {
  const node = own(frame, figma.createRectangle());
  node.name = name;
  node.resize(block.rect.width, block.rect.height);
  node.fills = [solid(hex, opacity)];
  place(node, block);
}

type RenderedText = { node: TextNode; block: TextBlock; index: number };
const BOUNDS_TOLERANCE = 1;

function checkRenderedText(cardId: number, frame: FrameNode, texts: RenderedText[]): void {
  for (const { node, block, index } of texts) {
    const label = `${cardId}번 카드 ${index + 1}번 글자 블록`;
    if (!Number.isFinite(node.height) || node.height > block.rect.height + BOUNDS_TOLERANCE) {
      throw new Error(`${label}의 실제 높이(${Math.ceil(node.height)}px)가 배치 상자(${block.rect.height}px)를 넘습니다. 문구를 줄이거나 상자 높이·줄높이를 수정해 주세요.`);
    }
    if (node.x < -BOUNDS_TOLERANCE || node.y < -BOUNDS_TOLERANCE ||
        node.x + node.width > frame.width + BOUNDS_TOLERANCE ||
        node.y + node.height > frame.height + BOUNDS_TOLERANCE) {
      throw new Error(`${label}이 실제 렌더링 후 카드 밖으로 나갑니다. 배치를 수정해 주세요.`);
    }
  }
  for (let i = 0; i < texts.length; i += 1) {
    for (let j = i + 1; j < texts.length; j += 1) {
      const a = texts[i].node;
      const b = texts[j].node;
      const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (width > BOUNDS_TOLERANCE && height > BOUNDS_TOLERANCE) {
        throw new Error(`${cardId}번 카드 ${texts[i].index + 1}번·${texts[j].index + 1}번 글자 블록이 실제 렌더링 후 겹칩니다. 배치를 수정해 주세요.`);
      }
    }
  }
}

/** 이 배보다 더 늘리면 눈에 띄게 뭉갠다. */
const SOFT_UPSCALE = 1.15;

async function buildCard(
  group: FrameNode,
  card: LayoutCard,
  tokens: DesignTokens,
  photos: Record<string, Uint8Array>,
  problems: string[],
): Promise<FrameNode> {
  const frame = own(group, figma.createFrame());
  frame.name = `Card ${card.id}`;
  frame.resize(tokens.cardSize.width, tokens.cardSize.height);
  frame.clipsContent = true;
  const background = resolveColor(tokens, card.background);
  frame.fills = background ? [solid(background)] : [];

  let photoIndex = 0;
  const texts: RenderedText[] = [];
  for (const [index, block] of card.blocks.entries()) {
    if (block.kind === 'text') {
      texts.push({ node: addText(frame, block, tokens), block, index });
      continue;
    }
    if (block.kind === 'photo') {
      // 사진 자리를 나타내던 회색이 레퍼런스에 있으면 그 색으로 둔다. 빈 자리가 아니라
      // "여기에 사진이 온다"는 표시라서, 사진을 못 넣어도 디자인이 무너지지 않는다.
      const placeholder = tokens.photoColor ?? '#d9d9d9';
      const key = `${card.id}-${photoIndex}`;
      photoIndex += 1;
      const bytes = photos[key];
      const node = own(frame, figma.createRectangle());
      node.name = block.brief ? `Photo · ${block.brief.slice(0, 40)}` : 'Photo';
      node.resize(block.rect.width, block.rect.height);
      if (bytes && bytes.length > 0) {
        try {
          const image = figma.createImage(bytes);
          node.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }];
          // FILL은 칸을 꽉 채우려고 사진을 늘린다. 원본이 칸보다 작으면 늘어난 만큼 뭉개진다.
          // 넣고 나서야 "왜 깨지지"를 알게 되면 늦으므로 몇 배 늘었는지 숫자로 알려 준다.
          const size = await image.getSizeAsync();
          const scale = Math.max(block.rect.width / size.width, block.rect.height / size.height);
          if (scale > SOFT_UPSCALE) {
            problems.push(
              `${card.id}번 카드의 사진이 ${size.width}×${size.height}인데 자리는 ` +
                `${Math.round(block.rect.width)}×${Math.round(block.rect.height)}입니다. ` +
                `${scale.toFixed(1)}배 늘어나 흐려집니다. 최소 ${Math.round(block.rect.width)}×${Math.round(block.rect.height)} 이상을 넣어 주세요.`,
            );
          }
        } catch {
          // 형식을 못 읽으면 사진만 포기한다. 카드는 그대로 만든다.
          node.fills = [solid(placeholder)];
          problems.push(`${card.id}번 카드의 사진을 읽지 못해 빈 자리로 두었습니다.`);
        }
      } else {
        node.fills = [solid(placeholder)];
      }
      place(node, block);
      continue;
    }

    const hex = resolveColor(tokens, block.color);
    if (!hex) {
      throw new Error(`${card.id}번 카드의 ${block.kind} 색을 찾지 못했습니다.`);
    }
    addBox(frame, block, hex, block.kind === 'rule' ? 'Rule' : 'Panel', block.kind === 'panel' ? block.opacity ?? 1 : 1);
  }

  checkRenderedText(card.id, frame, texts);
  return frame;
}

export async function renderLayout(
  deck: LayoutDeck,
  tokens: DesignTokens,
  photos: Record<string, Uint8Array>,
  report: Progress = () => {},
): Promise<{ group: FrameNode; result: RenderReport }> {
  report('글꼴을 불러오는 중…');
  await loadFonts(fontsIn(deck, tokens));

  const problems: string[] = [];
  const group = figma.createFrame();
  // 실패하면 이번 실행이 만든 것만 지우기 위해 먼저 만들어 둔다.
  try {
    group.name = `카드뉴스 · ${deck.cards.length}장`;
    group.fills = [];
    group.clipsContent = false;
    group.setPluginData(PLUGIN_KEY_ID, `${deck.cards.length}`);
    figma.currentPage.appendChild(group);

    const { width, height } = tokens.cardSize;
    const count = deck.cards.length;
    group.resize(width * count + GAP * (count - 1), height);
    // 기존 작업 오른쪽 빈 자리에 놓는다. 남의 작업을 덮지 않는다.
    let right = -Infinity;
    for (const node of figma.currentPage.children) {
      if (node === group) continue;
      right = Math.max(right, node.x + node.width);
    }
    group.x = right === -Infinity ? 0 : right + GAP * 2;
    group.y = 0;

    for (let index = 0; index < count; index += 1) {
      report(`${index + 1}/${count}장 그리는 중`);
      const frame = await buildCard(group, deck.cards[index], tokens, photos, problems);
      frame.x = index * (width + GAP);
      frame.y = 0;
    }

    if (group.children.length !== count) throw new Error('카드를 모두 만들지 못했습니다.');
    report('끝났습니다.');
  } catch (error) {
    group.remove();
    throw error;
  }

  return { group, result: { created: deck.cards.length, problems } };
}
