import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';

export default function Testing() {
  const [messages, setMessages] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  useEffect(() => {
    const ws = new WebSocket('ws://16.56.9.190:8080');

    ws.onopen = () => {
      setConnectionStatus('Connected');
    };

    ws.onmessage = (event) => {
      setMessages(prev => [...prev, event.data]);
    };

    ws.onclose = () => {
      setConnectionStatus('Disconnected');
    };

    ws.onerror = () => {
      setConnectionStatus('Error');
    };

    return () => ws.close();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WebSocket Testing</Text>
      <Text style={[styles.status, { color: connectionStatus === 'Connected' ? '#4CAF50' : '#F44336' }]}>
        Status: {connectionStatus}
      </Text>
      <ScrollView style={styles.messageContainer}>
        {messages.map((msg, idx) => (
          <Text key={idx} style={styles.message}>{msg}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01161E',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EFF6E0',
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  messageContainer: {
    flex: 1,
    backgroundColor: '#124559',
    borderRadius: 8,
    padding: 10,
  },
  message: {
    color: '#EFF6E0',
    fontSize: 14,
    marginBottom: 5,
    padding: 5,
    backgroundColor: '#598392',
    borderRadius: 4,
  },
});
