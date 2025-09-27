import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';

interface GroupLine {
  id: string;
  active: boolean;
  max: number;
  min: number;
  question: string;
  actual?: number;
}

interface PlayerResponse {
  type: 'over' | 'under';
  line: number;
}

export default function TeamDetail() {
  const { teamId, teamName } = useLocalSearchParams();
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  
  const [groupLines, setGroupLines] = useState<GroupLine[]>([]);
  const [playerResponses, setPlayerResponses] = useState<{[key: string]: PlayerResponse}>({});
  const [customLines, setCustomLines] = useState<{[key: string]: number}>({});
  const [selectedTypes, setSelectedTypes] = useState<{[key: string]: 'over' | 'under'}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupLines();
    fetchPlayerResponses();
  }, [teamId]);

  const fetchGroupLines = async () => {
    try {
      const q = query(collection(db, 'groupLines'), where('active', '==', true));
      const querySnapshot = await getDocs(q);
      const lines: GroupLine[] = [];
      
      querySnapshot.forEach((doc) => {
        lines.push({ id: doc.id, ...doc.data() } as GroupLine);
      });
      
      setGroupLines(lines);
    } catch (error) {
      console.error('Error fetching group lines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerResponses = async () => {
    if (!user || !teamId) return;
    
    try {
      const teamRef = doc(db, 'teams', teamId as string);
      const teamSnap = await getDoc(teamRef);
      
      if (teamSnap.exists()) {
        const teamData = teamSnap.data();
        const responses = teamData.playerResponses?.[user.uid] || {};
        setPlayerResponses(responses);
      }
    } catch (error) {
      console.error('Error fetching player responses:', error);
    }
  };

  const handleConfirmBet = async (lineId: string) => {
    const selectedType = selectedTypes[lineId];
    const customLine = customLines[lineId];
    
    if (!selectedType || !customLine || !user) {
      Alert.alert('Error', 'Please select over/under and set a line value');
      return;
    }

    const groupLine = groupLines.find(gl => gl.id === lineId);
    if (!groupLine || customLine < groupLine.min || customLine > groupLine.max) {
      Alert.alert('Error', `Line must be between ${groupLine?.min} and ${groupLine?.max}`);
      return;
    }

    try {
      const teamRef = doc(db, 'teams', teamId as string);
      const response = { type: selectedType, line: customLine };
      
      await updateDoc(teamRef, {
        [`playerResponses.${user.uid}.${lineId}`]: response
      });
      
      setPlayerResponses(prev => ({
        ...prev,
        [lineId]: response
      }));
      
      Alert.alert('Bet Confirmed', `You selected ${selectedType.toUpperCase()} ${customLine}`);
    } catch (error) {
      console.error('Error saving bet:', error);
      Alert.alert('Error', 'Failed to save bet');
    }
  };

  const initializeSliderValue = (lineId: string, min: number, max: number) => {
    if (!customLines[lineId]) {
      setCustomLines(prev => ({
        ...prev,
        [lineId]: Math.round((min + max) / 2)
      }));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{teamName}</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Loading bets...</Text>
        ) : (
          <View style={styles.gameSection}>
            <Text style={styles.gameTitle}>Active Bets</Text>
            
            <View style={styles.betsContainer}>
              {groupLines.map((groupLine) => {
                const playerResponse = playerResponses[groupLine.id];
                const hasAnswered = !!playerResponse;
                
                return (
                  <View key={groupLine.id} style={styles.betCard}>
                    <Text style={styles.questionText}>{groupLine.question}</Text>
                    <Text style={styles.rangeText}>
                      Range: {groupLine.min} - {groupLine.max}
                    </Text>
                    
                    {hasAnswered ? (
                      <View style={styles.answeredContainer}>
                        <Text style={styles.answeredText}>
                          ✓ Your bet: {playerResponse.type.toUpperCase()} {playerResponse.line}
                        </Text>
                      </View>
                    ) : (
                      <View>
                        <Text style={styles.inputLabel}>Select Over/Under:</Text>
                        <View style={styles.optionsContainer}>
                          <TouchableOpacity
                            style={[
                              styles.optionButton,
                              selectedTypes[groupLine.id] === 'over' && styles.selectedOption
                            ]}
                            onPress={() => setSelectedTypes(prev => ({
                              ...prev,
                              [groupLine.id]: 'over'
                            }))}
                          >
                            <Text style={[
                              styles.optionText,
                              selectedTypes[groupLine.id] === 'over' && styles.selectedOptionText
                            ]}>Over</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.optionButton,
                              selectedTypes[groupLine.id] === 'under' && styles.selectedOption
                            ]}
                            onPress={() => setSelectedTypes(prev => ({
                              ...prev,
                              [groupLine.id]: 'under'
                            }))}
                          >
                            <Text style={[
                              styles.optionText,
                              selectedTypes[groupLine.id] === 'under' && styles.selectedOptionText
                            ]}>Under</Text>
                          </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.inputLabel}>Your Line: {customLines[groupLine.id] || Math.round((groupLine.min + groupLine.max) / 2)}</Text>
                        <View style={styles.sliderContainer}>
                          <Slider
                            style={styles.slider}
                            minimumValue={groupLine.min}
                            maximumValue={groupLine.max}
                            value={customLines[groupLine.id] || Math.round((groupLine.min + groupLine.max) / 2)}
                            onValueChange={(value) => {
                              setCustomLines(prev => ({
                                ...prev,
                                [groupLine.id]: Math.round(value)
                              }));
                            }}
                            step={1}
                            minimumTrackTintColor="#598392"
                            maximumTrackTintColor="#AEC3B0"
                            thumbStyle={styles.sliderThumb}
                          />
                          <TextInput
                            style={styles.numberInput}
                            value={String(customLines[groupLine.id] || Math.round((groupLine.min + groupLine.max) / 2))}
                            onChangeText={(text) => {
                              const value = parseInt(text) || groupLine.min;
                              if (value >= groupLine.min && value <= groupLine.max) {
                                setCustomLines(prev => ({
                                  ...prev,
                                  [groupLine.id]: value
                                }));
                              }
                            }}
                            keyboardType="numeric"
                          />
                        </View>
                        
                        <TouchableOpacity
                          style={styles.confirmButton}
                          onPress={() => handleConfirmBet(groupLine.id)}
                        >
                          <Text style={styles.confirmButtonText}>Confirm Bet</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
              
              {groupLines.length === 0 && (
                <Text style={styles.noBetsText}>No active bets available</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01161E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 24,
    color: '#EFF6E0',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EFF6E0',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  gameSection: {
    marginBottom: 30,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EFF6E0',
    textAlign: 'center',
    marginBottom: 5,
  },
  gameSubtitle: {
    fontSize: 16,
    color: '#AEC3B0',
    textAlign: 'center',
    marginBottom: 20,
  },
  betsContainer: {
    backgroundColor: '#124559',
    borderRadius: 8,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EFF6E0',
    marginBottom: 15,
  },
  betCard: {
    backgroundColor: '#01161E',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EFF6E0',
    marginBottom: 5,
  },
  lineText: {
    fontSize: 14,
    color: '#AEC3B0',
    marginBottom: 15,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#598392',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
  },
  optionText: {
    color: '#EFF6E0',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  slider: {
    flex: 1,
    height: 40,
    marginRight: 15,
  },
  sliderThumb: {
    backgroundColor: '#EFF6E0',
    width: 20,
    height: 20,
  },
  numberInput: {
    backgroundColor: '#598392',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    color: '#EFF6E0',
    textAlign: 'center',
    width: 60,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#EFF6E0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EFF6E0',
    marginBottom: 5,
  },
  rangeText: {
    fontSize: 14,
    color: '#AEC3B0',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#EFF6E0',
    marginBottom: 8,
    fontWeight: '500',
  },
  answeredContainer: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  answeredText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noBetsText: {
    color: '#AEC3B0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});