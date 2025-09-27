import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, increment, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface MicroBetOption {
  id: string;
  text: string;
  votes: number;
}

interface MicroBetData {
  actionDescription: string;
  answer: string;
  closedAt: any;
  createdAt: any;
  donation: number;
  maxDonation: number;
  options: MicroBetOption[];
  question: string;
  sponsor: string;
  status: string;
}

export default function Testing() {
  const [messages, setMessages] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [microBetData, setMicroBetData] = useState<MicroBetData | null>(null);
  const [activeMicroBetId, setActiveMicroBetId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [previousMicroBets, setPreviousMicroBets] = useState<MicroBetData[]>([]);
  const [isBetClosed, setIsBetClosed] = useState(false);

  const fetchMicroBetData = async (betId: string) => {
    try {
      const docRef = doc(db, 'microBets', betId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setMicroBetData(docSnap.data() as MicroBetData);
        setIsBetClosed(false);
        setHasVoted(false);
      }
    } catch (error) {
      console.error('Error fetching micro bet:', error);
    }
  };

  const loadPreviousMicroBets = async () => {
    try {
      const q = query(collection(db, 'microBets'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const bets: MicroBetData[] = [];
      
      querySnapshot.forEach((doc) => {
        bets.push(doc.data() as MicroBetData);
      });
      
      setPreviousMicroBets(bets);
    } catch (error) {
      console.error('Error loading previous micro bets:', error);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!activeMicroBetId || hasVoted || isBetClosed) return;
    
    try {
      const docRef = doc(db, 'microBets', activeMicroBetId);
      const optionIndex = microBetData?.options.findIndex(opt => opt.id === optionId);
      
      if (optionIndex !== undefined && optionIndex >= 0) {
        await updateDoc(docRef, {
          [`options.${optionIndex}.votes`]: increment(1)
        });
        
        setHasVoted(true);
        fetchMicroBetData(activeMicroBetId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit vote');
    }
  };

  const getWinnerOption = () => {
    if (!microBetData?.answer) return null;
    return microBetData.options.find(opt => opt.id === microBetData.answer);
  };

  useEffect(() => {
    loadPreviousMicroBets();
    
    const ws = new WebSocket('ws://16.56.9.190:8080');

    ws.onopen = () => {
      setConnectionStatus('Connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, event.data]);
      
      if (data.activeMicroBetId === null) {
        setIsBetClosed(true);
        setActiveMicroBetId(null);
      } else if (data.activeMicroBetId) {
        setActiveMicroBetId(data.activeMicroBetId);
        fetchMicroBetData(data.activeMicroBetId);
      }
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
      
      {microBetData && (
        <View style={styles.microBetContainer}>
          <Text style={styles.question}>{microBetData.question}</Text>
          <Text style={styles.description}>{microBetData.actionDescription}</Text>
          <Text style={styles.sponsor}>Sponsored by: {microBetData.sponsor}</Text>
          <Text style={styles.donation}>Donation: ${microBetData.donation} / ${microBetData.maxDonation}</Text>
          
          {isBetClosed && getWinnerOption() ? (
            <View style={styles.winnerContainer}>
              <Text style={styles.winnerText}>Winner: {getWinnerOption()?.text}</Text>
            </View>
          ) : (
            <View style={styles.optionsContainer}>
              {microBetData.options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionButton, hasVoted && styles.disabledButton]}
                  onPress={() => handleVote(option.id)}
                  disabled={hasVoted || isBetClosed}
                >
                  <Text style={styles.optionText}>{option.text}</Text>
                  <Text style={styles.voteCount}>{option.votes} votes</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
      
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
  microBetContainer: {
    backgroundColor: '#124559',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EFF6E0',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#AEC3B0',
    marginBottom: 8,
  },
  sponsor: {
    fontSize: 12,
    color: '#598392',
    marginBottom: 5,
  },
  donation: {
    fontSize: 12,
    color: '#598392',
    marginBottom: 15,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#598392',
    padding: 12,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  optionText: {
    color: '#EFF6E0',
    fontSize: 14,
    flex: 1,
  },
  voteCount: {
    color: '#AEC3B0',
    fontSize: 12,
  },
  winnerContainer: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  winnerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
