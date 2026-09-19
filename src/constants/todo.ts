import type { Todo, TodoCategory } from '../types/todo';

export const STORAGE_KEY_TODOS = 'flowdo_todos_v1';
export const STORAGE_KEY_THEME = 'flowdo_theme';
export const MAX_TOP3_COUNT = 3;

export const DEFAULT_CATEGORIES: TodoCategory[] = [
  'Deep work',
  'Meeting',
  'Writing',
  'Admin',
  'Personal',
];

export const INITIAL_TODOS: Todo[] = [
  {
    id: 'figma-top3-1',
    title: 'Finish the Q3 positioning memo',
    isCompleted: false,
    isTop3: true,
    tag: 'Deep work',
    createdAt: '2026-09-19T09:00:00.000Z',
  },
  {
    id: 'figma-top3-2',
    title: 'Review onboarding flow with Mina',
    isCompleted: true,
    isTop3: true,
    tag: 'Meeting',
    createdAt: '2026-09-19T10:00:00.000Z',
    completedAt: '2026-09-19T11:30:00.000Z',
  },
  {
    id: 'figma-top3-3',
    title: 'Ship the pricing page copy edits',
    isCompleted: false,
    isTop3: true,
    tag: 'Writing',
    createdAt: '2026-09-19T11:00:00.000Z',
  },
  {
    id: 'figma-inbox-1',
    title: 'Reply to the vendor security questionnaire',
    isCompleted: false,
    isTop3: false,
    tag: 'Admin',
    createdAt: '2026-09-19T13:00:00.000Z',
  },
  {
    id: 'figma-inbox-2',
    title: 'Draft the December hiring plan',
    isCompleted: false,
    isTop3: false,
    tag: 'Deep work',
    createdAt: '2026-09-19T14:00:00.000Z',
  },
  {
    id: 'figma-inbox-3',
    title: 'Book the offsite venue',
    isCompleted: false,
    isTop3: false,
    tag: 'Personal',
    createdAt: '2026-09-19T14:30:00.000Z',
  },
  {
    id: 'figma-inbox-4',
    title: 'Clear inbox down to zero',
    isCompleted: false,
    isTop3: false,
    tag: 'Admin',
    createdAt: '2026-09-19T15:00:00.000Z',
  },
  {
    id: 'figma-completed-1',
    title: 'Organize team backlog and grooming notes',
    isCompleted: true,
    isTop3: false,
    tag: 'Admin',
    createdAt: '2026-09-19T08:30:00.000Z',
    completedAt: '2026-09-19T09:15:00.000Z',
  },
];
