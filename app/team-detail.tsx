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

interface TeamData {
  name: string;
  joinCode: string;
  createdBy: string;
  members: string[];
  playerResponses?: {[userId: string]: {[lineId: string]: PlayerResponse}};
}

interface Member {
  id: string;
  name: string;
  score: number;
  isOwner: boolean;
}

interface GameScores {
  homeTeamScore?: number;
  awayTeamScore?: number;
}

export default function TeamDetail() {
  const { teamId, teamName } = useLocalSearchParams();
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bets' | 'members'>('bets');
  const [groupLines, setGroupLines] = useState<GroupLine[]>([]);
  const [playerResponses, setPlayerResponses] = useState<{[key: string]: PlayerResponse}>({});
  const [customLines, setCustomLines] = useState<{[key: string]: number}>({});
  const [selectedTypes, setSelectedTypes] = useState<{[key: string]: 'over' | 'under'}>({});
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [gameScores, setGameScores] = useState<GameScores>({});
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [loading, setLoading] = useState(true);

  const calculatePlayerScore = (playerBets: {[lineId: string]: PlayerResponse}, actualScores: GameScores): number => {
    let totalScore = 0;
    
    Object.entries(playerBets).forEach(([lineId, bet]) => {
      const groupLine = groupLines.find(gl => gl.id === lineId);
      if (!groupLine) return;
      
      // Determine actual score based on question (simplified - assumes team1/team2 mapping)
      const actualScore = groupLine.question.includes('team 1') ? actualScores.homeTeamScore : actualScores.awayTeamScore;
      if (actualScore === undefined) return;
      
      // Check if prediction was correct
      const wasCorrect = (bet.type === 'over' && actualScore > bet.line) || 
                        (bet.type === 'under' && actualScore < bet.line);
      
      if (wasCorrect) {
        const distance = Math.abs(actualScore - bet.line);
        const points = Math.max(5, 30 - distance); // Minimum 5 points
        totalScore += points;
      }
    });
    
    return totalScore;
  };

  useEffect(() => {
    fetchGroupLines();
    fetchTeamData();
    
    // WebSocket connection
    const ws = new WebSocket('ws://10.136.7.78:8080');

    ws.onopen = () => {
      setConnectionStatus('Connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Look for team scores in the WebSocket data
      if (data.homeTeamScore !== undefined || data.awayTeamScore !== undefined) {
        setGameScores({
          homeTeamScore: data.homeTeamScore,
          awayTeamScore: data.awayTeamScore
        });
      }
    };

    ws.onclose = () => {
      setConnectionStatus('Disconnected');
    };

    ws.onerror = () => {
      setConnectionStatus('Error');
    };

    return () => ws.close();
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

  const fetchTeamData = async () => {
    if (!user || !teamId) return;
    
    try {
      const teamRef = doc(db, 'teams', teamId as string);
      const teamSnap = await getDoc(teamRef);
      
      if (teamSnap.exists()) {
        const data = teamSnap.data() as TeamData;
        setTeamData(data);
        const responses = data.playerResponses?.[user.uid] || {};
        setPlayerResponses(responses);
        
        // Fetch real user names
        const memberPromises = data.members.map(async (memberId) => {
          try {
            const userRef = doc(db, 'users', memberId);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : null;
            
            return {
              id: memberId,
              name: userData?.name || 'Unknown User',
              score: 0, // Will be calculated based on actual bets later
              isOwner: memberId === data.createdBy
            };
          } catch (error) {
            console.error('Error fetching user:', error);
            return {
              id: memberId,
              name: 'Unknown User',
              score: 0,
              isOwner: memberId === data.createdBy
            };
          }
        });
        
        const resolvedMembers = await Promise.all(memberPromises);
        setMembers(resolvedMembers);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };

  // Update member scores when game scores change
  useEffect(() => {
    if (!teamData || (gameScores.homeTeamScore === undefined && gameScores.awayTeamScore === undefined)) return;
    
    const updatedMembers = members.map(member => {
      const memberBets = teamData.playerResponses?.[member.id] || {};
      const calculatedScore = calculatePlayerScore(memberBets, gameScores);
      
      return {
        ...member,
        score: calculatedScore
      };
    });
    
    // Sort by score descending
    updatedMembers.sort((a, b) => b.score - a.score);
    setMembers(updatedMembers);
  }, [gameScores, teamData, groupLines]);

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

  if (!selectedGame) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{teamName}</Text>
        </View>

        <View style={styles.gameSelectionContainer}>
          <Text style={styles.gameSelectionTitle}>Select Game</Text>
          
          <TouchableOpacity 
            style={styles.gameCard}
            onPress={() => setSelectedGame('falcons-bucks')}
          >
            <View style={styles.gameHeader}>
              <Text style={styles.gameDate}>Today • 8:00 PM EST</Text>
              <Text style={styles.gameStatus}>LIVE</Text>
            </View>
            
            <View style={styles.teamsContainer}>
              <View style={styles.teamSection}>
                <Text style={styles.teamName}>Atlanta Falcons</Text>
                <Text style={styles.homeIndicator}>HOME</Text>
              </View>
              
              <Text style={styles.vsText}>VS</Text>
              
              <View style={styles.teamSection}>
                <Text style={styles.teamName}>Tampa Bay Buccaneers</Text>
                <Text style={styles.awayIndicator}>AWAY</Text>
              </View>
            </View>
            
            <View style={styles.gameFooter}>
              <Text style={styles.gameType}>NFL Regular Season</Text>
              <Text style={styles.enterText}>Tap to Enter →</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.unavailableGames}>
            <Text style={styles.unavailableTitle}>Coming Soon</Text>
            <View style={styles.unavailableCard}>
              <Text style={styles.unavailableText}>More games will be available soon!</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedGame(null)} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Falcons vs Buccaneers</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bets' && styles.activeTab]}
          onPress={() => setActiveTab('bets')}
        >
          <Text style={[styles.tabText, activeTab === 'bets' && styles.activeTabText]}>
            Bets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            Members
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : activeTab === 'bets' ? (
          <View style={styles.gameSection}>
            <Text style={styles.gameTitle}>Active Bets</Text>
            
            <View style={styles.betsContainer}>
              {groupLines.map((groupLine) => {
                const playerResponse = playerResponses[groupLine.id];
                const hasAnswered = !!playerResponse;
                
                return (
                  <View key={groupLine.id} style={styles.betCard}>
                    <Text style={styles.questionText}>{groupLine.question}</Text>
                    
                    {hasAnswered ? (
                      <View style={styles.answeredContainer}>
                        <Text style={styles.answeredText}>
                          ✓ Your bet: {playerResponse.type.toUpperCase()} {playerResponse.line}
                        </Text>
                      </View>
                    ) : (
                      <View>
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
        ) : (
          <View style={styles.membersSection}>
            <View style={styles.statusContainer}>
              <Text style={[styles.connectionStatus, { color: connectionStatus === 'Connected' ? '#4CAF50' : '#F44336' }]}>
                WebSocket: {connectionStatus}
              </Text>
              {gameScores.homeTeamScore !== undefined && (
                <Text style={styles.scoresText}>
                  Team 1: {gameScores.homeTeamScore} | Team 2: {gameScores.awayTeamScore || 0}
                </Text>
              )}
            </View>
            
            {teamData && (
              <View style={styles.joinCodeContainer}>
                <Text style={styles.joinCodeLabel}>Join Code</Text>
                <Text style={styles.joinCodeValue}>{teamData.joinCode}</Text>
              </View>
            )}
            
            <Text style={styles.leaderboardTitle}>Leaderboard</Text>
            <View style={styles.leaderboardContainer}>
              {members.map((member, index) => (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberRank}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameContainer}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.isOwner && (
                        <Text style={styles.ownerBadge}>★</Text>
                      )}
                    </View>
                    <Text style={styles.memberScore}>{member.score} pts</Text>
                  </View>
                </View>
              ))}
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
    marginBottom: 20,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#124559',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#598392',
  },
  tabText: {
    fontSize: 14,
    color: '#AEC3B0',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#EFF6E0',
  },
  membersSection: {
    flex: 1,
  },
  joinCodeContainer: {
    backgroundColor: '#124559',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  joinCodeLabel: {
    fontSize: 14,
    color: '#AEC3B0',
    marginBottom: 5,
  },
  joinCodeValue: {
    fontSize: 24,
    color: '#EFF6E0',
    fontWeight: 'bold',
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EFF6E0',
    marginBottom: 15,
  },
  leaderboardContainer: {
    gap: 10,
  },
  memberCard: {
    backgroundColor: '#124559',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#598392',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    color: '#EFF6E0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    color: '#EFF6E0',
    fontWeight: '500',
  },
  ownerBadge: {
    fontSize: 18,
    color: '#FFD700',
    marginLeft: 8,
  },
  memberScore: {
    fontSize: 16,
    color: '#AEC3B0',
    fontWeight: '500',
  },
  statusContainer: {
    backgroundColor: '#124559',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  connectionStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  scoresText: {
    fontSize: 14,
    color: '#EFF6E0',
    fontWeight: '500',
  },
  gameSelectionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  gameSelectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EFF6E0',
    textAlign: 'center',
    marginBottom: 30,
  },
  gameCard: {
    backgroundColor: '#124559',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  gameDate: {
    fontSize: 14,
    color: '#AEC3B0',
  },
  gameStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EFF6E0',
    textAlign: 'center',
    marginBottom: 5,
  },
  homeIndicator: {
    fontSize: 12,
    color: '#598392',
    fontWeight: '500',
  },
  awayIndicator: {
    fontSize: 12,
    color: '#AEC3B0',
    fontWeight: '500',
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#598392',
    marginHorizontal: 20,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameType: {
    fontSize: 12,
    color: '#AEC3B0',
  },
  enterText: {
    fontSize: 14,
    color: '#598392',
    fontWeight: '500',
  },
  unavailableGames: {
    marginTop: 20,
  },
  unavailableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#AEC3B0',
    textAlign: 'center',
    marginBottom: 15,
  },
  unavailableCard: {
    backgroundColor: '#124559',
    borderRadius: 8,
    padding: 20,
    opacity: 0.6,
  },
  unavailableText: {
    fontSize: 14,
    color: '#AEC3B0',
    textAlign: 'center',
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