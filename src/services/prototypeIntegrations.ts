import type { ActionPlan, EventItem, NotionContext, ProposedAction } from "../types";

/**
 * Browser-only stand-in for the future Google, Notion, and AI adapters.
 * Keeping this boundary means UI/state code will not need to change when a
 * server-backed integration replaces the prototype.
 */
export const integrationMode = "prototype" as const;

const notionPages = [
  { id: "page-1", title: "OS Coursework & Notes", url: "https://notion.so/os-coursework", snippet: "Pintos synchronization primitives, thread scheduling, and kernel notes." },
  { id: "page-2", title: "Operating Systems Lab Workspace", url: "https://notion.so/os-lab", snippet: "Code snippets, GDB test commands, and debugging diary." },
  { id: "page-3", title: "Architecture Exam Prep", url: "https://notion.so/arch-exam-prep", snippet: "Formula sheets, past exam reviews, and flashcards." },
  { id: "page-4", title: "Fall 2026 Semester Dashboard", url: "https://notion.so/fall-2026", snippet: "Course schedules, credit breakdown, and syllabus links." },
];

const makeActions = (titles: string[]): ProposedAction[] =>
  titles.map((title, index) => ({ id: `act-${Date.now()}-${index}`, title }));

export const requestActionPlan = async (event: EventItem): Promise<ActionPlan> => {
  // Deliberate latency makes loading states testable without claiming an API call.
  await new Promise((resolve) => window.setTimeout(resolve, 350));

  if (!event.needsPreparation) {
    return { eventId: event.id, eventTitle: event.title, actions: [], noPreparationNeeded: true };
  }

  const title = event.title.toLowerCase();
  const actions = title.includes("assignment") || title.includes("project")
    ? makeActions(["Review assignment requirements & specifications", "Implement solution and write tests", "Verify test suite and write report", "Submit code and report to portal"])
    : title.includes("midterm") || title.includes("exam")
      ? makeActions(["Consolidate lecture notes and lecture slides", "Solve past exam questions (2024-2025)", "Review mock questions and weak concepts"])
      : makeActions([`Outline agenda and materials for ${event.title}`, "Review background context and prior notes"]);

  return { eventId: event.id, eventTitle: event.title, actions };
};

export const isValidActionPlan = (actions: ProposedAction[]) =>
  actions.length > 0 && actions.every((action) => action.title.trim().length > 0);

export const searchPrototypeNotionPages = (query: string): NotionContext[] => {
  const normalizedQuery = query.toLowerCase().trim();
  return notionPages
    .filter((page) => !normalizedQuery || page.title.toLowerCase().includes(normalizedQuery) || page.snippet.toLowerCase().includes(normalizedQuery))
    .map((page) => ({ id: `ctx-${page.id}`, type: "LINK", pageTitle: page.title, url: page.url, snippet: page.snippet, pageId: page.id }));
};
