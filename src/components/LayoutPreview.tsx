import type { ColorRole, DesignTokens } from '../../shared/designTokens';
import type { LayoutCard, LayoutDeck } from '../../shared/layout';

/**
 * 에이전트가 짠 배치를 화면에서 미리 본다.
 *
 * Figma와 픽셀까지 같지는 않다. Pretendard 같은 폰트가 이 브라우저에 깔려 있을 리 없어서
 * 줄바꿈이 달라진다. **배치가 맞는지 보는 용도**지 최종 결과물이 아니다.
 * 최종 확인은 Figma에서 한다. 그래서 여기서 PNG로 내보내지 않는다.
 */

type Props = { deck: LayoutDeck; tokens: DesignTokens };

/** 카드 한 장을 화면에 이만큼으로 줄여 보여 준다. */
const DISPLAY_WIDTH = 240;

function colorOf(tokens: DesignTokens, role: ColorRole): string {
  return tokens.palette.find((entry) => entry.role === role)?.hex ?? '#cccccc';
}

/** Figma의 굵기 이름을 CSS 숫자로. ExtraBold를 700으로 보내면 원본보다 가늘게 보인다. */
const WEIGHTS: Record<string, number> = {
  thin: 100, extralight: 200, light: 300, regular: 400, medium: 500,
  semibold: 600, bold: 700, extrabold: 800, black: 900,
};

function weightOf(style: string): number {
  return WEIGHTS[style.toLowerCase().replace(/\s+/g, '')] ?? 400;
}

/** 글꼴 이름도 배치에는 없다. 레퍼런스의 타입 스케일에서 찾아 쓴다. */
function familyOf(tokens: DesignTokens, fontSize: number, fontStyle: string): string {
  const found = tokens.typeScale.find((entry) => entry.fontSize === fontSize && entry.fontStyle === fontStyle);
  return found ? `'${found.fontFamily}', 'Noto Sans KR', sans-serif` : "'Noto Sans KR', sans-serif";
}

function Card({ card, tokens, scale }: { card: LayoutCard; tokens: DesignTokens; scale: number }) {
  const { width, height } = tokens.cardSize;
  return (
    <figure className="preview-card">
      <div
        className="preview-frame"
        style={{ width: width * scale, height: height * scale, background: colorOf(tokens, card.background) }}
      >
        {card.blocks.map((block, index) => {
          const box = {
            position: 'absolute' as const,
            left: block.rect.x * scale,
            top: block.rect.y * scale,
            width: block.rect.width * scale,
            height: block.rect.height * scale,
          };
          if (block.kind === 'photo') {
            // 설명을 가운데 크게 넣으면 그게 내용인 줄 보인다. 구석에 붙여 자리 표시로만 둔다.
            return (
              <div key={index} style={{ ...box, background: colorOf(tokens, 'photo') }} className="preview-photo">
                <span>{block.brief}</span>
              </div>
            );
          }
          if (block.kind === 'panel' || block.kind === 'rule') {
            const opacity = block.kind === 'panel' ? block.opacity ?? 1 : 1;
            return <div key={index} style={{ ...box, background: colorOf(tokens, block.color), opacity }} />;
          }
          return (
            <div
              key={index}
              style={{
                ...box,
                // 줄높이는 레퍼런스에서 잰 값을 쓴다. 1.25로 잡았더니 100px 글자를 100px
                // 상자에 넣은 칸("반값")이 잘려 보였다. 실제 Figma에서는 들어가는 자리다.
                height: 'auto',
                color: colorOf(tokens, block.color),
                fontFamily: familyOf(tokens, block.fontSize, block.fontStyle),
                fontSize: Math.max(4, block.fontSize * scale),
                lineHeight: (block.lineHeight ? block.lineHeight / 100 : tokens.metrics?.lineRatio) ?? 1.19,
                textAlign: block.align,
                fontWeight: weightOf(block.fontStyle),
                whiteSpace: 'pre-wrap',
                // 넘치면 넘치는 대로 보여 준다. 잘라 숨기면 검증기가 놓친 걸 눈으로도 못 잡는다.
                overflow: 'visible',
              }}
            >
              {block.text}
            </div>
          );
        })}
      </div>
      <figcaption>{card.id}번</figcaption>
    </figure>
  );
}

export default function LayoutPreview({ deck, tokens }: Props) {
  const scale = tokens.cardSize.width > 0 ? DISPLAY_WIDTH / tokens.cardSize.width : 0.2;
  return (
    <div className="preview-deck">
      {deck.cards.map((card) => (
        <Card key={card.id} card={card} tokens={tokens} scale={scale} />
      ))}
    </div>
  );
}
