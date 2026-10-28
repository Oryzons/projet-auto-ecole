import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fadeOptions, stackOptions } from '@/navigation';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={stackOptions}>
          <Stack.Screen name="index" options={fadeOptions} />
          <Stack.Screen name="inscription/confirmee" options={{ ...fadeOptions, gestureEnabled: false }} />
          <Stack.Screen name="eleve" options={{ ...fadeOptions, gestureEnabled: false }} />
          <Stack.Screen name="moniteur" options={fadeOptions} />
          <Stack.Screen name="admin" options={fadeOptions} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
