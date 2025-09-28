import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { FirebaseService } from '@/utils/firebaseService';

const CoinManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  const addCoins = async (amount: number) => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    setLoading(true);
    try {
      const success = await FirebaseService.updateUserCoins(user.uid, amount);
      if (success) {
        Alert.alert('Success', `Added ${amount} coins to your account!`);
      } else {
        Alert.alert('Error', 'Failed to add coins');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add coins');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coin Manager (Testing)</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => addCoins(100)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>+100 Coins</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => addCoins(500)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>+500 Coins</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => addCoins(1000)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>+1000 Coins</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#124559',
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#598392',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EFF6E0',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#598392',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#01161E',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default CoinManager;