import React, { createContext, useContext, useState, useEffect } from "react";
import type { EventItem, TaskItem, ActionPlan, NotionContext } from "../types";
import {
  integrationMode,
  requestActionPlan,
  searchPrototypeNotionPages,
} from "../services/prototypeIntegrations";

interface WorkspaceContextType {
  events: EventItem[];
  tasks: TaskItem[];
  activePlan: ActionPlan | null;
  preparationStatus: "idle" | "loading" | "error";
  preparationError: string | null;
  integrationMode: "prototype";
  addEvent: (event: Omit<EventItem, "id">) => void;
  updateEvent: (id: string, event: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;
  addTask: (task: Omit<TaskItem, "id">) => void;
  updateTask: (id: string, task: Partial<TaskItem>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  startPreparation: (eventId: string) => Promise<void>;
  updateActionInPlan: (index: number, title: string) => void;
  addActionToPlan: (title: string) => void;
  removeActionFromPlan: (index: number) => void;
  regeneratePlan: () => void;
  setActionContext: (index: number, context: NotionContext | undefined) => void;
  confirmActionPlan: () => void;
  cancelPreparation: () => void;
  searchNotionPages: (query: string) => NotionContext[];
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

const INITIAL_EVENTS: EventItem[] = [
  {
    id: "evt-1",
    title: "Operating Systems Assignment 3",
    date: "2026-10-15",
    time: "23:59",
    location: "Canvas Submission",
    description: "Kernel Synchronization & Multithreading implementation in C.",
    needsPreparation: true,
  },
  {
    id: "evt-2",
    title: "Computer Architecture Midterm",
    date: "2026-10-20",
    time: "10:00",
    location: "Building 301, Room 102",
    description: "Pipelining, Cache memory, and Branch Prediction.",
    needsPreparation: true,
  },
  {
    id: "evt-3",
    title: "Lunch with Minsoo",
    date: "2026-10-16",
    time: "12:30",
    location: "Student Cafeteria",
    description: "Catch up over lunch.",
    needsPreparation: false,
  },
];

const INITIAL_TASKS: TaskItem[] = [
  {
    id: "task-1",
    title: "Read Pintos Project 2 Documentation",
    completed: true,
    eventId: "evt-1",
    eventTitle: "Operating Systems Assignment 3",
    dueDate: "2026-10-10",
    notionContext: {
      id: "ctx-1",
      type: "LINK",
      pageTitle: "OS Coursework & Notes",
      url: "https://notion.so/os-coursework",
      snippet: "Pintos synchronization primitives overview and requirements.",
    },
  },
  {
    id: "task-2",
    title: "Review Lecture 8 Slides on Cache Hierarchy",
    completed: false,
    eventId: "evt-2",
    eventTitle: "Computer Architecture Midterm",
    dueDate: "2026-10-18",
    notionContext: {
      id: "ctx-2",
      type: "LINK",
      pageTitle: "Architecture Exam Prep",
      url: "https://notion.so/arch-exam-prep",
      snippet: "Direct mapped vs set-associative cache formulas.",
    },
  },
];

const loadStoredItems = <T,>(key: string, fallback: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;

  try {
    return JSON.parse(saved) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [events, setEvents] = useState<EventItem[]>(() => {
    return loadStoredItems("antigravity_events", INITIAL_EVENTS);
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    return loadStoredItems("antigravity_tasks", INITIAL_TASKS);
  });

  const [activePlan, setActivePlan] = useState<ActionPlan | null>(null);
  const [preparationStatus, setPreparationStatus] = useState<"idle" | "loading" | "error">("idle");
  const [preparationError, setPreparationError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("antigravity_events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("antigravity_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addEvent = (eventData: Omit<EventItem, "id">) => {
    const newEvent: EventItem = {
      ...eventData,
      id: `evt-${Date.now()}`,
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  const updateEvent = (id: string, updated: Partial<EventItem>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated } : e)),
    );
    if (updated.title !== undefined) {
      setTasks((prev) =>
        prev.map((task) =>
          task.eventId === id ? { ...task, eventTitle: updated.title } : task,
        ),
      );
    }
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setTasks((prev) =>
      prev.map((task) =>
        task.eventId === id
          ? { ...task, eventId: undefined, eventTitle: undefined }
          : task,
      ),
    );
  };

  const addTask = (taskData: Omit<TaskItem, "id">) => {
    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}`,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const updateTask = (id: string, updated: Partial<TaskItem>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t)),
    );
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const startPreparation = async (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    setPreparationStatus("loading");
    setPreparationError(null);
    try {
      setActivePlan(await requestActionPlan(event));
      setPreparationStatus("idle");
    } catch {
      setPreparationStatus("error");
      setPreparationError("We could not generate an action plan. Please try again.");
    }
  };

  const updateActionInPlan = (index: number, title: string) => {
    if (!activePlan) return;
    const updatedActions = [...activePlan.actions];
    updatedActions[index] = { ...updatedActions[index], title };
    setActivePlan({ ...activePlan, actions: updatedActions });
  };

  const addActionToPlan = (title: string) => {
    if (!activePlan) return;
    const newAction = {
      id: `act-${Date.now()}`,
      title: title.trim() || "New Action",
    };
    setActivePlan({
      ...activePlan,
      actions: [...activePlan.actions, newAction],
    });
  };

  const removeActionFromPlan = (index: number) => {
    if (!activePlan) return;
    const updated = activePlan.actions.filter((_, i) => i !== index);
    setActivePlan({ ...activePlan, actions: updated });
  };

  const regeneratePlan = async () => {
    if (!activePlan) return;
    const event = events.find((e) => e.id === activePlan.eventId);
    if (!event) return;
    setPreparationStatus("loading");
    try {
      setActivePlan(await requestActionPlan(event));
    } catch {
      setPreparationStatus("error");
      setPreparationError("We could not regenerate the plan. Please try again.");
    } finally {
      setPreparationStatus("idle");
    }
  };

  const setActionContext = (
    index: number,
    context: NotionContext | undefined,
  ) => {
    if (!activePlan) return;
    const updatedActions = [...activePlan.actions];
    updatedActions[index] = {
      ...updatedActions[index],
      notionContext: context,
    };
    setActivePlan({ ...activePlan, actions: updatedActions });
  };

  const confirmActionPlan = () => {
    if (!activePlan || activePlan.noPreparationNeeded) {
      setActivePlan(null);
      return;
    }

    const event = events.find((e) => e.id === activePlan.eventId);
    const dueDate = event?.date;

    // Explicit confirmation: commit actions to Google Tasks
    const newTasks: TaskItem[] = activePlan.actions
      .filter((a) => a.title.trim().length > 0)
      .map((a) => ({
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: a.title,
        completed: false,
        eventId: activePlan.eventId,
        eventTitle: activePlan.eventTitle,
        dueDate: dueDate,
        notionContext: a.notionContext,
      }));

    setTasks((prev) => [...newTasks, ...prev]);
    setActivePlan(null);
  };

  const cancelPreparation = () => {
    setActivePlan(null);
  };

  const searchNotionPages = (query: string): NotionContext[] => {
    return searchPrototypeNotionPages(query);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        events,
        tasks,
        activePlan,
        preparationStatus,
        preparationError,
        integrationMode,
        addEvent,
        updateEvent,
        deleteEvent,
        addTask,
        updateTask,
        toggleTask,
        deleteTask,
        startPreparation,
        updateActionInPlan,
        addActionToPlan,
        removeActionFromPlan,
        regeneratePlan,
        setActionContext,
        confirmActionPlan,
        cancelPreparation,
        searchNotionPages,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
