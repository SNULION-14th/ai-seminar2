// 공유 카드 캡처 + 공유 수단 (SHR-03, SHR-06). 브라우저 API를 쓰므로 domain이 아니라
// features/share에 둔다.
import { toBlob } from 'html-to-image'

export const SHARE_CARD_FILENAME = 'gangttara633.png'

// index.html이 불러오는 웹폰트 스타일시트와 같은 URL이다(foundation/Lead 담당, index.html 참고).
// Google Fonts <link>는 crossorigin 속성이 없어서 html-to-image가 document.styleSheets에서
// cssRules를 직접 읽으려다 SecurityError로 멈춘다(QA 재현). fetch로 CSS 텍스트를 미리 받아
// fontEmbedCSS로 넘기면 그 자동 파싱 단계를 건너뛰어 이 문제를 피할 수 있다.
const FONT_STYLESHEET_URLS = [
  'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css',
]

let fontEmbedCssPromise: Promise<string> | null = null

function loadFontEmbedCss(): Promise<string> {
  if (!fontEmbedCssPromise) {
    fontEmbedCssPromise = Promise.all(FONT_STYLESHEET_URLS.map((url) => fetch(url).then((res) => res.text())))
      .then((sheets) => sheets.join('\n'))
      .catch(() => ' ') // 못 받아와도 html-to-image가 document.styleSheets를 다시 읽으려다 멈추지 않게 빈 값에 가깝게 둔다
  }
  return fontEmbedCssPromise
}

const CAPTURE_TIMEOUT_MS = 15_000

/**
 * 카드 DOM 노드를 PNG Blob으로 캡처한다. pixelRatio를 1로 고정해 노드 자체 크기(1080×1350)
 * 그대로 나오게 한다. 웹폰트(Pretendard, Gowun Batang)는 위에서 미리 받아 둔 CSS로 임베드한다.
 * 폰트 임베드가 예상보다 오래 걸리는 경우를 대비해 제한 시간을 둔다(QA에서 버튼이 계속
 * disabled로 멈추는 문제가 있었다).
 */
export async function captureCardPng(node: HTMLElement): Promise<Blob> {
  if (document.fonts?.ready) {
    await document.fonts.ready
  }
  const fontEmbedCSS = await loadFontEmbedCss()

  const capture = toBlob(node, {
    pixelRatio: 1,
    cacheBust: true,
    fontEmbedCSS,
    preferredFontFormat: 'woff2',
  })
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('카드 이미지를 만드는 데 시간이 너무 오래 걸려요')), CAPTURE_TIMEOUT_MS)
  })

  const blob = await Promise.race([capture, timeout])
  if (!blob) throw new Error('카드 이미지를 만들지 못했어요')
  return blob
}

export interface ShareCardPayload {
  blob: Blob
  url: string
  title: string
  text: string
}

export type ShareResult = 'shared-with-image' | 'shared-link-only' | 'downloaded'

/**
 * Web Share API(이미지 포함)로 공유하고, 지원하지 않으면 이미지 다운로드 + 링크 복사로
 * 대체한다 (SHR-06).
 */
export async function shareCard({ blob, url, title, text }: ShareCardPayload): Promise<ShareResult> {
  const file = new File([blob], SHARE_CARD_FILENAME, { type: 'image/png' })
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean
    share?: (data: ShareData) => Promise<void>
  }

  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title, text, url })
    return 'shared-with-image'
  }

  if (nav.share) {
    await nav.share({ title, text, url })
    return 'shared-link-only'
  }

  downloadBlob(blob, SHARE_CARD_FILENAME)
  await copyText(url)
  return 'downloaded'
}

export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objectUrl)
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
