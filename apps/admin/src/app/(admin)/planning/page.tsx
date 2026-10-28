import type { Metadata } from 'next';

import { PlanningBoard } from './planning-board';

export const metadata: Metadata = { title: 'Planning' };

export default function Planning() {
  return <PlanningBoard />;
}
