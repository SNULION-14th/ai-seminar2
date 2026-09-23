import React, { createContext, useContext, useState, useEffect } from 'react';
import type { EventItem, TaskItem, ActionPlan, NotionContext } from '../types';

interface WorkspaceContextType {
  events: EventItem[];
  tasks: TaskItem[];
  activePlan: ActionPlan | null;
  addEvent: (event: Omit<EventItem, 'id'>) => void;
  updateEvent: (id: string, event: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;
  addTask: (task: Omit<TaskItem, 'id'>) => void;
  updateTask: (id: string, task: Partial<TaskItem>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  startPreparation: (eventId: string) => void;
  updateActionInPlan: (index: number, title: string) => void;
  addActionToPlan: (title: string) => void;
  removeActionFromPlan: (index: number) => void;
  regeneratePlan: () => void;
  setActionContext: (index: number, context: NotionContext | undefined) => void;
  confirmActionPlan: () => void;
  cancelPreparation: () => void;
  searchNotionPages: (query: string) => NotionContext[];
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    title: 'Operating Systems Assignment 3',
    date: '2026-10-15',
    time: '23:59',
    location: 'Canvas Submission',
    description: 'Kernel Synchronization & Multithreading implementation in C.',
    needsPreparation: true,
  },
  {
    id: 'evt-2',
    title: 'Computer Architecture Midterm',
    date: '2026-10-20',
    time: '10:00',
    location: 'Building 301, Room 102',
    description: 'Pipelining, Cache memory, and Branch Prediction.',
    needsPreparation: true,
  },
  {
    id: 'evt-3',
    title: 'Lunch with Minsoo',
    date: '2026-10-16',
    time: '12:30',
    location: 'Student Cafeteria',
    description: 'Catch up over lunch.',
    needsPreparation: false,
  }
];

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Read Pintos Project 2 Documentation',
    completed: true,
    eventId: 'evt-1',
    eventTitle: 'Operating Systems Assignment 3',
    dueDate: '2026-10-10',
    notionContext: {
      id: 'ctx-1',
      type: 'LINK',
      pageTitle: 'OS Coursework & Notes',
      url: 'https://notion.so/os-coursework',
      snippet: 'Pintos synchronization primitives overview and requirements.'
    }
  },
  {
    id: 'task-2',
    title: 'Review Lecture 8 Slides on Cache Hierarchy',
    completed: false,
    eventId: 'evt-2',
    eventTitle: 'Computer Architecture Midterm',
    dueDate: '2026-10-18',
    notionContext: {
      id: 'ctx-2',
      type: 'LINK',
      pageTitle: 'Architecture Exam Prep',
      url: 'https://notion.so/arch-exam-prep',
      snippet: 'Direct mapped vs set-associative cache formulas.'
    }
  }
];

const MOCK_NOTION_PAGES = [
  {
    id: 'page-1',
    title: 'OS Coursework & Notes',
    url: 'https://notion.so/os-coursework',
    snippet: 'Pintos synchronization primitives, thread scheduling, and kernel notes.'
  },
  {
    id: 'page-2',
    title: 'Operating Systems Lab Workspace',
    url: 'https://notion.so/os-lab',
    snippet: 'Code snippets, GDB test commands, and debugging diary.'
  },
  {
    id: 'page-3',
    title: 'Architecture Exam Prep',
    url: 'https://notion.so/arch-exam-prep',
    snippet: 'Formula sheets, past exam reviews, and flashcards.'
  },
  {
    id: 'page-4',
    title: 'Fall 2026 Semester Dashboard',
    url: 'https://notion.so/fall-2026',
    snippet: 'Course schedules, credit breakdown, and syllabus links.'
  }
];

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<EventItem[]>(() => {
    const saved = localStorage.getItem('antigravity_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem('antigravity_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [activePlan, setActivePlan] = useState<ActionPlan | null>(null);

  useEffect(() => {
    localStorage.setItem('antigravity_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('antigravity_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addEvent = (eventData: Omit<EventItem, 'id'>) => {
    const newEvent: EventItem = {
      ...eventData,
      id: `evt-${Date.now()}`
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = (id: string, updated: Partial<EventItem>) => {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...updated } : e)));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const addTask = (taskData: Omit<TaskItem, 'id'>) => {
    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}`
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = (id: string, updated: Partial<TaskItem>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)));
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const generatePlanForEvent = (event: EventItem): ActionPlan => {
    if (!event.needsPreparation) {
      return {
        eventId: event.id,
        eventTitle: event.title,
        actions: [],
        noPreparationNeeded: true
      };
    }

    if (event.title.toLowerCase().includes('assignment') || event.title.toLowerCase().includes('project')) {
      return {
        eventId: event.id,
        eventTitle: event.title,
        actions: [
          { id: `act-${Date.now()}-1`, title: 'Review assignment requirements & specifications' },
          { id: `act-${Date.now()}-2`, title: 'Implement solution and write tests' },
          { id: `act-${Date.now()}-3`, title: 'Verify test suite and write report' },
          { id: `act-${Date.now()}-4`, title: 'Submit code and report to portal' }
        ]
      };
    }

    if (event.title.toLowerCase().includes('midterm') || event.title.toLowerCase().includes('exam')) {
      return {
        eventId: event.id,
        eventTitle: event.title,
        actions: [
          { id: `act-${Date.now()}-1`, title: 'Consolidate lecture notes and lecture slides' },
          { id: `act-${Date.now()}-2`, title: 'Solve past exam questions (2024-2025)' },
          { id: `act-${Date.now()}-3`, title: 'Review mock questions and weak concepts' }
        ]
      };
    }

    return {
      eventId: event.id,
      eventTitle: event.title,
      actions: [
        { id: `act-${Date.now()}-1`, title: `Outline agenda and materials for ${event.title}` },
        { id: `act-${Date.now()}-2`, title: `Review background context and prior notes` }
      ]
    };
  };

  const startPreparation = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const plan = generatePlanForEvent(event);
    setActivePlan(plan);
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
      title: title.trim() || 'New Action'
    };
    setActivePlan({ ...activePlan, actions: [...activePlan.actions, newAction] });
  };

  const removeActionFromPlan = (index: number) => {
    if (!activePlan) return;
    const updated = activePlan.actions.filter((_, i) => i !== index);
    setActivePlan({ ...activePlan, actions: updated });
  };

  const regeneratePlan = () => {
    if (!activePlan) return;
    const event = events.find(e => e.id === activePlan.eventId);
    if (!event) return;
    const newPlan = generatePlanForEvent(event);
    setActivePlan(newPlan);
  };

  const setActionContext = (index: number, context: NotionContext | undefined) => {
    if (!activePlan) return;
    const updatedActions = [...activePlan.actions];
    updatedActions[index] = { ...updatedActions[index], notionContext: context };
    setActivePlan({ ...activePlan, actions: updatedActions });
  };

  const confirmActionPlan = () => {
    if (!activePlan || activePlan.noPreparationNeeded) {
      setActivePlan(null);
      return;
    }

    const event = events.find(e => e.id === activePlan.eventId);
    const dueDate = event?.date;

    // Explicit confirmation: commit actions to Google Tasks
    const newTasks: TaskItem[] = activePlan.actions
      .filter(a => a.title.trim().length > 0)
      .map(a => ({
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: a.title,
        completed: false,
        eventId: activePlan.eventId,
        eventTitle: activePlan.eventTitle,
        dueDate: dueDate,
        notionContext: a.notionContext
      }));

    setTasks(prev => [...newTasks, ...prev]);
    setActivePlan(null);
  };

  const cancelPreparation = () => {
    setActivePlan(null);
  };

  const searchNotionPages = (query: string): NotionContext[] => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return MOCK_NOTION_PAGES.map(p => ({
        id: `ctx-${p.id}`,
        type: 'LINK',
        pageTitle: p.title,
        url: p.url,
        snippet: p.snippet,
        pageId: p.id
      }));
    }

    const filtered = MOCK_NOTION_PAGES.filter(
      p => p.title.toLowerCase().includes(q) || p.snippet.toLowerCase().includes(q)
    );

    return filtered.map(p => ({
      id: `ctx-${p.id}`,
      type: 'LINK',
      pageTitle: p.title,
      url: p.url,
      snippet: p.snippet,
      pageId: p.id
    }));
  };

  return (
    <WorkspaceContext.Provider
      value={{
        events,
        tasks,
        activePlan,
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
        searchNotionPages
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
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
