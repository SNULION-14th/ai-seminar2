import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Todo, Priority } from '../types/todo';
import { todoRepository } from '../storage/todoLocalStorageRepository';
import {
  calculateProgress,
  createNewTodo,
  getFocusTasks,
  getInboxTasks,
  MAX_FOCUS_TASKS,
} from '../services/todoService';
import { parseTaskInput } from '../utils/todoParser';
import { getTodayDateString } from '../utils/dateUtils';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => todoRepository.getTodos());
  const [reflection, setReflection] = useState<string>(() => {
    const today = getTodayDateString();
    const logs = todoRepository.getSunsetLogs();
    const todayLog = logs.find((l) => l.date === today);
    return todayLog?.reflection ?? '';
  });
  const [isDayFinished, setIsDayFinished] = useState<boolean>(() => {
    const today = getTodayDateString();
    const logs = todoRepository.getSunsetLogs();
    const todayLog = logs.find((l) => l.date === today);
    return Boolean(todayLog?.reflection);
  });

  // Sync to repository whenever todos state updates
  useEffect(() => {
    todoRepository.saveTodos(todos);
  }, [todos]);

  const focusTodos = useMemo(() => getFocusTasks(todos), [todos]);
  const inboxTodos = useMemo(() => getInboxTasks(todos), [todos]);
  const stats = useMemo(() => calculateProgress(todos), [todos]);
  const isFocusFull = focusTodos.length >= MAX_FOCUS_TASKS;

  const addTodo = useCallback(
    (rawTitle: string, defaultPriority: Priority = 'normal') => {
      if (!rawTitle.trim()) return;

      const { title, priority } = parseTaskInput(rawTitle, defaultPriority);
      if (!title) return;

      setTodos((prev) => {
        const currentFocusCount = getFocusTasks(prev).length;
        const canFocus = currentFocusCount < MAX_FOCUS_TASKS;
        const targetOrder = canFocus
          ? currentFocusCount
          : getInboxTasks(prev).length;

        const newTodo = createNewTodo(title, priority, canFocus, targetOrder);
        return [...prev, newTodo];
      });
    },
    []
  );

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id !== id) return todo;
        const isNowCompleted = todo.status !== 'completed';
        const now = new Date().toISOString();
        return {
          ...todo,
          status: isNowCompleted ? 'completed' : 'today',
          completedAt: isNowCompleted ? now : undefined,
          updatedAt: now,
        };
      })
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const promoteToToday = useCallback((id: string): boolean => {
    let succeeded = false;
    setTodos((prev) => {
      const currentFocusCount = getFocusTasks(prev).length;
      if (currentFocusCount >= MAX_FOCUS_TASKS) {
        succeeded = false;
        return prev;
      }
      succeeded = true;
      const now = new Date().toISOString();
      return prev.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              status: 'today',
              order: currentFocusCount,
              updatedAt: now,
            }
          : todo
      );
    });
    return succeeded;
  }, []);

  const demoteToInbox = useCallback((id: string) => {
    setTodos((prev) => {
      const currentInboxCount = getInboxTasks(prev).length;
      const now = new Date().toISOString();
      return prev.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              status: 'inbox',
              completedAt: undefined,
              order: currentInboxCount,
              updatedAt: now,
            }
          : todo
      );
    });
  }, []);

  const updateTodoTitle = useCallback((id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              title: trimmed,
              updatedAt: new Date().toISOString(),
            }
          : todo
      )
    );
  }, []);

  const saveSunsetReflection = useCallback(
    (text: string) => {
      setReflection(text);
      const today = getTodayDateString();
      todoRepository.saveSunsetLog({
        id: `sunset-${today}`,
        date: today,
        completedCount: stats.completed,
        totalFocusCount: stats.total,
        reflection: text,
        reviewedAt: new Date().toISOString(),
      });
      setIsDayFinished(true);
    },
    [stats.completed, stats.total]
  );

  return {
    todos,
    focusTodos,
    inboxTodos,
    stats,
    isFocusFull,
    reflection,
    isDayFinished,
    addTodo,
    toggleTodo,
    deleteTodo,
    promoteToToday,
    demoteToInbox,
    updateTodoTitle,
    saveSunsetReflection,
  };
}
