import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '../constants/colors';
import { AppContextProvider } from '../hooks/useAppContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  const onLayoutRootView = useCallback(async () => {
    setAppReady(true);
    await SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AppContextProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          {!appReady && (
            <View style={styles.splash}>
              <Text style={styles.splashIcon}>🛡️</Text>
              <Text style={styles.splashName}>TrustPause</Text>
              <Text style={styles.splashTagline}>You're safe. Let's check together.</Text>
            </View>
          )}
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </AppContextProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 12,
  },
  splashIcon: {
    fontSize: 72,
  },
  splashName: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.deepNavy,
  },
  splashTagline: {
    fontSize: 16,
    color: Colors.grayText,
  },
});
