import { useState } from 'react';
import { CARD_COUNT, type GenerateInput, type Tone } from '../../shared/contracts';
import { REFERENCE_MODES } from '../../shared/referenceModes';
import type { TemplateManifest } from '../../shared/templateManifest';
import TemplatePicker from './TemplatePicker';
import MarkdownField from './MarkdownField';

const TONES: { value: Tone; label: string }[] = [
  { value: 'friendly', label: '친근한' },
  { value: 'calm', label: '차분한' },
  { value: 'professional', label: '전문적인' },
];

type Props = {
  value: GenerateInput;
  errors: Record<string, string>;
  busy: boolean;
  onChange: <K extends keyof GenerateInput>(field: K, next: GenerateInput[K]) => void;
  onSubmit: () => void;
  template: TemplateManifest | null;
  onTemplate: (manifest: TemplateManifest | null) => void;
};

export default function BrandForm({
  value, errors, busy, onChange, onSubmit, template, onTemplate,
}: Props) {
  const [readingFile, setReadingFile] = useState(false);

  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault();
        if (!readingFile) onSubmit();
      }}
    >
      <section>
        <h2>브랜드 자료</h2>
        <div className="row">
          <div className="field">
            <label htmlFor="brandName">브랜드명</label>
            <input
              id="brandName"
              value={value.brandName}
              maxLength={40}
              disabled={busy}
              onChange={(event) => onChange('brandName', event.target.value)}
            />
            {errors.brandName && <span className="error">{errors.brandName}</span>}
          </div>
          <div className="field color">
            <label htmlFor="primaryColor">대표색</label>
            <div className="color-input">
              <input
                id="primaryColor"
                type="color"
                value={value.primaryColor}
                disabled={busy}
                onChange={(event) => onChange('primaryColor', event.target.value.toUpperCase())}
              />
              <span>{value.primaryColor}</span>
            </div>
            {errors.primaryColor && <span className="error">{errors.primaryColor}</span>}
          </div>
        </div>
        <MarkdownField
          label="브랜드·서비스 소개"
          hint="정체성, 어투, 쓰지 않을 표현, 그리고 서비스 기능과 확인된 사실을 함께 담습니다."
          value={value.brandMarkdown}
          error={errors.brandMarkdown}
          disabled={busy}
          onChange={(next) => onChange('brandMarkdown', next)}
          onReadingChange={setReadingFile}
        />
      </section>

      <section>
        <h2>레퍼런스</h2>
        <TemplatePicker manifest={template} disabled={busy} onLoad={onTemplate} />
        <fieldset className="field">
          <legend>레퍼런스 적용 방식</legend>
          <div className="modes">
            {REFERENCE_MODES.map((mode) => (
              <label key={mode.value} className={value.templateMode === mode.value ? 'mode on' : 'mode'}>
                <span className="mode-head">
                  <input
                    type="radio"
                    name="templateMode"
                    value={mode.value}
                    checked={value.templateMode === mode.value}
                    disabled={busy}
                    onChange={() => onChange('templateMode', mode.value)}
                  />
                  {mode.label}
                </span>
                <span className="mode-detail">{mode.detail}</span>
              </label>
            ))}
          </div>
          {errors.templateMode && <span className="error">{errors.templateMode}</span>}
        </fieldset>
      </section>

      <section>
        <h2>이번 카드뉴스</h2>
        <div className="field must-follow">
          <label htmlFor="mustFollow">AI가 꼭 알아야 할 것</label>
          <p className="hint">
            여기에 적은 내용이 <b>다른 모든 규칙보다 먼저</b> 적용됩니다. 문구·사진에 모두 전달됩니다.
          </p>
          <textarea
            id="mustFollow"
            rows={3}
            value={value.mustFollow}
            disabled={busy}
            onChange={(event) => onChange('mustFollow', event.target.value)}
            placeholder={'예) 3번 카드에는 무료 체험 14일을 꼭 넣어주세요\n예) 이번엔 존댓말 말고 편한 말투로\n예) 사진은 밝고 따뜻한 톤으로'}
          />
          <div className="field-foot">
            <span>{[...value.mustFollow.trim()].length} / 2,000자</span>
            {errors.mustFollow && <span className="error">{errors.mustFollow}</span>}
          </div>
        </div>
        <div className="field">
          <label htmlFor="sourceContent">전달할 내용과 목적</label>
          <textarea
            id="sourceContent"
            rows={4}
            value={value.sourceContent}
            disabled={busy}
            onChange={(event) => onChange('sourceContent', event.target.value)}
            placeholder="무엇을 전하고, 읽은 사람이 무엇을 하길 바라나요?&#10;예) 아침 루틴의 효과를 알리고, 내일 아침 한 가지를 따라 해보게 하고 싶다"
          />
          {errors.sourceContent && <span className="error">{errors.sourceContent}</span>}
        </div>
        <div className="row outline-row">
          <div className="field">
            <label htmlFor="outline">대략적인 구성 (선택)</label>
            <p className="hint">어떤 순서로 무엇을 말할지 적으면 그 순서를 따릅니다. 비우면 AI가 정합니다.</p>
            <textarea
              id="outline"
              rows={4}
              value={value.outline}
              disabled={busy}
              onChange={(event) => onChange('outline', event.target.value)}
              placeholder={'1. 왜 기록이 어려운지\n2. 주간 목표 세우기\n3. 매일 기록하기\n4. 주말에 돌아보기'}
            />
            <div className="field-foot">
              <span>{[...value.outline.trim()].length} / 500자</span>
              {errors.outline && <span className="error">{errors.outline}</span>}
            </div>
          </div>
          <div className="field count">
            <label htmlFor="cardCount">장수</label>
            <p className="hint">{CARD_COUNT.min}~{CARD_COUNT.max}장</p>
            <input
              id="cardCount"
              type="number"
              inputMode="numeric"
              min={CARD_COUNT.min}
              max={CARD_COUNT.max}
              step={1}
              value={value.cardCount}
              disabled={busy}
              onChange={(event) => onChange('cardCount', Number(event.target.value))}
            />
            <span className="hint">표지 1 · 설명 {Math.max(0, value.cardCount - 2)} · 마무리 1</span>
            {errors.cardCount && <span className="error">{errors.cardCount}</span>}
          </div>
        </div>
        <div className="field">
          <label htmlFor="audience">타겟</label>
          <input
            id="audience"
            value={value.audience}
            maxLength={200}
            disabled={busy}
            onChange={(event) => onChange('audience', event.target.value)}
            placeholder="누가 읽나요? 어디까지 알고 있나요?"
          />
          {errors.audience && <span className="error">{errors.audience}</span>}
        </div>
        <fieldset className="field">
          <legend>어투</legend>
          <div className="tones">
            {TONES.map((tone) => (
              <label key={tone.value} className={value.tone === tone.value ? 'tone on' : 'tone'}>
                <input
                  type="radio"
                  name="tone"
                  value={tone.value}
                  checked={value.tone === tone.value}
                  disabled={busy}
                  onChange={() => onChange('tone', tone.value)}
                />
                {tone.label}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {errors.form && <p className="error block">{errors.form}</p>}
      <p className="notice">입력한 자료를 로컬 브리프 파일로 저장합니다. 저장한 뒤 사용 중인 AI 에이전트에게 카드뉴스 생성을 요청하세요.</p>
      <div className="actions">
        <button type="submit" disabled={busy || readingFile}>
          {busy ? '저장 중…' : readingFile ? '파일 읽는 중…' : '브리프 저장'}
        </button>
      </div>
    </form>
  );
}
