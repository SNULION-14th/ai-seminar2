import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark';

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}
