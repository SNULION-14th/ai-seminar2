export type CategoryTag = '#멋사' | '#개인' | '#생활' | '#학습' | '#업무';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  isFocus?: boolean; // 오늘의 1순위 포커스 여부
  tag?: CategoryTag | string;
  dueTime?: string;  // 예: "18:00"
  section: 'today' | 'later';
  createdAt: number;
}
