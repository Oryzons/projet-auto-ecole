import { Stack } from 'expo-router';

import { stackOptions } from '@/navigation';

export default function EleveLayout() {
  return <Stack screenOptions={stackOptions} />;
}
