export type NotionActionType = 'LINK' | 'APPEND' | 'CREATE';

export interface NotionContext {
  id: string;
  type: NotionActionType;
  pageTitle: string;
  url?: string;
  snippet?: string;
  pageId?: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  needsPreparation: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  eventId?: string;
  eventTitle?: string;
  notionContext?: NotionContext;
  dueDate?: string;
}

export interface ProposedAction {
  id: string;
  title: string;
  notionContext?: NotionContext;
}

export interface ActionPlan {
  eventId: string;
  eventTitle: string;
  actions: ProposedAction[];
  noPreparationNeeded?: boolean;
}
