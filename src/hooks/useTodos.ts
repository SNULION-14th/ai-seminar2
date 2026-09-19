import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Todo } from '../types/todo';
import { MAX_TOP3_COUNT } from '../constants/todo';
import { loadTodosFromStorage, saveTodosToStorage } from '../utils/storage';
import { triggerConfetti } from '../utils/confetti';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadTodosFromStorage);

  // Sync with localStorage
  useEffect(() => {
    saveTodosToStorage(todos);
  }, [todos]);

  // Sync across browser tabs
  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key === 'flowdo_todos_v1') {
        setTodos(loadTodosFromStorage());
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Top 3 items
  const top3Todos = useMemo(() => {
    return todos.filter((todo) => todo.isTop3).slice(0, MAX_TOP3_COUNT);
  }, [todos]);

  // Inbox items (uncompleted items not in Top 3)
  const inboxTodos = useMemo(() => {
    return todos.filter((todo) => !todo.isTop3 && !todo.isCompleted);
  }, [todos]);

  // Completed items not in Top 3 (or all completed history)
  const completedNonTop3Todos = useMemo(() => {
    return todos.filter((todo) => !todo.isTop3 && todo.isCompleted);
  }, [todos]);

  // All completed count
  const allCompletedCount = useMemo(() => {
    return todos.filter((todo) => todo.isCompleted).length;
  }, [todos]);

  // Metrics
  const top3CompletedCount = useMemo(() => {
    return top3Todos.filter((t) => t.isCompleted).length;
  }, [top3Todos]);

  const top3Total = top3Todos.length;
  const top3Remaining = top3Total - top3CompletedCount;
  const top3Percentage = top3Total > 0 ? Math.round((top3CompletedCount / top3Total) * 100) : 0;
  const isTop3Full = top3Total >= MAX_TOP3_COUNT;

  // Add todo
  const addTodo = useCallback(
    (title: string, tag: string = 'General') => {
      const trimmed = title.trim();
      if (!trimmed) return;

      const shouldBeTop3 = top3Todos.length < MAX_TOP3_COUNT;

      const newTodo: Todo = {
        id: crypto.randomUUID ? crypto.randomUUID() : `todo-${Date.now()}-${Math.random()}`,
        title: trimmed,
        isCompleted: false,
        isTop3: shouldBeTop3,
        tag,
        createdAt: new Date().toISOString(),
      };

      setTodos((prev) => [newTodo, ...prev]);
    },
    [top3Todos.length]
  );

  // Toggle completion
  const toggleTodo = useCallback((id: string, origin?: { x: number; y: number }) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id !== id) return todo;
        const willBeCompleted = !todo.isCompleted;
        if (willBeCompleted) {
          triggerConfetti(origin?.x, origin?.y);
        }
        return {
          ...todo,
          isCompleted: willBeCompleted,
          completedAt: willBeCompleted ? new Date().toISOString() : undefined,
        };
      })
    );
  }, []);

  // Promote from Inbox to Top 3
  const promoteToTop3 = useCallback((id: string) => {
    setTodos((prev) => {
      const currentTop3Count = prev.filter((t) => t.isTop3).length;
      if (currentTop3Count >= MAX_TOP3_COUNT) {
        alert("Today's Top 3 is currently full (maximum 3 tasks). Demote or complete an item first!");
        return prev;
      }
      return prev.map((todo) => (todo.id === id ? { ...todo, isTop3: true } : todo));
    });
  }, []);

  // Demote from Top 3 to Inbox
  const demoteToInbox = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, isTop3: false } : todo))
    );
  }, []);

  // Delete todo
  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  // Update title
  const updateTodoTitle = useCallback((id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, title: trimmed } : todo))
    );
  }, []);

  return {
    todos,
    top3Todos,
    inboxTodos,
    completedNonTop3Todos,
    allCompletedCount,
    top3CompletedCount,
    top3Total,
    top3Remaining,
    top3Percentage,
    isTop3Full,
    addTodo,
    toggleTodo,
    promoteToTop3,
    demoteToInbox,
    deleteTodo,
    updateTodoTitle,
  };
}
