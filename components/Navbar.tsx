import { Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Navbar(){
    const insets = useSafeAreaInsets();
    const topInset = insets.top;
    
    return(
        <View style={{ 
            width: '100%', 
            paddingTop: topInset + 10,
            paddingBottom: 14,
            backgroundColor: '#000000',
            borderBottomWidth: 2,
            borderBottomColor: '#303030',
            paddingHorizontal: 20,
            justifyContent: 'center',
            shadowColor: '#000000',
            shadowOpacity: 0.25,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
        }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                
                <Image
                  source={require('../assets/images/textlogo.png')}
                  style={{ width: 110, height: 22 }}
                  resizeMode="contain"
                />

                <Image
                  source={require('../assets/images/favicon.png')}
                  style={{ width: 23, height: 23, marginRight: 2 }}
                  resizeMode="contain"
                />
            </View>
        </View>
    )
}