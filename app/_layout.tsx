import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// Disabled for Expo Go compatibility - worklets mismatch causes crash
// import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NavigationProvider } from '@/contexts/NavigationContext';
import { WardrobeProvider } from '@/contexts/WardrobeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <NavigationProvider>
          <WardrobeProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="light" />
          </WardrobeProvider>
        </NavigationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
