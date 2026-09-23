export type Day = '월' | '화' | '수' | '목' | '금' | '토' | '일';

export interface BestSlot {
  key: string;
  day: string;
  hour: number;
  count: number;
}

export interface HeaderProps {
  studyName: string;
  onReset: () => void;
}

export interface BestSlotBannerProps {
  bestSlot: BestSlot | null;
  totalVotes?: number;
}

export interface TimeSlotCellProps {
  day: string;
  hour: number;
  count: number;
  isSelected: boolean;
  isBest: boolean;
  onClick: () => void;
}

export interface TimeGridProps {
  votes: Record<string, number>;
  mySelected: string[];
  bestSlot: BestSlot | null;
  onSlotClick: (slotKey: string) => void;
}
