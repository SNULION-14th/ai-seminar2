import { useState, useMemo, useCallback } from 'react';
import type { Todo, FilterType, TodoStats } from '../types/todo';
import { STORAGE_KEY_TODOS, FOCUS_MODE_THRESHOLD } from '../constants/storage';
import { useLocalStorage } from './useLocalStorage';

const INITIAL_TODOS: Todo[] = [
  {
    id: '1',
    title: 'Outline the product sprint priorities',
    completed: false,
    starred: true,
    createdAt: Date.now() - 4000,
    order: 0,
  },
  {
    id: '2',
    title: 'Review the design brief with the team',
    completed: false,
    starred: false,
    createdAt: Date.now() - 3000,
    order: 1,
  },
  {
    id: '3',
    title: 'Clear the morning inbox',
    completed: true,
    starred: false,
    createdAt: Date.now() - 2000,
    order: 2,
  },
  {
    id: '4',
    title: 'Save three product research references',
    completed: true,
    starred: false,
    createdAt: Date.now() - 1000,
    order: 3,
  },
  {
    id: '5',
    title: "Set up next week's focus blocks",
    completed: true,
    starred: false,
    createdAt: Date.now(),
    order: 4,
  },
];

export function useTodos() {
  const [todos, setTodos] = useLocalStorage<Todo[]>(STORAGE_KEY_TODOS, INITIAL_TODOS);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCelebration, setShowCelebration] = useState(false);

  // Add a new todo
  const addTodo = useCallback(
    (title: string, starred: boolean = false) => {
      const trimmed = title.trim();
      if (!trimmed) return;

      const newTodo: Todo = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        title: trimmed,
        completed: false,
        starred,
        createdAt: Date.now(),
        order: 0,
      };

      setTodos((prev) => {
        // Shift existing orders
        const updated = prev.map((t) => ({ ...t, order: t.order + 1 }));
        return [newTodo, ...updated];
      });
    },
    [setTodos]
  );

  // Toggle todo completion
  const toggleTodo = useCallback(
    (id: string) => {
      setTodos((prev) => {
        const target = prev.find((t) => t.id === id);
        if (!target) return prev;

        const nextCompleted = !target.completed;
        const updated = prev.map((t) =>
          t.id === id ? { ...t, completed: nextCompleted } : t
        );

        // Check if all became completed with this action
        const remainingActive = updated.filter((t) => !t.completed).length;
        if (remainingActive === 0 && updated.length > 0 && nextCompleted) {
          setShowCelebration(true);
        }

        return updated;
      });
    },
    [setTodos]
  );

  // Toggle starred / pin status
  const toggleStar = useCallback(
    (id: string) => {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t))
      );
    },
    [setTodos]
  );

  // Edit todo title
  const editTodo = useCallback(
    (id: string, newTitle: string) => {
      const trimmed = newTitle.trim();
      if (!trimmed) return;

      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title: trimmed } : t))
      );
    },
    [setTodos]
  );

  // Delete todo
  const deleteTodo = useCallback(
    (id: string) => {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    },
    [setTodos]
  );

  // Clear completed todos
  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }, [setTodos]);

  // Reorder todos (Drag and Drop)
  const reorderTodos = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      if (sourceIndex === destinationIndex) return;

      setTodos((prev) => {
        const result = Array.from(prev);
        const [movedItem] = result.splice(sourceIndex, 1);
        result.splice(destinationIndex, 0, movedItem);

        return result.map((item, index) => ({
          ...item,
          order: index,
        }));
      });
    },
    [setTodos]
  );

  // Filtered and sorted todos
  const filteredTodos = useMemo(() => {
    return todos
      .filter((t) => {
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
      })
      .sort((a, b) => {
        // Pinned/Starred items appear at top when in 'all' or 'active' view
        if (a.starred !== b.starred && !a.completed && !b.completed) {
          return a.starred ? -1 : 1;
        }
        return a.order - b.order;
      });
  }, [todos, filter]);

  // Derived statistics
  const stats: TodoStats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isAllCompleted = total > 0 && completed === total;

    return { total, completed, active, percentage, isAllCompleted };
  }, [todos]);

  // Nudge flag: active tasks >= 7
  const shouldShowNudge = stats.active >= FOCUS_MODE_THRESHOLD;

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  return {
    todos: filteredTodos,
    allTodosCount: todos.length,
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
  };
}
