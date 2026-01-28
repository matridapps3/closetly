import { useNavigationDirection } from '@/contexts/NavigationContext';
import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabBar() {

    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const bottomInset = insets.bottom;
    const { setNavigationDirection } = useNavigationDirection();

    // Define tab order for animation direction
    const tabOrder = ["Dashboard", "Inventory", "Hamper", "Analytics"];
    const previousTabRef = useRef<string | null>(null);

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
  
  
    // Navigation handler with directional animation
    const handleNavigation = (tab: string) => {
      // Don't navigate if already on the same tab
      if (tab === currentActive) {
        return;
      }

      Vibration.vibrate(10);

      const currentIndex = tabOrder.indexOf(currentActive);
      const targetIndex = tabOrder.indexOf(tab);
      
      // Safety check: if tab not found in order, default to right animation
      if (currentIndex === -1 || targetIndex === -1) {
        setNavigationDirection('right');
        setActive(tab);
        previousTabRef.current = currentActive;
        requestAnimationFrame(() => {
          if (tab === "Dashboard") {
            router.replace("/(tabs)/WardrobeFlowDashboard");
          } else if (tab === "Inventory") {
            router.replace("/(tabs)/InventoryManager");
          } else if (tab === "Hamper") {
            router.replace("/(tabs)/VirtualHamper");
          } else if (tab === "Analytics") {
            router.replace("/(tabs)/AnalyticsLab");
          }
        });
        return;
      }
      
      // Determine direction: going left (lower index) means slide from left
      const isGoingLeft = targetIndex < currentIndex;
      
      // Set navigation direction BEFORE navigation so Stack picks it up
      setNavigationDirection(isGoingLeft ? 'left' : 'right');
      
      setActive(tab);
      previousTabRef.current = currentActive;

      // Use requestAnimationFrame to ensure direction state update is processed
      // before navigation triggers
      requestAnimationFrame(() => {
        if (tab === "Dashboard") {
          router.replace("/(tabs)/WardrobeFlowDashboard");
        } else if (tab === "Inventory") {
          router.replace("/(tabs)/InventoryManager");
        } else if (tab === "Hamper") {
          router.replace("/(tabs)/VirtualHamper");
        } else if (tab === "Analytics") {
          router.replace("/(tabs)/AnalyticsLab");
        }
      });
    };

  return (
    <View style={{paddingBottom: bottomInset, paddingLeft: 10, paddingRight: 10, height: 90 + bottomInset, backgroundColor: '#161616', borderTopWidth: 1, borderTopColor:'#303030', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, flexDirection:'row', justifyContent:'space-around', alignItems:'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 4, overflow: 'hidden'}}>
      <Pressable onPress={() => handleNavigation("Dashboard")} style={({ pressed }) => ({ position:'relative', borderRadius: 8, backgroundColor: currentActive === "Dashboard" ? 'rgba(2, 208, 231, 0.25)' : pressed ? 'rgba(255, 255, 255, 0.05)' : 'transparent', minWidth: 80, alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8 })}>
        <Image source={require('@/assets/images/dashboard.png')} style={{width: 26, height: 26}} />
        <Text style={{fontSize: 12, color: currentActive === "Dashboard" ? '#F3F3F3' : '#F3F3F3', fontWeight: currentActive === "Dashboard" ? '600' : '500', letterSpacing: 0.3}}>Dashboard</Text>
      </Pressable>
      <Pressable onPress={() => handleNavigation("Inventory")} style={({ pressed }) => ({ position:'relative', borderRadius: 8, backgroundColor: currentActive === "Inventory" ? 'rgba(2, 208, 231, 0.25)' : pressed ? 'rgba(255, 255, 255, 0.05)' : 'transparent', minWidth: 80, alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8 })}>
        <Image source={require('@/assets/images/inventory.png')} style={{width: 26, height: 26}} />
        <Text style={{fontSize: 12, color: currentActive === "Inventory" ? '#F3F3F3' : '#F3F3F3', fontWeight: currentActive === "Inventory" ? '600' : '500', letterSpacing: 0.3}}>Inventory</Text>
      </Pressable>
      <Pressable onPress={() => handleNavigation("Hamper")} style={({ pressed }) => ({ position:'relative', borderRadius: 8, backgroundColor: currentActive === "Hamper" ? 'rgba(2, 208, 231, 0.25)' : pressed ? 'rgba(255, 255, 255, 0.05)' : 'transparent', minWidth: 80, alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8 })}>
        <Image source={require('@/assets/images/hamper.png')} style={{width: 26, height: 26}} />
        <Text style={{fontSize: 12, color: currentActive === "Hamper" ? '#F3F3F3' : '#F3F3F3', fontWeight: currentActive === "Hamper" ? '600' : '500', letterSpacing: 0.3}}>Hamper</Text>
      </Pressable>
      <Pressable onPress={() => handleNavigation("Analytics")} style={({ pressed }) => ({ position:'relative', borderRadius: 8, backgroundColor: currentActive === "Analytics" ? 'rgba(2, 208, 231, 0.25)' : pressed ? 'rgba(255, 255, 255, 0.05)' : 'transparent', minWidth: 80, alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8 })}>
        <Image source={require('@/assets/images/analytics.png')} style={{width: 26, height: 26}} />
        <Text style={{fontSize: 12, color: currentActive === "Analytics" ? '#F3F3F3' : '#F3F3F3', fontWeight: currentActive === "Analytics" ? '600' : '500', letterSpacing: 0.3}}>Analytics</Text>
      </Pressable>
    </View>
  );
}