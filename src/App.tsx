import { useEffect } from 'react';
import type { ThemeMode } from './types/todo';
import { STORAGE_KEY_THEME } from './constants/storage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTodos } from './hooks/useTodos';
import { TodoHeader } from './components/todo/TodoHeader';
import { TodoInput } from './components/todo/TodoInput';
import { TodoList } from './components/todo/TodoList';
import { TodoFilter } from './components/todo/TodoFilter';
import { NudgeBanner } from './components/common/NudgeBanner';
import { Confetti } from './components/common/Confetti';
import './App.css';

export function App() {
  const {
    todos,
    stats,
    filter,
    setFilter,
    shouldShowNudge,
    showCelebration,
    dismissCelebration,
    addTodo,
    toggleTodo,
    toggleStar,
    editTodo,
    deleteTodo,
    clearCompleted,
    reorderTodos,
  } = useTodos();

  const getSystemTheme = (): ThemeMode => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  const [theme, setTheme] = useLocalStorage<ThemeMode>(
    STORAGE_KEY_THEME,
    getSystemTheme()
  );

  // Apply data-theme attribute to root document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="app-container">
      {/* Confetti Celebration on 100% complete */}
      {showCelebration && <Confetti onComplete={dismissCelebration} />}

      <main className="dashboard-wrapper">
        <TodoHeader
          stats={stats}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Daily Focus Mode Nudge (when >= 7 active items) */}
        {shouldShowNudge && <NudgeBanner activeCount={stats.active} />}

        <TodoInput onAddTodo={addTodo} />

        <TodoList
          todos={todos}
          onToggleTodo={toggleTodo}
          onToggleStar={toggleStar}
          onDeleteTodo={deleteTodo}
          onEditTodo={editTodo}
          onReorderTodos={reorderTodos}
        />

        <TodoFilter
          activeCount={stats.active}
          completedCount={stats.completed}
          currentFilter={filter}
          onFilterChange={setFilter}
          onClearCompleted={clearCompleted}
        />
      </main>
    </div>
  );
}

export default App;
