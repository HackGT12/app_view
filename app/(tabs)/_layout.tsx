import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CoinHeader() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.coinHeader, { paddingTop: insets.top + 10 }]}>
      <View style={styles.coinContainer}>
        <Ionicons name="diamond" size={18} color="#EFF6E0" />
        <Text style={styles.coinText}>1,247</Text>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <>
      <CoinHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#01161E',
            borderTopColor: '#124559',
            borderTopWidth: 1,
            height: 90,
            paddingBottom: 30,
            paddingTop: 10,
          },
          tabBarActiveTintColor: '#EFF6E0',
          tabBarInactiveTintColor: '#598392',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chatbot"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  coinHeader: {
    position: 'absolute',
    top: 0,
    right: 20,
    zIndex: 1000,
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#124559',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#598392',
  },
  coinText: {
    color: '#EFF6E0',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
});
