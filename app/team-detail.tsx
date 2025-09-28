import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { FirebaseService } from '@/utils/firebaseService';
import { useLocalSearchParams, router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { Slider } from '@miblanchard/react-native-slider';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';

/**
 * TEAM DETAIL — Restyled to match Profile/Home/Teams aesthetic.
 * Palette pulled from Profile screen to ensure consistency across the app.
 */

// --- Shared palette (from Profile) ---
const C_BG = '#01161E';
const C_CARD = '#0F2830';
const C_BORDER = 'rgba(255,255,255,0.08)';
const C_BORDER_STRONG = 'rgba(255,255,255,0.12)';
const C_SUB = '#AEC3B0';
const C_TEXT = '#EFF6E0';
const C_PURPLE = '#6E6ADE';
const C_GREEN = '#34D399';

// Smaller helpers
const pill = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: C_BORDER_STRONG,
  borderRadius: 12,
  paddingHorizontal: 10,
  paddingVertical: 6,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

interface GroupLine {
  id: string;
  active: boolean;
  max: number;
  min: number;
  question: string;
  actual?: number;
  createdBy?: string;
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
  playerResponses?: { [userId: string]: { [lineId: string]: PlayerResponse } };
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
  const [playerResponses, setPlayerResponses] = useState<{ [key: string]: PlayerResponse }>({});
  const [customLines, setCustomLines] = useState<{ [key: string]: number }>({});
  const [selectedTypes, setSelectedTypes] = useState<{ [key: string]: 'over' | 'under' }>({});
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

  const calculatePlayerScore = (
    playerBets: { [lineId: string]: PlayerResponse },
    actualScores: GameScores
  ): number => {
    let totalScore = 0;

    Object.entries(playerBets).forEach(([lineId, bet]) => {
      const groupLine = groupLines.find((gl) => gl.id === lineId);
      if (!groupLine) return;

      let actualScore: number | undefined;

      if (groupLine.actual !== undefined) {
        actualScore = groupLine.actual;
      } else {
        actualScore = groupLine.question.includes('team 1')
          ? actualScores.homeTeamScore
          : actualScores.awayTeamScore;
      }

      if (actualScore === undefined) return;

      const wasCorrect =
        (bet.type === 'over' && actualScore > bet.line) ||
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

    ws.onopen = () => setConnectionStatus('Connected');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.homeTeamScore !== undefined || data.awayTeamScore !== undefined) {
        setGameScores({ homeTeamScore: data.homeTeamScore, awayTeamScore: data.awayTeamScore });
      }
    };

    ws.onclose = () => setConnectionStatus('Disconnected');
    ws.onerror = () => setConnectionStatus('Error');

    return () => ws.close();
  }, [teamId]);

  const fetchGroupLines = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'groupLines'));
      const lines: GroupLine[] = [];
      querySnapshot.forEach((d) => lines.push({ id: d.id, ...(d.data() as any) }));
      setGroupLines(lines);
    } catch (e) {
      console.error('Error fetching group lines:', e);
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
              name: (userData as any)?.name || 'Unknown User',
              score: 0,
              isOwner: memberId === data.createdBy,
            } as Member;
          } catch (error) {
            console.error('Error fetching user:', error);
            return { id: memberId, name: 'Unknown User', score: 0, isOwner: memberId === data.createdBy } as Member;
          }
        });

        const resolvedMembers = await Promise.all(memberPromises);
        setMembers(resolvedMembers);
      }
    } catch (e) {
      console.error('Error fetching team data:', e);
    }
  };

  useEffect(() => {
    if (!teamData || (gameScores.homeTeamScore === undefined && gameScores.awayTeamScore === undefined)) return;
    const updated = members.map((m) => {
      const memberBets = teamData.playerResponses?.[m.id] || {};
      const calculated = calculatePlayerScore(memberBets, gameScores);
      return { ...m, score: calculated };
    });
    updated.sort((a, b) => b.score - a.score);
    setMembers(updated);
  }, [gameScores, teamData, groupLines]);

  const handleConfirmBet = async (lineId: string) => {
    const selectedType = selectedTypes[lineId];
    const customLine = customLines[lineId];
    if (!selectedType || !customLine || !user) return Alert.alert('Error', 'Select over/under and set a line');

    const groupLine = groupLines.find((gl) => gl.id === lineId);
    if (!groupLine || customLine < groupLine.min || customLine > groupLine.max) {
      return Alert.alert('Error', `Line must be between ${groupLine?.min} and ${groupLine?.max}`);
    }

    try {
      const teamRef = doc(db, 'teams', teamId as string);
      const response = { type: selectedType, line: customLine };
      await updateDoc(teamRef, { [`playerResponses.${user.uid}.${lineId}`]: response });
      setPlayerResponses((prev) => ({ ...prev, [lineId]: response }));
      Alert.alert('Bet Confirmed', `You selected ${selectedType.toUpperCase()} ${customLine}`);
    } catch (e) {
      console.error('Error saving bet:', e);
      Alert.alert('Error', 'Failed to save bet');
    }
  };

  const handleCreateBet = async () => {
    if (!user || !newBetQuestion.trim() || !newBetMin || !newBetMax) return Alert.alert('Error', 'Fill all fields');

    const min = parseFloat(newBetMin);
    const max = parseFloat(newBetMax);
    if (isNaN(min) || isNaN(max) || min >= max) return Alert.alert('Error', 'Enter a valid range (min < max)');

    try {
      const betId = await FirebaseService.createGroupBet(newBetQuestion.trim(), min, max, user.uid);
      if (betId) {
        Alert.alert('Success', 'Group bet created');
        setNewBetQuestion('');
        setNewBetMin('');
        setNewBetMax('');
        setCreateBetModal(false);
        fetchGroupLines();
      } else {
        Alert.alert('Error', 'Failed to create group bet');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create group bet');
    }
  };

  const handleSetAnswer = async () => {
    if (!user || !selectedLineId || !answerValue.trim()) return Alert.alert('Error', 'Enter an answer');
    const answer = parseFloat(answerValue);
    if (isNaN(answer)) return Alert.alert('Error', 'Enter a valid number');

    try {
      const success = await FirebaseService.setGroupLineAnswer(selectedLineId, answer, user.uid);
      if (success) {
        Alert.alert('Success', 'Answer set! Bet closed.');
        setAnswerValue('');
        setAnswerModal(false);
        setSelectedLineId(null);
        fetchGroupLines();
      } else {
        Alert.alert('Error', 'Failed to set answer');
      }
    } catch (e) {
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

          <TouchableOpacity style={styles.gameCard} onPress={() => setSelectedGame('falcons-bucks')}>
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
              <Text style={styles.comingSoonText}>We're adding more live games and sports. Stay tuned for updates!</Text>
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
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: connectionStatus === 'Connected' ? C_GREEN : '#EF4444' },
              ]}
            />
            <Text style={[styles.connectionText, { color: connectionStatus === 'Connected' ? C_GREEN : '#EF4444' }]}>
              {connectionStatus}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'bets' && styles.activeTab]} onPress={() => setActiveTab('bets')}>
          <Text style={[styles.tabText, activeTab === 'bets' && styles.activeTabText]}>🎯 Live Bets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>🏆 Leaderboard</Text>
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
              <TouchableOpacity style={styles.createBetButton} onPress={() => setCreateBetModal(true)}>
                <Text style={styles.createBetButtonText}>+ Create Bet</Text>
              </TouchableOpacity>
            </View>

            {groupLines
              .filter((line) => line.active)
              .map((groupLine) => {
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
                      {groupLine.actual !== undefined && <Text style={styles.actualText}>Actual: {groupLine.actual}</Text>}
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
                            style={[styles.optionButton, styles.overButton, selectedTypes[groupLine.id] === 'over' && styles.selectedOver]}
                            onPress={() => setSelectedTypes((prev) => ({ ...prev, [groupLine.id]: 'over' }))}
                          >
                            <Text style={styles.optionLabel}>OVER</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.optionButton, styles.underButton, selectedTypes[groupLine.id] === 'under' && styles.selectedUnder]}
                            onPress={() => setSelectedTypes((prev) => ({ ...prev, [groupLine.id]: 'under' }))}
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
                                const v = Array.isArray(value) ? value[0] : value;
                                setCustomLines((prev) => ({ ...prev, [groupLine.id]: Math.round(v as number) }));
                              }}
                              step={1}
                              minimumTrackTintColor={C_PURPLE}
                              maximumTrackTintColor={'rgba(255,255,255,0.18)'}
                              thumbStyle={styles.sliderThumb}
                            />
                            <View style={styles.numberInputContainer}>
                              <TextInput
                                style={styles.numberInput}
                                value={String(
                                  customLines[groupLine.id] || Math.round((groupLine.min + groupLine.max) / 2)
                                )}
                                onChangeText={(text) => {
                                  const value = parseInt(text) || groupLine.min;
                                  if (value >= groupLine.min && value <= groupLine.max) {
                                    setCustomLines((prev) => ({ ...prev, [groupLine.id]: value }));
                                  }
                                }}
                                keyboardType="numeric"
                                maxLength={3}
                                returnKeyType="done"
                              />
                            </View>
                          </View>
                        </View>

                        <TouchableOpacity style={styles.confirmButton} onPress={() => handleConfirmBet(groupLine.id)}>
                          <Text style={styles.confirmButtonText}>Confirm Bet</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}

            {groupLines.filter((line) => line.active).length === 0 && (
              <View style={styles.noBetsContainer}>
                <Text style={styles.noBetsIcon}>🎲</Text>
                <Text style={styles.noBetsTitle}>No Active Bets</Text>
                <Text style={styles.noBetsText}>Bets will appear here when the game is live</Text>
              </View>
            )}

            {groupLines.filter((line) => !line.active).length > 0 && (
              <>
                <Text style={styles.closedBetsTitle}>Closed Bets</Text>
                {groupLines
                  .filter((line) => !line.active)
                  .map((groupLine) => {
                    const playerResponse = playerResponses[groupLine.id];
                    const hasAnswered = !!playerResponse;
                    return (
                      <View key={groupLine.id} style={[styles.betCard, styles.closedBetCard]}>
                        <View style={styles.betCardHeader}>
                          <Text style={styles.questionText}>{groupLine.question}</Text>
                          <Text style={styles.rangeText}>Range: {groupLine.min} - {groupLine.max}</Text>
                          {groupLine.actual !== undefined && <Text style={styles.actualText}>Actual: {groupLine.actual}</Text>}
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
                  <View key={member.id} style={[styles.memberCard, index === 0 && styles.firstPlace]}>
                    <View
                      style={[
                        styles.memberRank,
                        index === 0 && styles.firstPlaceRank,
                        index === 1 && styles.secondPlaceRank,
                        index === 2 && styles.thirdPlaceRank,
                      ]}
                    >
                      <Text style={[styles.rankText, index === 0 && styles.firstPlaceRankText]}>
                        {index === 0 ? '👑' : `#${index + 1}`}
                      </Text>
                    </View>

                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameContainer}>
                        <Text style={[styles.memberName, index === 0 && styles.firstPlaceName]}>{member.name}</Text>
                        {member.isOwner && <Text style={styles.ownerBadge}>⭐</Text>}
                      </View>
                      <Text style={[styles.memberScore, index === 0 && styles.firstPlaceScore]}>{member.score} pts</Text>
                    </View>
                  </View>
                ))}

                {members.length === 0 && (
                  <View style={styles.noMembersContainer}>
                    <Text style={styles.noMembersIcon}>👥</Text>
                    <Text style={styles.noMembersText}>No members yet. Share the join code!</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Create Bet Modal */}
      <Modal animationType="slide" transparent visible={createBetModal} onRequestClose={() => setCreateBetModal(false)}>
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
                placeholderTextColor={C_SUB}
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
                    placeholderTextColor={C_SUB}
                    value={newBetMin}
                    onChangeText={setNewBetMin}
                    keyboardType="numeric"
                    returnKeyType="done"
                    blurOnSubmit
                  />
                </View>

                <Text style={styles.rangeSeparator}>to</Text>

                <View style={styles.rangeInputContainer}>
                  <Text style={styles.inputLabel}>Max</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="100"
                    placeholderTextColor={C_SUB}
                    value={newBetMax}
                    onChangeText={setNewBetMax}
                    keyboardType="numeric"
                    returnKeyType="done"
                    blurOnSubmit
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.createButton} onPress={handleCreateBet}>
                <Text style={styles.createButtonText}>Create Bet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set Answer Modal */}
      <Modal animationType="slide" transparent visible={answerModal} onRequestClose={() => setAnswerModal(false)}>
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
                placeholderTextColor={C_SUB}
                value={answerValue}
                onChangeText={setAnswerValue}
                keyboardType="numeric"
                returnKeyType="done"
              />

              <TouchableOpacity style={styles.createButton} onPress={handleSetAnswer}>
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
  container: { flex: 1, backgroundColor: C_BG },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  backButtonText: { fontSize: 20, color: C_TEXT, fontWeight: 'bold' },
  headerContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: C_TEXT },
  connectionBadge: { flexDirection: 'row', alignItems: 'center', ...pill },
  connectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  connectionText: { fontSize: 12, fontWeight: '800' },

  // Game selection (pre-entry)
  gameSelectionContainer: { flex: 1, paddingHorizontal: 20 },
  gameSelectionTitle: { fontSize: 28, fontWeight: '900', color: C_TEXT, textAlign: 'center', marginBottom: 8 },
  gameSelectionSubtitle: { fontSize: 14, color: C_SUB, textAlign: 'center', marginBottom: 28 },
  gameCard: {
    backgroundColor: C_CARD,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', ...pill },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C_GREEN, marginRight: 6 },
  liveText: { fontSize: 11, fontWeight: '800', color: C_TEXT },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  gameDate: { fontSize: 12, color: C_SUB },
  gameLeague: { fontSize: 11, color: C_TEXT, ...pill },
  teamsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  teamSection: { flex: 1, alignItems: 'center' },
  teamLogo: { fontSize: 30, marginBottom: 8 },
  teamName: { fontSize: 16, fontWeight: '800', color: C_TEXT, textAlign: 'center', marginBottom: 4 },
  homeIndicator: { fontSize: 10, color: C_TEXT, ...pill },
  awayIndicator: { fontSize: 10, color: C_SUB, ...pill },
  vsContainer: { width: 60, alignItems: 'center' },
  vsText: { fontSize: 18, fontWeight: '900', color: C_PURPLE },
  gameFooter: { alignItems: 'center' },
  enterText: { fontSize: 15, color: C_TEXT, fontWeight: '800' },
  comingSoonContainer: { marginTop: 10 },
  comingSoonTitle: { fontSize: 16, fontWeight: '800', color: C_SUB, textAlign: 'center', marginBottom: 12 },
  comingSoonCard: { backgroundColor: C_CARD, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C_BORDER },
  comingSoonIcon: { fontSize: 36, marginBottom: 8 },
  comingSoonText: { fontSize: 13, color: C_SUB, textAlign: 'center', lineHeight: 19 },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: C_CARD, borderRadius: 12, padding: 4, marginHorizontal: 20, marginBottom: 14, borderWidth: 1, borderColor: C_BORDER },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C_BORDER_STRONG },
  tabText: { fontSize: 14, color: C_SUB, fontWeight: '800' },
  activeTabText: { color: C_TEXT },

  content: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  loadingEmoji: { fontSize: 60, marginBottom: 16 },
  loadingText: { color: C_SUB, fontSize: 14, fontWeight: '700' },

  // Bets
  betsSection: { paddingBottom: 36 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: C_TEXT, textAlign: 'center' },
  betCard: { backgroundColor: C_CARD, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C_BORDER },
  betCardHeader: { marginBottom: 14 },
  questionText: { fontSize: 16, fontWeight: '900', color: C_TEXT, marginBottom: 6 },
  rangeText: { fontSize: 12, color: C_SUB },
  answeredContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(52,211,153,0.10)', borderRadius: 12, padding: 12 },
  answeredBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: C_GREEN, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkmark: { fontSize: 14, color: '#0A1A1F', fontWeight: '900' },
  answeredText: { fontSize: 14, color: C_TEXT, fontWeight: '800' },
  bettingInterface: { gap: 16 },
  optionsContainer: { flexDirection: 'row', gap: 10 },
  optionButton: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C_BORDER },
  overButton: { borderColor: 'rgba(52,211,153,0.35)' },
  underButton: { borderColor: 'rgba(239,68,68,0.35)' },
  selectedOver: { backgroundColor: 'rgba(52,211,153,0.18)', borderColor: C_GREEN },
  selectedUnder: { backgroundColor: 'rgba(239,68,68,0.18)', borderColor: '#EF4444' },
  optionLabel: { fontSize: 14, fontWeight: '900', color: C_TEXT },
  sliderSection: { gap: 10 },
  sliderLabel: { fontSize: 14, fontWeight: '800', color: C_TEXT, textAlign: 'center' },
  sliderContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  slider: { flex: 1, height: 40 },
  sliderThumb: { backgroundColor: C_PURPLE, width: 22, height: 22, shadowColor: C_PURPLE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 8 },
  numberInputContainer: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, borderWidth: 1, borderColor: C_BORDER },
  numberInput: { fontSize: 16, color: C_TEXT, textAlign: 'center', fontWeight: '900', paddingHorizontal: 14, paddingVertical: 10, minWidth: 64 },
  confirmButton: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C_BORDER_STRONG },
  confirmButtonText: { color: C_TEXT, fontSize: 16, fontWeight: '900' },

  // Empty states
  noBetsContainer: { alignItems: 'center', paddingTop: 50 },
  noBetsIcon: { fontSize: 54, marginBottom: 12 },
  noBetsTitle: { fontSize: 18, fontWeight: '900', color: C_TEXT, marginBottom: 6 },
  noBetsText: { fontSize: 13, color: C_SUB, textAlign: 'center' },

  // Live score card
  liveScoreContainer: { backgroundColor: C_CARD, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C_BORDER_STRONG },
  liveScoreTitle: { fontSize: 14, fontWeight: '900', color: C_GREEN, textAlign: 'center', marginBottom: 8 },
  scoreDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  scoreTeam: { alignItems: 'center', flex: 1 },
  scoreTeamName: { fontSize: 12, color: C_SUB, marginBottom: 2 },
  scoreNumber: { fontSize: 28, fontWeight: '900', color: C_TEXT },
  scoreSeparator: { fontSize: 22, color: C_SUB, marginHorizontal: 18 },

  // Members/Leaderboard
  membersSection: { paddingBottom: 36 },
  teamInfoContainer: { backgroundColor: C_CARD, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C_BORDER },
  teamInfoTitle: { fontSize: 14, fontWeight: '900', color: C_TEXT, marginBottom: 10, textAlign: 'center' },
  joinCodeDisplay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  joinCodeLabel: { fontSize: 12, color: C_SUB },
  joinCodeBadge: { ...pill },
  joinCodeValue: { fontSize: 16, fontWeight: '900', color: C_TEXT },
  leaderboardSection: { gap: 12 },
  leaderboardTitle: { fontSize: 20, fontWeight: '900', color: C_TEXT, textAlign: 'center' },
  leaderboardContainer: { gap: 10 },
  memberCard: { backgroundColor: C_CARD, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C_BORDER },
  firstPlace: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.08)' },
  memberRank: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(110,106,222,0.18)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  firstPlaceRank: { backgroundColor: 'rgba(255,215,0,0.18)' },
  secondPlaceRank: { backgroundColor: 'rgba(192,192,192,0.18)' },
  thirdPlaceRank: { backgroundColor: 'rgba(205,127,50,0.18)' },
  rankText: { fontSize: 14, fontWeight: '900', color: C_TEXT },
  firstPlaceRankText: { fontSize: 18 },
  memberInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberNameContainer: { flexDirection: 'row', alignItems: 'center' },
  memberName: { fontSize: 15, color: C_TEXT, fontWeight: '800' },
  firstPlaceName: { color: '#FFD700' },
  ownerBadge: { fontSize: 16, marginLeft: 6 },
  memberScore: { fontSize: 14, color: C_SUB, fontWeight: '800' },
  firstPlaceScore: { color: '#FFD700', fontWeight: '900' },
  noMembersContainer: { alignItems: 'center', paddingTop: 36 },
  noMembersIcon: { fontSize: 46, marginBottom: 10 },
  noMembersText: { fontSize: 13, color: C_SUB, textAlign: 'center' },

  betsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  createBetButton: { ...pill },
  createBetButtonText: { color: C_TEXT, fontSize: 12, fontWeight: '900' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: C_CARD, borderRadius: 18, padding: 20, width: '90%', maxWidth: 420, borderWidth: 1, borderColor: C_BORDER },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C_TEXT },
  closeButton: { fontSize: 26, color: C_SUB, fontWeight: '900' },
  modalContent: { gap: 14 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: C_TEXT, marginBottom: 6 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, fontSize: 14, color: C_TEXT, borderWidth: 1, borderColor: C_BORDER, minHeight: 80, textAlignVertical: 'top' },
  rangeContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  rangeInputContainer: { flex: 1 },
  rangeInput: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, fontSize: 14, color: C_TEXT, borderWidth: 1, borderColor: C_BORDER },
  rangeSeparator: { color: C_SUB, fontSize: 14, marginBottom: 14 },
  createButton: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C_BORDER_STRONG, marginTop: 4 },
  createButtonText: { color: C_TEXT, fontSize: 14, fontWeight: '900' },
  setAnswerButton: { backgroundColor: 'rgba(239,68,68,0.16)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.45)' },
  setAnswerButtonText: { color: C_TEXT, fontSize: 10, fontWeight: '900' },
  actualText: { fontSize: 12, color: C_GREEN, fontWeight: '900', marginTop: 4 },
  closedBetsTitle: { fontSize: 16, fontWeight: '900', color: C_SUB, marginTop: 24, marginBottom: 12, textAlign: 'center' },
  closedBetCard: { opacity: 0.9, borderColor: C_BORDER },
});
