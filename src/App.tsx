import { useState, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { INITIAL_TODOS } from './data/initialTodos';
import type { Todo } from './types/todo';

import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { FocusCard } from './components/FocusCard';
import { TodoList } from './components/TodoList';
import { QuickInput } from './components/QuickInput';
import { ZenModal } from './components/ZenModal';

import './App.css';

function App() {
  const [todos, setTodos] = useLocalStorage<Todo[]>('focusflow_todos_v1', INITIAL_TODOS);
  const [zenTarget, setZenTarget] = useState<Todo | null>(null);

  // 1. 오늘의 1순위 포커스 태스크
  const focusTodo = useMemo(() => {
    // 명시적으로 isFocus가 true인 태스크 우선
    const explicitFocus = todos.find((t) => t.isFocus && t.section === 'today');
    if (explicitFocus) return explicitFocus;

    // 없으면 today 태스크 중 첫 번째 미완료 태스크
    return todos.find((t) => t.section === 'today' && !t.completed) || todos.find((t) => t.section === 'today');
  }, [todos]);

  // 2. Today 태스크 목록 (Focus 카드로 올라간 태스크 제외)
  const todayTodos = useMemo(() => {
    return todos.filter((t) => t.section === 'today' && t.id !== focusTodo?.id);
  }, [todos, focusTodo]);

  // 3. Later 보관함 태스크 목록
  const laterTodos = useMemo(() => {
    return todos.filter((t) => t.section === 'later');
  }, [todos]);

  // 4. 오늘의 진척률 통계
  const stats = useMemo(() => {
    const allTodayTasks = todos.filter((t) => t.section === 'today');
    const totalCount = allTodayTasks.length;
    const completedCount = allTodayTasks.filter((t) => t.completed).length;
    return { totalCount, completedCount };
  }, [todos]);

  // 완료 토글
  const handleToggle = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // 삭제
  const handleDelete = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // 1순위 포커스로 지정
  const handleSetFocus = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => ({
        ...t,
        isFocus: t.id === id,
      }))
    );
  };

  // Later 태스크를 Today로 이동
  const handleMoveToToday = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, section: 'today' } : t))
    );
  };

  // 새 할 일 추가
  const handleAddTodo = ({
    title,
    tag,
    dueTime,
    section,
  }: {
    title: string;
    tag?: string;
    dueTime?: string;
    section: 'today' | 'later';
  }) => {
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      title,
      completed: false,
      tag,
      dueTime,
      section,
      createdAt: Date.now(),
    };

    setTodos((prev) => [...prev, newTodo]);
  };

  // Zen Mode 열기
  const handleStartZenMode = (todo: Todo) => {
    setZenTarget(todo);
  };

  // Zen Mode 완료 처리
  const handleCompleteInZen = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: true } : t))
    );
  };

  return (
    <main className="app-wrapper">
      {/* 1. 상단 헤더 */}
      <Header customDate="9월 18일, 금요일" />

      {/* 2. 오늘의 진척률 프로그레스 바 */}
      <ProgressBar
        completedCount={stats.completedCount}
        totalCount={stats.totalCount}
      />

      {/* 3. 오늘의 1순위 포커스 카드 */}
      <FocusCard
        todo={focusTodo}
        onToggle={handleToggle}
        onStartZenMode={handleStartZenMode}
      />

      {/* 4. Today 목록 및 Later 아코디언 */}
      <TodoList
        todayTodos={todayTodos}
        laterTodos={laterTodos}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onSetFocus={handleSetFocus}
        onMoveToToday={handleMoveToToday}
      />

      {/* 5. 하단 플로팅 인라인 입력창 */}
      <QuickInput onAddTodo={handleAddTodo} />

      {/* 6. Zen Mode 몰입 뽀모도로 모달 */}
      <ZenModal
        isOpen={Boolean(zenTarget)}
        todo={zenTarget}
        onClose={() => setZenTarget(null)}
        onComplete={handleCompleteInZen}
      />
    </main>
  );
}

export default App;
