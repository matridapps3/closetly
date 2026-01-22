import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Navbar(){
    const insets = useSafeAreaInsets();
    const topInset = insets.top;
    
    return(
        <View style={{ 
            width: '100%', 
            paddingTop: topInset + 8,
            paddingBottom: 16,
            backgroundColor: '#000000', 
            borderBottomWidth: 2, 
            borderBottomColor: 'rgba(107, 107, 107, 0.67)', 
            paddingLeft: 20, 
            paddingRight: 20,
        }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <Text style={{ 
                    color: '#FFFFFF', 
                    fontSize: 19, 
                    fontWeight: '700',
                    letterSpacing: 0.5,
                    textShadowColor: 'rgba(0, 229, 255, 0.3)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                }}>
                    WardrobeFlow
                </Text>
            </View>
        </View>
    )
}