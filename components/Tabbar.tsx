import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabBar() {

    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const bottomInset = insets.bottom;

    const getActiveTab = () => {
      if (pathname?.includes('WardrobeFlowDashboard') || pathname === '/(tabs)/' || pathname === '/(tabs)') {
        return "Dashboard";
      }
      if (pathname?.includes('InventoryManager')) {
        return "Inventory";
      }
      if (pathname?.includes('VirtualHamper')) {
        return "Hamper";
      }
      if (pathname?.includes('AnalyticsLab')) {
        return "Analytics";
      }
      return "Dashboard"; // default
    };

    const [active, setActive] = useState("Dashboard");
    const currentActive = getActiveTab() || active;
  
  
    // Navigation handler using if-else
    const handleNavigation = (tab: string) => {
      Vibration.vibrate(10);

      setActive(tab); 
      if (tab === "Dashboard") {
        router.push("/(tabs)/WardrobeFlowDashboard");
      } else if (tab === "Inventory") {
        router.push("/(tabs)/InventoryManager");
      } else if (tab === "Hamper") {
        router.push("/(tabs)/VirtualHamper");
      } else if (tab === "Analytics") {
        router.push("/(tabs)/AnalyticsLab");
      }
    };

  return (
    <View style={{paddingBottom: bottomInset, paddingLeft: 10, paddingRight: 10, height: 90 + bottomInset, backgroundColor: '#000000', borderTopWidth: 2, borderTopColor:'grey', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, flexDirection:'row', justifyContent:'space-around', alignItems:'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 4, overflow: 'hidden'}}>
      <Pressable onPress={() => handleNavigation("Dashboard")} style={({ pressed }) => ({ position:'relative', borderRadius: 8, backgroundColor: currentActive === "Dashboard" ? 'rgba(0, 229, 255, 0.25)' : pressed ? 'rgba(255, 255, 255, 0.05)' : 'transparent', minWidth: 80, alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8 })}>
        <Image source={require('@/assets/images/dashboard.png')} style={{width: 26, height: 26}} />
        <Text style={{fontSize: 12, color: currentActive === "Dashboard" ? '#F3F3F3' : '#F3F3F3', fontWeight: currentActive === "Dashboard" ? '600' : '500', letterSpacing: 0.3}}>Dashboard</Text>
      </Pressable>
      <Pressable onPress={() => handleNavigation("Inventory")} style={({ pressed }) => ({ position:'relative', borderRadius: 8, backgroundColor: currentActive === "Inventory" ? 'rgba(0, 229, 255, 0.25)' : pressed ? 'rgba(255, 255, 255, 0.05)' : 'transparent', minWidth: 80, alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8 })}>
        <Image source={require('@/assets/images/inventory.png')} style={{width: 26, height: 26}} />
        <Text style={{fontSize: 12, color: currentActive === "Inventory" ? '#F3F3F3' : '#F3F3F3', fontWeight: currentActive === "Inventory" ? '600' : '500', letterSpacing: 0.3}}>Inventory</Text>
      </Pressable>
      <Pressable onPress={() => handleNavigation("Hamper")} style={({ pressed }) => ({ position:'relative', borderRadius: 8, backgroundColor: currentActive === "Hamper" ? 'rgba(0, 229, 255, 0.25)' : pressed ? 'rgba(255, 255, 255, 0.05)' : 'transparent', minWidth: 80, alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8 })}>
        <Image source={require('@/assets/images/hamper.png')} style={{width: 26, height: 26}} />
        <Text style={{fontSize: 12, color: currentActive === "Hamper" ? '#F3F3F3' : '#F3F3F3', fontWeight: currentActive === "Hamper" ? '600' : '500', letterSpacing: 0.3}}>Hamper</Text>
      </Pressable>
      <Pressable onPress={() => handleNavigation("Analytics")} style={({ pressed }) => ({ position:'relative', borderRadius: 8, backgroundColor: currentActive === "Analytics" ? 'rgba(0, 229, 255, 0.25)' : pressed ? 'rgba(255, 255, 255, 0.05)' : 'transparent', minWidth: 80, alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8 })}>
        <Image source={require('@/assets/images/analytics.png')} style={{width: 26, height: 26}} />
        <Text style={{fontSize: 12, color: currentActive === "Analytics" ? '#F3F3F3' : '#F3F3F3', fontWeight: currentActive === "Analytics" ? '600' : '500', letterSpacing: 0.3}}>Analytics</Text>
      </Pressable>
    </View>
  );
}