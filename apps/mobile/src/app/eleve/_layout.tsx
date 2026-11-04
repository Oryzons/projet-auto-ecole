import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { listenToNotificationTaps, scheduleStudentNotifications } from '@/data/phone-notifications';
import { usePrefs } from '@/data/preferences';
import { stackOptions } from '@/navigation';

export default function EleveLayout() {
  const prefs = usePrefs();
  // notifications du téléphone : reprogrammées à chaque changement de réglage
  useEffect(() => {
    scheduleStudentNotifications(prefs).catch(() => {});
  }, [prefs]);
  useEffect(() => listenToNotificationTaps(), []);
  return <Stack screenOptions={stackOptions} />;
}
