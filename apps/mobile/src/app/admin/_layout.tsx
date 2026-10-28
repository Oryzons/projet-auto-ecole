import { Stack } from 'expo-router';

import { stackOptions } from '@/navigation';

export default function AdminLayout() {
  return <Stack screenOptions={stackOptions} />;
}
