import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { listenToNotificationTaps, scheduleInstructorNotifications } from '@/data/phone-notifications';
import { stackOptions } from '@/navigation';

export default function MoniteurLayout() {
  // rappel 15 min avant chaque leçon et compte rendu à rédiger après
  useEffect(() => {
    scheduleInstructorNotifications().catch(() => {});
  }, []);
  useEffect(() => listenToNotificationTaps(), []);
  return <Stack screenOptions={stackOptions} />;
}
