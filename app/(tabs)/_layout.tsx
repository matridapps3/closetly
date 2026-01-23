import Navbar from '@/components/Navbar';
import TabBar from '@/components/Tabbar';
import { useNavigationDirection } from '@/contexts/NavigationContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { navigationDirection } = useNavigationDirection();

  // Determine animation based on direction
  const animationType = useMemo(() => {
    return navigationDirection === 'left' ? 'slide_from_left' : 'slide_from_right';
  }, [navigationDirection]);

  return (
    <View style={{flex: 1, backgroundColor: '#000000'}}>
      <Navbar />
      <Stack 
        screenOptions={{ 
          headerShown: false,
          animation: animationType,
        }} 
        initialRouteName="WardrobeFlowDashboard"
      >
        <Stack.Screen 
          name="index" 
          options={{ animation: animationType }}
        />
        <Stack.Screen 
          name="WardrobeFlowDashboard" 
          options={{ animation: animationType }}
        />
        <Stack.Screen 
          name="InventoryManager" 
          options={{ animation: animationType }}
        />
        <Stack.Screen 
          name="VirtualHamper" 
          options={{ animation: animationType }}
        />
        <Stack.Screen 
          name="AnalyticsLab" 
          options={{ animation: animationType }}
        />
        <Stack.Screen 
          name="explore" 
          options={{ animation: animationType }}
        />
      </Stack>
      <TabBar />
    </View>
  );
}
