import { designSystemOf } from '../shared/referenceSystem';
import { selectedReferenceFrames } from './selection';
import type {
  Color,
  FrameSpec,
  ImageSlot,
  ShapeSpec,
  TemplateManifest,
  TextSlot,
} from '../shared/templateManifest';

/**
 * 사용자가 이미 만들어 둔 카드뉴스 프레임을 읽어 레퍼런스 명세로 바꾼다.
 *
 * 이 명세는 **레퍼런스**다. 똑같이 찍어내려는 게 아니라 "이 브랜드가 쓰는 디자인 언어"를 뽑아,
 * 비슷한 톤의 새 배치를 만들 때 따를 규칙으로 쓴다. 그래서 세 가지를 읽는다.
 *
 * 1) 배치 — 무엇이 어디에 어떤 크기로 놓였는지.
 * 2) 디자인 언어 — 색, 폰트 위계, 여백 리듬, 장식 도형. 이게 없으면 새 카드를 무슨 색으로
 *    만들지 알 수가 없다. 채우기에는 1)만 있어도 되지만 따라 만들기에는 2)가 있어야 한다.
 * 3) 글자 예산 — **이 파일의 진짜 폰트로 임시 노드에서 실측한다.** 원본은 읽기만 하고,
 *    현재 페이지의 빈 공간에 만든 측정용 복제본은 성공·실패 모두 정리한다.
 */

export type Progress = (message: string) => void;

/** 한 칸을 재는 데 이보다 오래 걸리면 포기하고 넘어간다. 멈춘 채로 두지 않는다. */
const SLOT_BUDGET_MS = 4_000;
const MAX_PROBE_STEPS = 14;

function hex2(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.round(value * 255)));
  return (byte < 16 ? '0' : '') + byte.toString(16);
}

/** 눈에 보이는 단색만 가져온다. 그라디언트·이미지는 여기서 색으로 치지 않는다. */
function colorOf(paints: readonly Paint[] | PluginAPI['mixed']): Color | null {
  if (!Array.isArray(paints)) return null;
  for (const paint of paints) {
    if (paint.type !== 'SOLID' || paint.visible === false) continue;
    const alpha = Math.round((paint.opacity === undefined ? 1 : paint.opacity) * 100) / 100;
    if (alpha === 0) continue;
    return { hex: `#${hex2(paint.color.r)}${hex2(paint.color.g)}${hex2(paint.color.b)}`, alpha };
  }
  return null;
}

// PERCENT는 폰트 크기에 비례하고 PIXELS는 절대값이다. 단위를 떼면 숫자를 쓸 수가 없으므로 같이 넘긴다.
function spacingOf(value: LetterSpacing | PluginAPI['mixed']): { value: number; unit: 'PIXELS' | 'PERCENT' } | 'mixed' {
  if (typeof value !== 'object' || value === null || !('unit' in value)) return 'mixed';
  return { value: Math.round(value.value * 100) / 100, unit: value.unit };
}

function lineHeightOf(value: LineHeight | PluginAPI['mixed']): { value: number; unit: 'PIXELS' | 'PERCENT' } | 'auto' | 'mixed' {
  if (typeof value !== 'object' || value === null || !('unit' in value)) return 'mixed';
  if (value.unit === 'AUTO') return 'auto';
  return { value: Math.round(value.value * 100) / 100, unit: value.unit };
}

/**
 * 화면에 **보이는** 사각형을 기록한다.
 *
 * node.width/height는 **회전 전** 값이고 absoluteTransform의 이동값은 회전 기준점이다.
 * 그대로 쓰면 90도 돌린 가로선이 "2×120 세로선"으로 기록된다. 실제로 그렇게 틀렸고,
 * 그 틀린 값을 보고 "이 브랜드는 세로선을 쓴다"는 결론까지 냈다.
 *
 * absoluteBoundingBox는 회전을 반영한 실제 외곽이다. 그걸 쓴다.
 */
function rectOf(node: SceneNode, frame: FrameNode) {
  const box = node.absoluteBoundingBox;
  const origin = frame.absoluteBoundingBox;
  if (box && origin) {
    return {
      x: Math.round(box.x - origin.x),
      y: Math.round(box.y - origin.y),
      width: Math.round(box.width),
      height: Math.round(box.height),
    };
  }
  // 보이지 않는 노드는 외곽이 없다. 회전이 없다고 보고 변환값을 쓴다.
  return {
    x: Math.round(node.absoluteTransform[0][2] - frame.absoluteTransform[0][2]),
    y: Math.round(node.absoluteTransform[1][2] - frame.absoluteTransform[1][2]),
    width: Math.round(node.width),
    height: Math.round(node.height),
  };
}

function rotationOf(node: SceneNode): number {
  return 'rotation' in node && typeof node.rotation === 'number' ? Math.round(node.rotation * 10) / 10 : 0;
}

/** 텍스트를 바꾸려면 그 노드가 쓰는 폰트를 전부 먼저 불러와야 한다. */
async function loadFontsOf(node: TextNode): Promise<boolean> {
  try {
    const fonts = node.characters.length > 0
      ? node.getRangeAllFontNames(0, node.characters.length)
      : [node.fontName as FontName];
    await Promise.all(fonts.map((font) => figma.loadFontAsync(font)));
    return true;
  } catch {
    return false;
  }
}

/** 잴 수 있으면 글자 수를, 못 재면 그 이유를 돌려준다. 틀린 숫자보다 "모른다"가 낫다. */
type Capacity = { capacity: number; reason: string | null };

/** 상한. 이만큼 넣어도 상자가 안 늘어나면 높이가 글자 수에 반응하지 않는 칸이다. */
const PROBE_CEILING = 1000;

/** 문구를 통째로 교체하면 혼합 서식은 소실된다. 그 상태로 잰 값을 실측으로 보고하지 않는다. */
function hasMixedStyles(node: TextNode): boolean {
  return [
    node.fontName, node.fontSize, node.fontWeight, node.fills, node.textStyleId,
    node.letterSpacing, node.lineHeight, node.paragraphIndent, node.paragraphSpacing,
    node.listSpacing, node.textCase, node.textDecoration, node.leadingTrim,
    node.textWrapStyle, node.openTypeFeatures,
  ].some((value) => value === figma.mixed);
}

/**
 * 이 칸이 오른쪽으로 넓어질 때 어디서 막히는지 찾는다.
 *
 * 없으면 옆에 사진이 있어도 프레임 끝까지 쓸 수 있다고 착각한다. 실측 결과 어떤 레퍼런스의
 * "단어 하나로 나를 설명하면?" 칸이 그랬다 — 오른쪽 540에 사진이 있는데 878px를 가정해
 * 예산이 두 배로 부풀었다. 넘치라고 부추기는 숫자가 되므로 반드시 막아야 한다.
 */
function blockedAt(node: TextNode, frame: FrameNode): number {
  const originX = frame.absoluteTransform[0][2];
  const originY = frame.absoluteTransform[1][2];
  const left = node.absoluteTransform[0][2] - originX;
  const top = node.absoluteTransform[1][2] - originY;
  const bottom = top + node.height;
  let limit = frame.width;

  const scan = (children: readonly SceneNode[]): void => {
    for (const other of children) {
      if (other === node || other.visible === false) continue;
      const x = other.absoluteTransform[0][2] - originX;
      const y = other.absoluteTransform[1][2] - originY;
      // 세로로 겹치지 않으면 옆에 있어도 길을 막지 않는다.
      if (y + other.height <= top || y >= bottom) continue;
      // 이 칸보다 왼쪽에서 시작하는 건 막는 게 아니라 뒤에 깔린 배경이다.
      if (x > left && x < limit) limit = x;
      if ('children' in other) scan(other.children);
    }
  };
  scan(frame.children);
  return limit;
}

/** 원본 기하를 먼저 읽고, 임시 복제본만 수정하며 원본과 같은 글자 구성으로 측정한다. */
function measureCapacity(node: TextNode, frame: FrameNode, startedAt: number): Capacity {
  const original = node.characters;
  const sample = original.replace(/\s+/g, ' ').trim() || '가나다라마바사 아자차카타파하 ';
  // 한글은 UTF-16에서 1칸이지만 이모지는 2칸이다. length로 세면 글자 수가 어긋나므로
  // 코드포인트로 쪼개 두고 그 단위로만 센다.
  const units = [...sample];
  const take = (count: number): string => {
    let out = '';
    for (let k = 0; k < count; k += 1) out += units[k % units.length];
    return out;
  };

  // 폭과 주변 장애물은 원본 위치에서 계산한다. 복제본은 다른 위치에 놓인다.
  const maxHeight = node.height;
  let availableWidth = node.width;
  if (node.textAutoResize === 'WIDTH_AND_HEIGHT') {
    const left = node.absoluteTransform[0][2] - frame.absoluteTransform[0][2];
    const wall = blockedAt(node, frame);
    const symmetric = frame.width - left * 2;
    const toWall = wall - left;
    availableWidth = Math.max(120, Math.round(Math.min(toWall, symmetric > 0 ? symmetric : toWall)));
  }

  const scratchX = figma.currentPage.children.reduce((right, child) => {
    const box = child.absoluteBoundingBox;
    return Math.max(right, box ? box.x + box.width : child.x + child.width);
  }, 0) + 200;

  // TextNode.clone()은 원본 parent가 아닌 currentPage에 생성된다. 원본 auto-layout에
  // 넣었다가 빼는 과정도 없다. https://developers.figma.com/docs/plugins/api/TextNode/
  const probe = node.clone();
  try {
    probe.name = '임시 글자 예산 측정';
    probe.rotation = 0;
    probe.x = scratchX;
    probe.y = 0;
    probe.textAutoResize = 'HEIGHT';
    probe.resize(availableWidth, maxHeight);

    // 먼저 상한을 넣어 본다. 그래도 안 넘치면 이 칸은 높이가 글자 수를 따라가지 않는다
    // (줄 수 제한이나 높이 고정). 이분 탐색은 그런 칸에서 상한까지 치솟아 20배쯤 뻥튀기된
    // 숫자를 내놓는다. 실측이라고 내보내는 값이 틀리는 게 제일 나쁘므로 재지 않았다고 말한다.
    probe.characters = take(PROBE_CEILING);
    if (probe.height <= maxHeight + 0.5) {
      return {
        capacity: 0,
        reason: '상자 높이가 글자 수에 반응하지 않습니다(줄 수 제한이나 높이 고정). 예산을 재지 못했습니다.',
      };
    }

    let low = 1;
    let high = PROBE_CEILING - 1;
    let best = 1;
    // 단계 수와 시간을 둘 다 막는다. 어느 쪽이든 걸리면 지금까지의 최선을 쓴다.
    for (let step = 0; step < MAX_PROBE_STEPS && low <= high; step += 1) {
      if (Date.now() - startedAt > SLOT_BUDGET_MS) break;
      const mid = Math.floor((low + high) / 2);
      probe.characters = take(mid);
      if (probe.height <= maxHeight + 0.5) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    // 폰트 렌더링 차이와 글자 조합에 따른 흔들림을 감안해 5%를 뺀다.
    const measured = Math.max(1, Math.floor(best * 0.95));
    // 원본이 실제로 들어가 있던 분량보다 적게 나오면 측정을 믿지 않는다.
    return { capacity: Math.max(measured, [...original].length), reason: null };
  } finally {
    // 원본을 복원하는 경로는 없다. 기존 노드에 한 번도 쓰지 않았기 때문이다.
    probe.remove();
  }
}

async function readFrame(frame: FrameNode, notes: string[], report: Progress): Promise<FrameSpec> {
  const textSlots: TextSlot[] = [];
  const imageSlots: ImageSlot[] = [];
  const shapes: ShapeSpec[] = [];

  async function walk(node: SceneNode, path: number[]): Promise<void> {
    // 숨긴 레이어는 결과에 안 보인다. 재느라 남의 문서를 건드릴 이유도, 디자인 언어에 섞을 이유도 없다.
    if (node.visible === false) return;

    if (node.type === 'TEXT') {
      report(`${frame.name} / ${node.name} 재는 중`);
      const mixed = hasMixedStyles(node);
      const written = [...node.characters].length;
      // 비동기 폰트 로딩과 측정 전에 원본 명세를 읽는다.
      const slot: TextSlot = {
        nodePath: path,
        name: node.name,
        characters: node.characters,
        rect: rectOf(node, frame),
        fontSize: node.fontSize === figma.mixed ? 'mixed' : node.fontSize,
        fontFamily: node.fontName === figma.mixed ? 'mixed' : node.fontName.family,
        fontStyle: node.fontName === figma.mixed ? 'mixed' : node.fontName.style,
        autoResize: node.textAutoResize,
        budget: { min: 0, max: written },
        mixedStyles: mixed,
        color: colorOf(node.fills),
        letterSpacing: spacingOf(node.letterSpacing),
        lineHeight: lineHeightOf(node.lineHeight),
      };
      if (mixed) {
        notes.push(`${frame.name} / ${node.name}: 혼합 서식은 정확히 재기 어려워 예산을 측정하지 않았습니다. 원문 글자 수를 사용하며 원본 서식은 그대로 보존합니다.`);
      } else if (!(await loadFontsOf(node))) {
        notes.push(`${frame.name} / ${node.name}: 폰트를 불러오지 못해 예산을 재지 못했습니다.`);
      } else {
        // 한 칸이 잘못돼도 전체를 멈추지 않는다.
        try {
          const result = measureCapacity(node, frame, Date.now());
          if (result.capacity > 0) {
            slot.budget = {
              min: Math.min(Math.round(written * 0.9), Math.round(result.capacity * 0.6)),
              max: result.capacity,
            };
          }
          if (result.reason) notes.push(`${frame.name} / ${node.name}: ${result.reason}`);
        } catch (error) {
          notes.push(`${frame.name} / ${node.name}: 재는 중 문제가 생겨 건너뜁니다 (${error instanceof Error ? error.message : '알 수 없음'}).`);
        }
      }
      textSlots.push(slot);
      return;
    }

    // 꺼 둔 채우기는 화면에 없다. 그걸로 사진 칸을 만들면 있지도 않은 자리가 명세에 생긴다.
    const image = 'fills' in node && Array.isArray(node.fills)
      ? node.fills.find((paint) => paint.type === 'IMAGE' && paint.visible !== false)
      : undefined;

    if (image) {
      imageSlots.push({
        nodePath: path,
        name: node.name,
        rect: rectOf(node, frame),
        scaleMode: (image as ImagePaint).scaleMode,
      });
      // 사진 칸은 도형이 아니므로 도형으로 세지 않는다. 다만 **자식은 반드시 읽는다.**
      // 전면 사진 프레임 위에 제목을 올리는 건 카드뉴스의 기본 구성이다. 여기서 돌아서면
      // 그 제목이 명세에서 통째로 사라지고, 아무 경고도 안 뜬다.
    } else if ('fills' in node && Array.isArray(node.fills)) {
      const fill = colorOf(node.fills);
      const stroke = 'strokes' in node ? colorOf(node.strokes) : null;
      // 색도 테두리도 없으면 그냥 묶음이다. 장식으로 볼 게 없다.
      if (fill || stroke) {
        shapes.push({
          nodePath: path,
          name: node.name,
          kind: node.type,
          rect: rectOf(node, frame),
          fill,
          stroke,
          cornerRadius: !('cornerRadius' in node)
            ? 0
            : typeof node.cornerRadius === 'number'
              ? Math.round(node.cornerRadius)
              : 'mixed',
          rotation: rotationOf(node),
        });
      }
    }

    // 명세가 담지 못하는 꾸밈은 조용히 사라진다. 사라졌다는 사실만이라도 남긴다.
    const lost: string[] = [];
    // 90도 배수로 돌린 사각형은 외곽이 실제 모양과 같다. 다시 그려도 똑같이 나오므로
    // 손실이 아니다. 실제로 레퍼런스의 가로선이 전부 -90도였는데, 이걸 손실이라고 알리면
    // 고칠 게 없는 경고만 여섯 줄 쌓인다.
    const angle = rotationOf(node);
    const squareTurn = Math.abs(angle % 90) < 0.5;
    const boxy = node.type === 'RECTANGLE' || node.type === 'FRAME' || node.type === 'GROUP';
    if (angle !== 0 && !(squareTurn && boxy)) lost.push(`${angle}도 회전`);
    if ('effects' in node && Array.isArray(node.effects) && node.effects.some((effect) => effect.visible !== false)) {
      lost.push('그림자·흐림');
    }
    if ('fills' in node && Array.isArray(node.fills) && node.fills.some((paint) => paint.type.startsWith('GRADIENT') && paint.visible !== false)) {
      lost.push('그라디언트');
    }
    if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0 && 'strokeWeight' in node && node.strokeWeight !== 0) {
      lost.push('테두리 두께');
    }
    if (lost.length > 0) {
      notes.push(`${frame.name} / ${node.name}: ${lost.join(', ')}은(는) 명세에 담기지 않습니다. 새로 그릴 때 빠집니다.`);
    }

    if ('children' in node) {
      for (let i = 0; i < node.children.length; i += 1) await walk(node.children[i], [...path, i]);
    }
  }

  for (let i = 0; i < frame.children.length; i += 1) await walk(frame.children[i], [i]);

  if (textSlots.length === 0) {
    // 사진만 있는 카드는 흔하다. 문제가 아니라 "이 프레임에서는 글자 예산을 못 얻는다"는 뜻이다.
    notes.push(`${frame.name}: 글자가 없어 이 프레임에서는 문구 분량을 참고하지 못합니다. 사진만 있는 카드라면 정상입니다.`);
  }
  return {
    frameName: frame.name,
    width: Math.round(frame.width),
    height: Math.round(frame.height),
    textSlots,
    imageSlots,
    background: colorOf(frame.fills),
    shapes,
  };
}

export async function readTemplate(now: string, report: Progress = () => {}): Promise<TemplateManifest> {
  const selection = selectedReferenceFrames(figma.currentPage.selection);
  if (selection.length === 0) {
    throw new Error('카드 프레임을 하나 이상 선택한 뒤 다시 실행해 주세요.');
  }

  const notes: string[] = [];
  const frames: FrameSpec[] = [];
  for (let i = 0; i < selection.length; i += 1) {
    report(`프레임 ${i + 1}/${selection.length}: ${selection[i].name}`);
    frames.push(await readFrame(selection[i], notes, report));
  }
  // 프레임 이름이 겹쳐도 상관없다. 이름으로 프레임을 찾아 쓰는 코드가 없다.
  // (원본을 복제하던 시절에는 치명적이었지만 그 경로는 없앴다.)

  // 한 시리즈의 카드는 크기가 같다. 제각각이면 카드가 아닌 걸 섞어 골랐을 가능성이 크다.
  const sizes = new Set(selection.map((frame) => `${Math.round(frame.width)}×${Math.round(frame.height)}`));
  if (sizes.size > 1) {
    notes.push(`고른 프레임의 크기가 서로 다릅니다(${[...sizes].join(', ')}). 같은 판형의 카드만 고르셨는지 확인해 주세요.`);
  }

  report('끝났습니다.');

  return {
    schemaVersion: 1,
    readAt: now,
    fileName: figma.root.name,
    pageName: figma.currentPage.name,
    frames,
    notes,
    system: designSystemOf(frames),
  };
}
