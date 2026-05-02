import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppContextProvider } from '../hooks/useAppContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppContextProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AppContextProvider>
    </SafeAreaProvider>
  );
}
