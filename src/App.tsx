import { useEffect, useMemo, useRef, useState } from 'react';
import { CARD_COUNT, validateGenerateInput, type GenerateInput } from '../shared/contracts';
import { extractTokens } from '../shared/designTokens';
import { validateLayout } from '../shared/layout';
import type { TemplateManifest } from '../shared/templateManifest';
import { matchesDraft, sameIdentity, stableStringify, type LayoutResult } from '../shared/workflow';
import BrandForm from './components/BrandForm';
import LayoutPreview from './components/LayoutPreview';
import { loadLayout, saveBrief, type BriefSaved } from './lib/api';
import { copyToClipboard } from './lib/clipboard';
import { loadInput, loadTemplate, saveInput, saveTemplate } from './lib/persist';

/**
 * 조종석.
 *
 * 이건 남이 쓸 서비스가 아니라 내 컴퓨터의 자동화다. 이 화면이 하는 일은 셋뿐이다.
 *   1. 레퍼런스와 입력을 모은다 (그리고 브라우저에 남겨 다음에 채워 둔다)
 *   2. 생성을 누르면 brief/latest.json으로 떨군다
 *   3. 에이전트가 brief/layout.json에 남긴 배치를 불러와 보여 주고 복사하게 한다
 *
 * 모델을 부르는 코드는 여기 없다. 부르는 건 사람이 대화로 한다. 앞서 서버가 claude 명령을
 * 실행하게 만들어 봤지만, 별도 세션은 맥락이 없고 결과를 확인할 길도 없어 접었다.
 */

const EMPTY_INPUT: GenerateInput = {
  brandName: '',
  primaryColor: '#0055ff',
  brandMarkdown: '',
  sourceContent: '',
  outline: '',
  audience: '',
  mustFollow: '',
  tone: 'friendly',
  templateMode: 'strict',
  cardCount: CARD_COUNT.default,
};

export default function App() {
  // 지난번에 넣은 자료를 채워 둔다. 매번 브랜드 자료를 다시 붙여넣는 게 가장 큰 낭비였다.
  const [input, setInput] = useState<GenerateInput>(() => loadInput(EMPTY_INPUT));
  const [template, setTemplate] = useState<TemplateManifest | null>(() => loadTemplate());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<BriefSaved | null>(null);
  const [problem, setProblem] = useState('');
  const [result, setResult] = useState<LayoutResult | null>(null);
  const [loadingLayout, setLoadingLayout] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  // 편집/저장/다시 불러오기 이후 도착한 이전 응답은 화면에 적용하지 않는다.
  const requestVersion = useRef(0);
  // 생성 버튼은 왼쪽 맨 아래, 결과는 오른쪽 맨 위에 뜬다. 눌러도 화면 밖이라 아무 일도
  // 안 일어난 것처럼 보였다. 결과가 생기면 그쪽으로 데려간다.
  const resultsRef = useRef<HTMLDivElement>(null);

  // 새로고침해도 결과는 디스크에 남아 있다. 화면만 잊어버리면 불러올 길이 없어진다.
  useEffect(() => {
    const version = requestVersion.current;
    let active = true;
    void loadLayout().then((next) => {
      if (active && version === requestVersion.current && next) setResult(next);
    }).catch((error: unknown) => {
      if (active && version === requestVersion.current) setProblem(error instanceof Error ? error.message : '결과를 읽지 못했습니다.');
    });
    return () => { active = false; };
  }, []);

  useEffect(() => { saveInput(input); }, [input]);
  useEffect(() => { saveTemplate(template); }, [template]);

  // 저장된 결과는 그 작업의 레퍼런스로 표시한다. 현재 작성 중인 초안은 그대로 둔다.
  const deck = result?.deck ?? null;
  const tokens = useMemo(() => result ? extractTokens(result.manifest) : null, [result]);
  const resultNotes = useMemo(() => {
    if (!result) return [];
    const notes: string[] = [];
    if (!template || stableStringify(result.manifest) !== stableStringify(template)) {
      notes.push('현재 레퍼런스와 다른 레퍼런스로 만든 결과입니다. 미리보기와 Figma 복사는 결과에 저장된 레퍼런스를 사용합니다.');
    }
    if (!matchesDraft(result, input, result.manifest)) {
      notes.push('현재 입력과 다른 내용으로 만든 결과입니다. 작성 중인 입력은 그대로 유지했습니다.');
    }
    if (saved && !sameIdentity(result, saved)) {
      notes.push('이 화면에서 마지막으로 저장한 브리프와 다른 작업의 결과입니다.');
    }
    return notes;
  }, [result, input, template, saved]);

  // 에이전트가 낸 배치도 믿지 않고 검사한다. 넘치거나 겹친 채로 Figma에 넣으면 거기서 고쳐야 한다.
  const check = useMemo(
    () => (result && tokens ? validateLayout(result.deck, tokens, result.input.templateMode) : null),
    [result, tokens],
  );

  const handoff = useMemo(
    () => (result ? JSON.stringify({ kind: 'cardnews', deck: result.deck, manifest: result.manifest,
      referenceMode: result.input.templateMode }, null, 2) : ''),
    [result],
  );

  function invalidateResult(clearResult = false): void {
    requestVersion.current += 1;
    setSaved(null);
    if (clearResult) setResult(null);
    setCopied(false);
    setCopyFailed(false);
    setLoadingLayout(false);
    setProblem('');
  }

  function change<K extends keyof GenerateInput>(field: K, next: GenerateInput[K]): void {
    invalidateResult();
    setInput((current) => ({ ...current, [field]: next }));
    setErrors((current) => (current[field] ? { ...current, [field]: '' } : current));
  }

  function changeTemplate(next: TemplateManifest | null): void {
    invalidateResult();
    setTemplate(next);
  }

  function submit(): void {
    if (busy) return;
    invalidateResult(true);
    const version = requestVersion.current;
    if (!template) {
      setProblem('먼저 레퍼런스를 넣어 주세요. Figma 플러그인의 "① 레퍼런스 읽기" 결과를 붙여넣으면 됩니다.');
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const result = validateGenerateInput(input);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setBusy(true);
    saveBrief(result.data, template)
      .then((next) => {
        if (version !== requestVersion.current) return;
        setSaved(next);
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch((error: unknown) => {
        if (version !== requestVersion.current) return;
        setProblem(error instanceof Error ? error.message : '저장하지 못했습니다.');
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .finally(() => setBusy(false));
  }

  function fetchLayout(): void {
    if (busy || loadingLayout) return;
    const version = ++requestVersion.current;
    setProblem('');
    setCopied(false);
    setCopyFailed(false);
    setLoadingLayout(true);
    loadLayout()
      .then((next) => {
        if (version !== requestVersion.current) return;
        if (!next) {
          setResult(null);
          setProblem('아직 결과가 없습니다. 에이전트에게 "만들어줘"라고 한 뒤 다시 눌러 주세요.');
          return;
        }
        setResult(next);
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch((error: unknown) => {
        if (version !== requestVersion.current) return;
        setResult(null);
        setProblem(error instanceof Error ? error.message : '결과를 읽지 못했습니다.');
      })
      .finally(() => { if (version === requestVersion.current) setLoadingLayout(false); });
  }

  const errorCount = check?.problems.filter((item) => item.severity === 'error').length ?? 0;
  const warnCount = check?.problems.filter((item) => item.severity === 'warning').length ?? 0;

  return (
    <main className="page">
      <header>
        <h1>카드뉴스</h1>
        <p>레퍼런스와 내용을 넣고 브리프를 저장한 뒤, 에이전트에게 카드뉴스 생성을 요청하세요.</p>
      </header>

      <BrandForm
        value={input}
        errors={errors}
        busy={busy}
        onChange={change}
        onSubmit={submit}
        template={template}
        onTemplate={changeTemplate}
      />

      <div className="results" ref={resultsRef}>
        {problem && <p className="error block">{problem}</p>}

        {!saved && !deck && (
          // 여기가 뭐 하는 자리인지 비어 있을 때 말해 준다. 빈 칸만 있으면 고장인 줄 안다.
          <section className="panel empty">
            <h2>여기에 결과가 나옵니다</h2>
            <ol className="handoff-steps">
              <li>왼쪽에 레퍼런스와 내용을 채웁니다.</li>
              <li><b>브리프 저장</b>을 누르면 브리프가 저장됩니다.</li>
              <li>에이전트에게 <b>“만들어줘”</b>라고 합니다.</li>
              <li><b>결과 불러오기</b>를 누르면 이 자리에 미리보기가 뜹니다.</li>
            </ol>
            {/* 이미 만들어 둔 결과가 있을 수 있다. 생성을 다시 누르지 않아도 닿게 둔다. */}
            <div className="actions">
              <button type="button" className="ghost" disabled={busy || loadingLayout} onClick={fetchLayout}>{loadingLayout ? '불러오는 중…' : '결과 불러오기'}</button>
            </div>
          </section>
        )}

        {saved && !deck && (
        <section className="panel">
          <h2>브리프를 저장했습니다</h2>
          <p className="note">
            <code>{saved.saved}</code> · 레퍼런스 {saved.reference}(프레임 {saved.frames}개) · 카드 {saved.cards}장
            {' · '}
            {new Date().toLocaleTimeString('ko-KR')}
          </p>
          <p>
            이제 <b>에이전트에게 “만들어줘”</b>라고 하세요. 다 되면 아래 버튼으로 불러옵니다.
          </p>
          <div className="actions">
            <button type="button" disabled={busy || loadingLayout} onClick={fetchLayout}>{loadingLayout ? '불러오는 중…' : '결과 불러오기'}</button>
          </div>
        </section>
        )}

        {deck && tokens && (
          <section className="panel">
          <div className="result-head">
            <h2>카드 {deck.cards.length}장</h2>
            <button type="button" className="ghost" disabled={busy || loadingLayout} onClick={fetchLayout}>다시 불러오기</button>
          </div>

          {resultNotes.length > 0 && (
            <ul className="checks" aria-label="불러온 결과 안내">
              {resultNotes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          )}

          {check && check.problems.length > 0 && (
            <ul className={errorCount > 0 ? 'checks bad' : 'checks'}>
              {check.problems.map((item, index) => (
                <li key={index}>
                  {item.severity === 'error' ? '✖' : '·'} {item.cardId}번: {item.message}
                </li>
              ))}
            </ul>
          )}
          {check && check.problems.length === 0 && <p className="ok">검사를 모두 통과했습니다.</p>}

          <LayoutPreview deck={deck} tokens={tokens} />
          <p className="note">
            미리보기는 배치를 보는 용도입니다. 폰트가 달라 줄바꿈은 Figma와 다를 수 있습니다.
          </p>

          <h3>Figma로 가져가기</h3>
          <ol className="handoff-steps">
            <li>아래 결과를 복사합니다.</li>
            <li>레퍼런스를 읽었던 Figma 파일에서 카드뉴스 플러그인을 엽니다.</li>
            <li>“② 카드 만들기”에 붙여넣고 생성을 누릅니다.</li>
          </ol>
          <textarea className="handoff-payload" readOnly rows={6} value={handoff} onFocus={(event) => event.target.select()} />
          <div className="actions">
            <button
              type="button"
              disabled={errorCount > 0}
              onClick={() => {
                const version = requestVersion.current;
                setCopied(false);
                setCopyFailed(false);
                void copyToClipboard(handoff).then((next) => {
                  if (version !== requestVersion.current) return;
                  setCopied(next);
                  setCopyFailed(!next);
                });
              }}
            >
              결과 복사
            </button>
            {errorCount > 0 && <span className="error">오류 {errorCount}건을 고친 뒤 가져가세요.</span>}
            {copied && <span className="ok">복사했습니다{warnCount > 0 ? ` (경고 ${warnCount}건은 그대로입니다)` : ''}.</span>}
            {copyFailed && <span className="error" role="alert">자동 복사가 차단됐습니다. 위 결과 상자를 눌러 전체 선택한 뒤 직접 복사해 주세요.</span>}
          </div>
          </section>
        )}
      </div>
    </main>
  );
}
