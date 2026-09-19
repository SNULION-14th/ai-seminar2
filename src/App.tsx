import { useState, useEffect } from 'react';
import type { Task, Priority, FilterType } from './types/todo';
import { INITIAL_TASKS } from './constants/initialTasks';
import { Header } from './components/Header';
import { FocusSection } from './components/FocusSection';
import { InboxSection } from './components/InboxSection';
import { CompletedSection } from './components/CompletedSection';
import { BottomToolbar } from './components/BottomToolbar';
import './App.css';

const LOCAL_STORAGE_KEY = 'focusflow_tasks_v1';

export function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_TASKS;
  });

  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  const handleToggle = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTask = (title: string, priority: Priority) => {
    // If fewer than 3 active focus tasks, assign to focus, else inbox
    const activeFocusCount = tasks.filter(
      (t) => t.category === 'focus' && !t.completed
    ).length;
    const category = activeFocusCount < 3 ? 'focus' : 'inbox';

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      completed: false,
      category,
      priority,
      createdAt: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev]);
  };

  const handlePromoteToFocus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, category: 'focus' } : t))
    );
  };

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const focusTasks = tasks.filter((t) => t.category === 'focus' && !t.completed);
  const inboxTasks = tasks.filter((t) => t.category === 'inbox' && !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="focusflow-app">
      <div className="focusflow-card">
        <Header totalCount={totalCount} completedCount={completedCount} />

        <main className="focusflow-main">
          {filter === 'all' && (
            <>
              <FocusSection
                tasks={focusTasks}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
              <InboxSection
                tasks={inboxTasks}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onPromoteToFocus={handlePromoteToFocus}
              />
              <CompletedSection
                tasks={completedTasks}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            </>
          )}

          {filter === 'focus' && (
            <FocusSection
              tasks={focusTasks}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}

          {filter === 'completed' && (
            <CompletedSection
              tasks={completedTasks}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
        </main>
      </div>

      <BottomToolbar
        currentFilter={filter}
        onFilterChange={setFilter}
        onAddTask={handleAddTask}
      />
    </div>
  );
}

export default App;
