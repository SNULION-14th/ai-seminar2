import React, { useState, useRef } from 'react';
import { Tag as TagIcon, ArrowUp } from 'lucide-react';
import type { CategoryTag } from '../types/todo';
import { parseTodoInput } from '../utils/parser';

const AVAILABLE_TAGS: CategoryTag[] = ['#개인', '#멋사', '#생활', '#학습', '#업무'];

interface QuickInputProps {
  onAddTodo: (data: {
    title: string;
    tag?: string;
    dueTime?: string;
    section: 'today' | 'later';
  }) => void;
}

export const QuickInput: React.FC<QuickInputProps> = ({ onAddTodo }) => {
  const [inputText, setInputText] = useState('');
  const [selectedTagIndex, setSelectedTagIndex] = useState(0);
  const [targetSection, setTargetSection] = useState<'today' | 'later'>('today');
  const inputRef = useRef<HTMLInputElement>(null);

  const currentTag = AVAILABLE_TAGS[selectedTagIndex];

  const handleCycleTag = () => {
    setSelectedTagIndex((prev) => (prev + 1) % AVAILABLE_TAGS.length);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    // 자연어 파싱 (예: "회의 15:00 #멋사")
    const parsed = parseTodoInput(inputText);

    onAddTodo({
      title: parsed.cleanTitle,
      tag: parsed.tag || currentTag,
      dueTime: parsed.dueTime,
      section: targetSection,
    });

    setInputText('');
    inputRef.current?.focus();
  };

  return (
    <div className="quick-input-container">
      <form className="quick-input-form" onSubmit={handleSubmit}>
        {/* 태그 선택 칩 버튼 (피그마 #5:131) */}
        <button
          type="button"
          className="tag-select-chip"
          onClick={handleCycleTag}
          title="클릭하여 태그 변경"
          aria-label={`선택된 태그: ${currentTag}. 클릭 시 변경`}
        >
          <TagIcon size={12} className="tag-chip-icon" />
          <span className="tag-chip-text">{currentTag}</span>
        </button>

        {/* 인라인 인풋 필드 (피그마 #5:137) */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="새 할 일 추가... (Enter)"
          className="quick-text-input"
          aria-label="새 할 일 입력"
        />

        {/* 오늘 / 나중에 토글 (선택적 UX) */}
        <button
          type="button"
          className={`section-toggle-btn ${targetSection === 'later' ? 'is-later' : ''}`}
          onClick={() => setTargetSection((prev) => (prev === 'today' ? 'later' : 'today'))}
          title={targetSection === 'today' ? '오늘 등록' : '나중에 등록'}
        >
          {targetSection === 'today' ? '오늘' : '보관'}
        </button>

        {/* 추가 제출 버튼 (피그마 #5:140) */}
        <button
          type="submit"
          className="quick-submit-btn"
          disabled={!inputText.trim()}
          aria-label="할 일 추가"
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
};
