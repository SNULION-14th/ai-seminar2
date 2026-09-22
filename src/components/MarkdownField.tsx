import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createMarkdownLoader } from '../lib/markdownFile';

type Props = {
  label: string;
  hint: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onReadingChange: (reading: boolean) => void;
};

// 업로드와 붙여넣기가 같은 상태를 쓴다. 서버에는 파일이 아니라 현재 텍스트를 보낸다.
export default function MarkdownField({ label, hint, value, error, disabled, onChange, onReadingChange }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState('');

  const [reader] = useState(createMarkdownLoader);
  const [reading, setReading] = useState(false);

  // 저장 등으로 입력이 잠기는 순간 이미 시작한 읽기도 무효화한다.
  useLayoutEffect(() => { if (disabled) reader.cancel(); }, [disabled, reader]);
  useEffect(() => () => reader.cancel(false), [reader]);

  function loadFile(file: File): void {
    if (disabled) return;
    reader.cancel();
    setFileError('');
    if (value.trim() && !window.confirm(`${label}의 현재 내용을 파일 내용으로 바꿉니다. 계속할까요?`)) return;
    setReading(true);
    onReadingChange(true);
    void reader.read(file, {
      onText: onChange,
      onError: setFileError,
      onSettled: () => {
        setReading(false);
        onReadingChange(false);
      },
    });
  }

  return (
    <div className="field">
      <div className="field-head">
        <label htmlFor={id}>{label}</label>
        <button type="button" className="ghost" disabled={disabled} onClick={() => inputRef.current?.click()}>
          .md 불러오기
        </button>
      </div>
      <p className="hint">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept=".md,text/markdown"
        hidden
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) loadFile(file);
        }}
      />
      <textarea
        id={id}
        rows={8}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          reader.cancel();
          setFileError('');
          onChange(event.target.value);
        }}
        placeholder="Markdown을 붙여넣거나 파일을 불러오세요."
      />
      {reading && <p className="hint" role="status">파일을 읽는 중입니다. 직접 입력하면 파일 읽기를 취소합니다.</p>}
      <div className="field-foot">
        <span>{[...value.trim()].length.toLocaleString()}자</span>
        {(error || fileError) && <span className="error">{fileError || error}</span>}
      </div>
    </div>
  );
}
