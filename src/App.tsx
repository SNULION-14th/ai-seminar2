import { useState } from 'react';
import './App.css';
import { Banner } from './components/Banner';
import { FocusTasks } from './components/FocusTasks';
import { Header } from './components/Header';
import { OtherTasks } from './components/OtherTasks';
import { ProgressCard } from './components/ProgressCard';
import { TaskInput } from './components/TaskInput';
import type { Task } from './types/todo';

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Review Q3 roadmap feedback',
    completed: true,
    completedAt: '11:20 AM',
    isFocus: true,
    createdAt: '2026-09-19T09:00:00Z',
  },
  {
    id: '2',
    title: 'Draft quarterly product proposal',
    completed: true,
    completedAt: '3:44 PM',
    isFocus: true,
    createdAt: '2026-09-19T10:30:00Z',
  },
  {
    id: '3',
    title: 'Team sprint sync',
    completed: true,
    completedAt: '3:44 PM',
    isFocus: true,
    createdAt: '2026-09-19T14:00:00Z',
  },
  {
    id: '4',
    title: 'Submit expense report',
    completed: false,
    isFocus: false,
    createdAt: '2026-09-19T15:00:00Z',
  },
  {
    id: '5',
    title: 'Reply to client emails',
    completed: false,
    isFocus: false,
    createdAt: '2026-09-19T15:15:00Z',
  },
];

function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [streak, setStreak] = useState<number>(4);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const formatCurrentTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const focusTasks = tasks.filter((t) => t.isFocus);
  const otherTasks = tasks.filter((t) => !t.isFocus);

  const completedFocusCount = focusTasks.filter((t) => t.completed).length;
  const isAllFocusDone =
    focusTasks.length > 0 && completedFocusCount === focusTasks.length;

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const nextCompleted = !task.completed;
          return {
            ...task,
            completed: nextCompleted,
            completedAt: nextCompleted ? formatCurrentTime() : undefined,
          };
        }
        return task;
      })
    );
  };

  const handleAddTask = (title: string, asFocus: boolean) => {
    const canBeFocus = asFocus && focusTasks.length < 3;
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      isFocus: canBeFocus,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleRemoveTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handlePromoteToFocus = (id: string) => {
    if (focusTasks.length >= 3) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isFocus: true } : t))
    );
  };

  const handleReset = () => {
    setTasks(INITIAL_TASKS);
    setStreak(4);
    setShowSettings(false);
  };

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : ''}`}>
      <main className={`app-card ${darkMode ? 'dark' : ''}`}>
        <Header
          streak={streak}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onOpenSettings={() => setShowSettings(true)}
        />

        <ProgressCard
          completedCount={completedFocusCount}
          totalCount={focusTasks.length}
        />

        <Banner isAllCompleted={isAllFocusDone} />

        <FocusTasks
          tasks={focusTasks}
          onToggleTask={handleToggleTask}
          onRemoveTask={handleRemoveTask}
        />

        <OtherTasks
          tasks={otherTasks}
          onToggleTask={handleToggleTask}
          onPromoteToFocus={handlePromoteToFocus}
          canPromote={focusTasks.length < 3}
          onRemoveTask={handleRemoveTask}
        />

        <TaskInput
          onAddTask={handleAddTask}
          canAddFocus={focusTasks.length < 3}
        />
      </main>

      {showSettings && (
        <div
          className="settings-modal-backdrop"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="settings-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-modal-header">
              <h2>Settings & Options</h2>
              <button
                type="button"
                className="settings-modal-close"
                onClick={() => setShowSettings(false)}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
              FocusFlow Todo App matching Figma Design.
            </p>
            <button
              type="button"
              className="settings-reset-btn"
              onClick={handleReset}
            >
              Reset Sample Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
