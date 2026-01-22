import Navbar from '@/components/Navbar';
import TabBar from '@/components/Tabbar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={{flex: 1, backgroundColor: '#000000'}}>
      <Navbar />
      <Stack screenOptions={{ headerShown: false }} initialRouteName="WardrobeFlowDashboard">
        <Stack.Screen name="index" />
        <Stack.Screen name="WardrobeFlowDashboard" />
        <Stack.Screen name="InventoryManager" />
        <Stack.Screen name="VirtualHamper" />
        <Stack.Screen name="AnalyticsLab" />
        <Stack.Screen name="explore" />
      </Stack>
      <TabBar />
    </View>
  );
}
