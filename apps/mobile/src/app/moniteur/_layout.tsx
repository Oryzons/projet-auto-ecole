import { Stack } from 'expo-router';

import { stackOptions } from '@/navigation';

export default function MoniteurLayout() {
  return <Stack screenOptions={stackOptions} />;
}
