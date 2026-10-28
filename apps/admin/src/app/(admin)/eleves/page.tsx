import type { Metadata } from 'next';

import { StudentsTable } from './students-table';

export const metadata: Metadata = { title: 'Élèves' };

export default function Eleves() {
  return <StudentsTable />;
}
