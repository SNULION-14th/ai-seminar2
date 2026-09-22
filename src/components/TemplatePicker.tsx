import { useState } from 'react';
import { parseManifest, summarize, type TemplateManifest } from '../../shared/templateManifest';

type Props = {
  manifest: TemplateManifest | null;
  disabled: boolean;
  onLoad: (manifest: TemplateManifest | null) => void;
};

/**
 * 어떤 Figma 디자인을 레퍼런스로 쓸지 고르는 자리.
 * 여기가 비어 있으면 아래의 "레퍼런스 적용 방식"은 적용할 대상이 없다.
 */
export default function TemplatePicker({ manifest, disabled, onLoad }: Props) {
  const [error, setError] = useState('');

  function load(text: string): void {
    if (!text.trim()) return;
    const result = parseManifest(text);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setError('');
    onLoad(result.manifest);
  }

  if (manifest) {
    const s = summarize(manifest);
    return (
      <div className="field template loaded">
        <div className="field-head">
          <span className="template-label">지금 쓰는 디자인</span>
          <button type="button" className="ghost" disabled={disabled} onClick={() => onLoad(null)}>
            바꾸기
          </button>
        </div>
        <p className="template-name">
          <b>{manifest.fileName}</b> · {manifest.pageName}
        </p>
        <p className="hint">
          카드 {s.frames}장 · 글자 칸 {s.textSlots}개 · 사진 칸 {s.imageSlots}개
          {s.budget.max > 0 && ` · 칸당 ${s.budget.min}~${s.budget.max}자`}
        </p>
        <p className="hint">
          표지 기준: {manifest.frames[0].frameName} · 마지막 장 기준: {manifest.frames[manifest.frames.length - 1].frameName}
        </p>
        {manifest.notes.length > 0 && (
          <ul className="template-notes" aria-label="참고 사항">
            {manifest.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="field template">
      <p className="hint">
        Figma 플러그인의 <b>① 레퍼런스 읽기</b>로 기존 카드뉴스를 읽고, <b>결과 복사</b>한 것을 여기 붙여넣으세요.
      </p>
      <textarea
        id="manifestInput"
        rows={3}
        placeholder="플러그인의 '결과 복사'로 받은 JSON을 붙여넣으세요."
        disabled={disabled}
        onChange={(event) => load(event.target.value)}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
