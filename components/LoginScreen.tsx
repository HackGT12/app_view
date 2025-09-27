import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      let res: any;
      if (isSignUp) {
        await signUp(email, password, name);
      } else {
        res = await signIn(email, password);
      }

      if (res?.user?.uid) {
        // ✅ Save before navigation
        await AsyncStorage.setItem(
          'user',
          JSON.stringify({ uid: res.user.uid, email: res.user.email })
        );

        // ✅ Now redirect
        router.replace('/');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#598392" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
      
      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#598392"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#598392"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#598392"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleAuth}>
        <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.switchText}>
          {isSignUp
            ? 'Already have an account? Sign In'
            : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01161E',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EFF6E0',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#124559',
    borderColor: '#598392',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    color: '#EFF6E0',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#598392',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#EFF6E0',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  switchText: {
    color: '#598392',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});
