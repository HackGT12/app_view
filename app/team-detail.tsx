import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Dimensions,
  Modal,
} from 'react-native';
import { FirebaseService } from '../utils/firebaseService';
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

const { width } = Dimensions.get('window');

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
  const [createBetModal, setCreateBetModal] = useState(false);
  const [newBetQuestion, setNewBetQuestion] = useState('');
  const [newBetMin, setNewBetMin] = useState('');
  const [newBetMax, setNewBetMax] = useState('');
  const [answerModal, setAnswerModal] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [answerValue, setAnswerValue] = useState('');

  const calculatePlayerScore = (playerBets: {[lineId: string]: PlayerResponse}, actualScores: GameScores): number => {
    let totalScore = 0;
    
    Object.entries(playerBets).forEach(([lineId, bet]) => {
      const groupLine = groupLines.find(gl => gl.id === lineId);
      if (!groupLine) return;
      
      let actualScore: number | undefined;
      
      // Check if this is a custom group bet with actual value set
      if (groupLine.actual !== undefined) {
        actualScore = groupLine.actual;
      } else {
        // Use WebSocket scores for default bets
        actualScore = groupLine.question.includes('team 1') ? actualScores.homeTeamScore : actualScores.awayTeamScore;
      }
      
      if (actualScore === undefined) return;
      
      const wasCorrect = (bet.type === 'over' && actualScore > bet.line) || 
                        (bet.type === 'under' && actualScore < bet.line);
      
      if (wasCorrect) {
        const distance = Math.abs(actualScore - bet.line);
        const points = Math.max(5, 30 - distance);
        totalScore += points;
      }
    });
    
    return totalScore;
  };

  useEffect(() => {
    fetchGroupLines();
    fetchTeamData();
    
    const ws = new WebSocket('ws://10.136.7.78:8080');

    ws.onopen = () => {
      setConnectionStatus('Connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
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
      const querySnapshot = await getDocs(collection(db, 'groupLines'));
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
        
        const memberPromises = data.members.map(async (memberId) => {
          try {
            const userRef = doc(db, 'users', memberId);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : null;
            
            return {
              id: memberId,
              name: userData?.name || 'Unknown User',
              score: 0,
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

  const handleCreateBet = async () => {
    if (!user || !newBetQuestion.trim() || !newBetMin || !newBetMax) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const min = parseFloat(newBetMin);
    const max = parseFloat(newBetMax);

    if (isNaN(min) || isNaN(max) || min >= max) {
      Alert.alert('Error', 'Please enter valid range values (min < max)');
      return;
    }

    try {
      const betId = await FirebaseService.createGroupBet(newBetQuestion.trim(), min, max, user.uid);
      if (betId) {
        Alert.alert('Success', 'Group bet created successfully!');
        setNewBetQuestion('');
        setNewBetMin('');
        setNewBetMax('');
        setCreateBetModal(false);
        fetchGroupLines();
      } else {
        Alert.alert('Error', 'Failed to create group bet');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create group bet');
    }
  };

  const handleSetAnswer = async () => {
    if (!user || !selectedLineId || !answerValue.trim()) {
      Alert.alert('Error', 'Please enter an answer');
      return;
    }

    const answer = parseFloat(answerValue);
    if (isNaN(answer)) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    try {
      const success = await FirebaseService.setGroupLineAnswer(selectedLineId, answer, user.uid);
      if (success) {
        Alert.alert('Success', 'Answer set! Bet is now closed.');
        setAnswerValue('');
        setAnswerModal(false);
        setSelectedLineId(null);
        fetchGroupLines();
      } else {
        Alert.alert('Error', 'Failed to set answer');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set answer');
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
          <Text style={styles.gameSelectionTitle}>Select Your Game</Text>
          <Text style={styles.gameSelectionSubtitle}>Choose a live match to start betting</Text>
          
          <TouchableOpacity 
            style={styles.gameCard}
            onPress={() => setSelectedGame('falcons-bucks')}
          >
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            
            <View style={styles.gameHeader}>
              <Text style={styles.gameDate}>Today • 8:00 PM EST</Text>
              <Text style={styles.gameLeague}>NFL</Text>
            </View>
            
            <View style={styles.teamsContainer}>
              <View style={styles.teamSection}>
                <Text style={styles.teamLogo}>🦅</Text>
                <Text style={styles.teamName}>Atlanta Falcons</Text>
                <Text style={styles.homeIndicator}>HOME</Text>
              </View>
              
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
              </View>
              
              <View style={styles.teamSection}>
                <Text style={styles.teamLogo}>🏴‍☠️</Text>
                <Text style={styles.teamName}>Tampa Bay Buccaneers</Text>
                <Text style={styles.awayIndicator}>AWAY</Text>
              </View>
            </View>
            
            <View style={styles.gameFooter}>
              <Text style={styles.enterText}>Tap to Enter Betting →</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonTitle}>More Games Coming Soon</Text>
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonIcon}>⏰</Text>
              <Text style={styles.comingSoonText}>
                We're adding more live games and sports. Stay tuned for updates!
              </Text>
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
        <View style={styles.headerContent}>
          <Text style={styles.title}>Falcons vs Buccaneers</Text>
          <View style={styles.connectionBadge}>
            <View style={[
              styles.connectionDot,
              { backgroundColor: connectionStatus === 'Connected' ? '#22C55E' : '#EF4444' }
            ]} />
            <Text style={[
              styles.connectionText,
              { color: connectionStatus === 'Connected' ? '#22C55E' : '#EF4444' }
            ]}>
              {connectionStatus}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bets' && styles.activeTab]}
          onPress={() => setActiveTab('bets')}
        >
          <Text style={[styles.tabText, activeTab === 'bets' && styles.activeTabText]}>
            🎯 Live Bets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            🏆 Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingEmoji}>⚡</Text>
            <Text style={styles.loadingText}>Loading bets...</Text>
          </View>
        ) : activeTab === 'bets' ? (
          <View style={styles.betsSection}>
            {gameScores.homeTeamScore !== undefined && (
              <View style={styles.liveScoreContainer}>
                <Text style={styles.liveScoreTitle}>Live Score</Text>
                <View style={styles.scoreDisplay}>
                  <View style={styles.scoreTeam}>
                    <Text style={styles.scoreTeamName}>Falcons</Text>
                    <Text style={styles.scoreNumber}>{gameScores.homeTeamScore}</Text>
                  </View>
                  <Text style={styles.scoreSeparator}>-</Text>
                  <View style={styles.scoreTeam}>
                    <Text style={styles.scoreTeamName}>Buccaneers</Text>
                    <Text style={styles.scoreNumber}>{gameScores.awayTeamScore || 0}</Text>
                  </View>
                </View>
              </View>
            )}
            
            <View style={styles.betsHeader}>
              <Text style={styles.sectionTitle}>Active Live Bets</Text>
              <TouchableOpacity 
                style={styles.createBetButton}
                onPress={() => setCreateBetModal(true)}
              >
                <Text style={styles.createBetButtonText}>+ Create Bet</Text>
              </TouchableOpacity>
            </View>
            
            {groupLines.filter(line => line.active).map((groupLine) => {
              const playerResponse = playerResponses[groupLine.id];
              const hasAnswered = !!playerResponse;
              
              return (
                <View key={groupLine.id} style={styles.betCard}>
                  <View style={styles.betCardHeader}>
                    <Text style={styles.questionText}>{groupLine.question}</Text>
                    <Text style={styles.rangeText}>Range: {groupLine.min} - {groupLine.max}</Text>
                    {groupLine.createdBy === user?.uid && groupLine.active && (
                      <TouchableOpacity 
                        style={styles.setAnswerButton}
                        onPress={() => {
                          setSelectedLineId(groupLine.id);
                          setAnswerModal(true);
                        }}
                      >
                        <Text style={styles.setAnswerButtonText}>Set Answer</Text>
                      </TouchableOpacity>
                    )}
                    {groupLine.actual !== undefined && (
                      <Text style={styles.actualText}>Actual: {groupLine.actual}</Text>
                    )}
                  </View>
                  
                  {hasAnswered ? (
                    <View style={styles.answeredContainer}>
                      <View style={styles.answeredBadge}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                      <Text style={styles.answeredText}>
                        Your bet: {playerResponse.type.toUpperCase()} {playerResponse.line}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.bettingInterface}>
                      <View style={styles.optionsContainer}>
                        <TouchableOpacity
                          style={[
                            styles.optionButton,
                            styles.overButton,
                            selectedTypes[groupLine.id] === 'over' && styles.selectedOver
                          ]}
                          onPress={() => setSelectedTypes(prev => ({
                            ...prev,
                            [groupLine.id]: 'over'
                          }))}
                        >
                          <Text style={styles.optionLabel}>OVER</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.optionButton,
                            styles.underButton,
                            selectedTypes[groupLine.id] === 'under' && styles.selectedUnder
                          ]}
                          onPress={() => setSelectedTypes(prev => ({
                            ...prev,
                            [groupLine.id]: 'under'
                          }))}
                        >
                          <Text style={styles.optionLabel}>UNDER</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.sliderSection}>
                        <Text style={styles.sliderLabel}>Set Your Line</Text>
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
                            minimumTrackTintColor="#00F5FF"
                            maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                            thumbStyle={styles.sliderThumb}
                          />
                          <View style={styles.numberInputContainer}>
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
                              maxLength={3}
                              returnKeyType="done"
                            />
                          </View>
                        </View>
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
            
            {groupLines.filter(line => line.active).length === 0 && (
              <View style={styles.noBetsContainer}>
                <Text style={styles.noBetsIcon}>🎲</Text>
                <Text style={styles.noBetsTitle}>No Active Bets</Text>
                <Text style={styles.noBetsText}>
                  Bets will appear here when the game is live
                </Text>
              </View>
            )}
            
            {groupLines.filter(line => !line.active).length > 0 && (
              <>
                <Text style={styles.closedBetsTitle}>Closed Bets</Text>
                {groupLines.filter(line => !line.active).map((groupLine) => {
                  const playerResponse = playerResponses[groupLine.id];
                  const hasAnswered = !!playerResponse;
                  
                  return (
                    <View key={groupLine.id} style={[styles.betCard, styles.closedBetCard]}>
                      <View style={styles.betCardHeader}>
                        <Text style={styles.questionText}>{groupLine.question}</Text>
                        <Text style={styles.rangeText}>Range: {groupLine.min} - {groupLine.max}</Text>
                        {groupLine.actual !== undefined && (
                          <Text style={styles.actualText}>Actual: {groupLine.actual}</Text>
                        )}
                      </View>
                      
                      {hasAnswered && (
                        <View style={styles.answeredContainer}>
                          <View style={styles.answeredBadge}>
                            <Text style={styles.checkmark}>✓</Text>
                          </View>
                          <Text style={styles.answeredText}>
                            Your bet: {playerResponse.type.toUpperCase()} {playerResponse.line}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </View>
        ) : (
          <View style={styles.membersSection}>
            
            {teamData && (
              <View style={styles.teamInfoContainer}>
                <Text style={styles.teamInfoTitle}>Team Info</Text>
                <View style={styles.joinCodeDisplay}>
                  <Text style={styles.joinCodeLabel}>Join Code</Text>
                  <View style={styles.joinCodeBadge}>
                    <Text style={styles.joinCodeValue}>{teamData.joinCode}</Text>
                  </View>
                </View>
              </View>
            )}
            
            <View style={styles.leaderboardSection}>
              <Text style={styles.leaderboardTitle}>Live Rankings</Text>
              <View style={styles.leaderboardContainer}>
                {members.map((member, index) => (
                  <View 
                    key={member.id} 
                    style={[
                      styles.memberCard,
                      index === 0 && styles.firstPlace
                    ]}
                  >
                    <View style={[
                      styles.memberRank,
                      index === 0 && styles.firstPlaceRank,
                      index === 1 && styles.secondPlaceRank,
                      index === 2 && styles.thirdPlaceRank,
                    ]}>
                      <Text style={[
                        styles.rankText,
                        index === 0 && styles.firstPlaceRankText
                      ]}>
                        {index === 0 ? '👑' : `#${index + 1}`}
                      </Text>
                    </View>
                    
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameContainer}>
                        <Text style={[
                          styles.memberName,
                          index === 0 && styles.firstPlaceName
                        ]}>
                          {member.name}
                        </Text>
                        {member.isOwner && (
                          <Text style={styles.ownerBadge}>⭐</Text>
                        )}
                      </View>
                      <Text style={[
                        styles.memberScore,
                        index === 0 && styles.firstPlaceScore
                      ]}>
                        {member.score} pts
                      </Text>
                    </View>
                  </View>
                ))}
                
                {members.length === 0 && (
                  <View style={styles.noMembersContainer}>
                    <Text style={styles.noMembersIcon}>👥</Text>
                    <Text style={styles.noMembersText}>
                      No members yet. Share the join code!
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={createBetModal}
        onRequestClose={() => setCreateBetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Group Bet</Text>
              <TouchableOpacity onPress={() => setCreateBetModal(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Question</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your question..."
                placeholderTextColor="#6B7280"
                value={newBetQuestion}
                onChangeText={setNewBetQuestion}
                multiline
              />
              
              <View style={styles.rangeContainer}>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.inputLabel}>Min</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={newBetMin}
                    onChangeText={setNewBetMin}
                    keyboardType="numeric"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>
                
                <Text style={styles.rangeSeparator}>to</Text>
                
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.inputLabel}>Max</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="100"
                    placeholderTextColor="#6B7280"
                    value={newBetMax}
                    onChangeText={setNewBetMax}
                    keyboardType="numeric"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleCreateBet}
              >
                <Text style={styles.createButtonText}>Create Bet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={answerModal}
        onRequestClose={() => setAnswerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Answer</Text>
              <TouchableOpacity onPress={() => setAnswerModal(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Actual Result</Text>
              <TextInput
                style={styles.rangeInput}
                placeholder="Enter the actual result"
                placeholderTextColor="#6B7280"
                value={answerValue}
                onChangeText={setAnswerValue}
                keyboardType="numeric"
                returnKeyType="done"
              />
              
              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleSetAnswer}
              >
                <Text style={styles.createButtonText}>Set Answer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#124559',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gameSelectionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  gameSelectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  gameSelectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  gameCard: {
    backgroundColor: 'rgba(16, 23, 42, 0.8)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  gameDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  gameLeague: {
    fontSize: 12,
    color: '#00F5FF',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    fontSize: 32,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  homeIndicator: {
    fontSize: 10,
    color: '#00F5FF',
    fontWeight: '600',
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  awayIndicator: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vsContainer: {
    width: 60,
    alignItems: 'center',
  },
  vsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00F5FF',
  },
  gameFooter: {
    alignItems: 'center',
  },
  enterText: {
    fontSize: 16,
    color: '#00F5FF',
    fontWeight: '600',
  },
  comingSoonContainer: {
    marginTop: 20,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  comingSoonCard: {
    backgroundColor: 'rgba(16, 23, 42, 0.5)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.2)',
  },
  comingSoonIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 23, 42, 0.8)',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#00F5FF',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#0A0E27',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  betsSection: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  betCard: {
    backgroundColor: 'rgba(16, 23, 42, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
  },
  betCardHeader: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  rangeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  answeredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  answeredBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  answeredText: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '600',
  },
  bettingInterface: {
    gap: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  overButton: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  underButton: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  selectedOver: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22C55E',
  },
  selectedUnder: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionIcon: {
    fontSize: 20,
  },
  sliderSection: {
    gap: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#00F5FF',
    width: 24,
    height: 24,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  numberInputContainer: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00F5FF',
  },
  numberInput: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 70,
  },
  confirmButton: {
    backgroundColor: '#00F5FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  confirmButtonText: {
    color: '#0A0E27',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noBetsContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  noBetsIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  noBetsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  noBetsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  membersSection: {
    paddingBottom: 40,
  },
  liveScoreContainer: {
    backgroundColor: 'rgba(16, 23, 42, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  liveScoreTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22C55E',
    textAlign: 'center',
    marginBottom: 12,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreTeam: {
    alignItems: 'center',
    flex: 1,
  },
  scoreTeamName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreSeparator: {
    fontSize: 24,
    color: '#6B7280',
    marginHorizontal: 20,
  },
  teamInfoContainer: {
    backgroundColor: 'rgba(16, 23, 42, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
  },
  teamInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  joinCodeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinCodeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  joinCodeBadge: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00F5FF',
  },
  joinCodeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00F5FF',
  },
  leaderboardSection: {
    gap: 16,
  },
  leaderboardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  leaderboardContainer: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: 'rgba(16, 23, 42, 0.8)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  firstPlace: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  memberRank: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 245, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  firstPlaceRank: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  secondPlaceRank: {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
  },
  thirdPlaceRank: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00F5FF',
  },
  firstPlaceRankText: {
    fontSize: 20,
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
    color: '#FFFFFF',
    fontWeight: '600',
  },
  firstPlaceName: {
    color: '#FFD700',
  },
  ownerBadge: {
    fontSize: 16,
    marginLeft: 8,
  },
  memberScore: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  firstPlaceScore: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  noMembersContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  noMembersIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  noMembersText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  betsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  createBetButton: {
    backgroundColor: '#00F5FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBetButtonText: {
    color: '#0A0E27',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(16, 23, 42, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 28,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  modalContent: {
    gap: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  rangeInputContainer: {
    flex: 1,
  },
  rangeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  rangeSeparator: {
    color: '#6B7280',
    fontSize: 16,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#00F5FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#0A0E27',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setAnswerButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  setAnswerButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actualText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: 'bold',
    marginTop: 4,
  },
  closedBetsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 32,
    marginBottom: 16,
    textAlign: 'center',
  },
  closedBetCard: {
    opacity: 0.7,
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
});