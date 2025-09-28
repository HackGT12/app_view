import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

const { width } = Dimensions.get('window');

// --- App palette (matches Profile/Home) ---
const C_BG = '#01161E';
const C_CARD = '#0F2830';
const C_BORDER = 'rgba(255,255,255,0.08)';
const C_BORDER_STRONG = 'rgba(255,255,255,0.12)';
const C_SUB = '#AEC3B0';
const C_TEXT = '#EFF6E0';
const C_PURPLE = '#6E6ADE';

interface Team {
  id: string;
  name: string;
  joinCode: string;
  createdBy: string;
  members: string[];
  createdAt: any;
}

const TeamsScreen: React.FC = () => {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [newTeamName, setNewTeamName] = useState('');
  const [joinCode, setJoinCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const generateJoinCode = (): string =>
    Math.floor(100000 + Math.random() * 900000).toString();

  const fetchTeams = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const teamIds: string[] = userData.teams || [];
        const fetched: Team[] = [];
        for (const teamId of teamIds) {
          const teamRef = doc(db, 'teams', teamId);
          const teamSnap = await getDoc(teamRef);
          if (teamSnap.exists()) fetched.push({ id: teamId, ...teamSnap.data() } as Team);
        }
        setTeams(fetched);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user]);

  const handleCreateTeam = async () => {
    if (!user || !newTeamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }
    try {
      const code = generateJoinCode();
      const teamId = `${Date.now()}_${user.uid}`;
      const teamRef = doc(db, 'teams', teamId);

      await setDoc(teamRef, {
        name: newTeamName.trim(),
        joinCode: code,
        createdBy: user.uid,
        members: [user.uid],
        createdAt: new Date(),
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { teams: arrayUnion(teamId) });

      setTeams(prev => [
        ...prev,
        { id: teamId, name: newTeamName.trim(), joinCode: code, createdBy: user.uid, members: [user.uid], createdAt: new Date() },
      ]);
      setNewTeamName('');
      setModalVisible(false);
      Alert.alert('Success', `Team created! Join code: ${code}`);
    } catch (err) {
      console.error('Error creating team:', err);
      Alert.alert('Error', 'Failed to create team');
    }
  };

  const handleJoinTeam = async () => {
    const codeString = joinCode.join('');
    if (!user || codeString.length !== 6) {
      Alert.alert('Error', 'Please enter a complete 6-digit join code');
      return;
    }
    try {
      const teamsRef = collection(db, 'teams');
      const q = query(teamsRef, where('joinCode', '==', codeString));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Error', 'Team not found with this join code');
        return;
      }

      const teamDoc = querySnapshot.docs[0];
      const teamData = teamDoc.data() as Team;

      if (teamData.members.includes(user.uid)) {
        Alert.alert('Info', 'You are already a member of this team');
        return;
      }

      await updateDoc(teamDoc.ref, { members: arrayUnion(user.uid) });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { teams: arrayUnion(teamDoc.id) });

      setTeams(prev => [...prev, { ...teamData, id: teamDoc.id }]);
      setJoinCode(['', '', '', '', '', '']);
      setModalVisible(false);
      Alert.alert('Success', `Joined team: ${teamData.name}`);
    } catch (err) {
      console.error('Error joining team:', err);
      Alert.alert('Error', 'Failed to join team');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>⚡</Text>
          <Text style={styles.loadingText}>Loading your teams...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Teams</Text>
        <Text style={styles.subtitle}>Connect • Compete • Win</Text>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {teams.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeEmoji}>🎯</Text>
            <Text style={styles.welcomeTitle}>Ready to Start Betting?</Text>
            <Text style={styles.welcomeText}>
              Create your own team or join friends to start placing bets together
            </Text>

            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={[styles.quickActionButton, styles.primaryBtn]}
                onPress={() => {
                  setActiveTab('create');
                  setModalVisible(true);
                }}
              >
                <Text style={styles.quickActionEmoji}>➕</Text>
                <Text style={styles.primaryBtnText}>Create Team</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, styles.ghostBtn]}
                onPress={() => {
                  setActiveTab('join');
                  setModalVisible(true);
                }}
              >
                <Text style={styles.quickActionEmoji}>🔗</Text>
                <Text style={styles.ghostBtnText}>Join Team</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.teamsContainer} showsVerticalScrollIndicator={false}>
            {teams.map((team, index) => (
              <TouchableOpacity
                key={team.id}
                style={[styles.teamCard, index === 0 && styles.teamCardFirst]}
                onPress={() =>
                  router.push({ pathname: '/team-detail', params: { teamId: team.id, teamName: team.name } })
                }
                activeOpacity={0.9}
              >
                <View style={styles.teamCardHeader}>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.memberCount}>{team.members.length} members</Text>
                  </View>
                </View>

                <View style={styles.joinCodeRow}>
                  <Text style={styles.joinCodeLabel}>Join Code</Text>
                  <View style={styles.whitePill}>
                    <Text style={styles.whitePillText}>{team.joinCode}</Text>
                  </View>
                </View>

                <View style={styles.neonBar} />
                <View style={styles.enterContainer}>
                  <Text style={styles.enterText}>Tap to Enter →</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.addMoreTeamsButton} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
              <Text style={styles.addMoreText}>+ Add More Teams</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeTab === 'create' ? 'Create Team' : 'Join Team'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'create' && styles.activeTab]}
                onPress={() => setActiveTab('create')}
              >
                <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>Create Team</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'join' && styles.activeTab]}
                onPress={() => setActiveTab('join')}
              >
                <Text style={[styles.tabText, activeTab === 'join' && styles.activeTabText]}>Join Team</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabContent}>
              {activeTab === 'create' ? (
                <View>
                  <Text style={styles.inputLabel}>Team Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your team name"
                    placeholderTextColor={C_SUB}
                    value={newTeamName}
                    onChangeText={setNewTeamName}
                  />
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateTeam} activeOpacity={0.9}>
                    <Text style={styles.primaryBtnText}>Create Team</Text>
                  </TouchableOpacity>
                  <Text style={styles.helpText}>You'll get a 6-digit code to share with friends</Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.inputLabel}>Enter Join Code</Text>
                  <View style={styles.codeInputContainer}>
                    {joinCode.map((digit, index) => (
                      <View key={index} style={styles.codeInputWrapper}>
                        <TextInput
                          ref={el => {
                            inputRefs.current[index] = el;
                          }}
                          style={styles.codeInput}
                          value={digit}
                          onChangeText={text => {
                            if (/^[0-9]$/.test(text)) {
                              const next = [...joinCode];
                              next[index] = text;
                              setJoinCode(next);
                              if (index < joinCode.length - 1) inputRefs.current[index + 1]?.focus();
                            } else if (text === '' && index > 0) {
                              const next = [...joinCode];
                              next[index] = '';
                              setJoinCode(next);
                              inputRefs.current[index - 1]?.focus();
                            }
                          }}
                          keyboardType="numeric"
                          maxLength={1}
                          textAlign="center"
                        />
                        {index === 2 && <Text style={styles.dash}>-</Text>}
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleJoinTeam} activeOpacity={0.9}>
                    <Text style={styles.primaryBtnText}>Join Team</Text>
                  </TouchableOpacity>
                  <Text style={styles.helpText}>Ask your friend for their team's join code</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TeamsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C_BG },

  // Header
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: C_TEXT, marginBottom: 6 },
  subtitle: { fontSize: 14, color: C_SUB, fontWeight: '700', opacity: 0.9 },

  mainContent: { flex: 1, paddingHorizontal: 20 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingEmoji: { fontSize: 60, marginBottom: 12 },
  loadingText: { fontSize: 16, color: C_SUB, fontWeight: '700' },

  // Welcome
  welcomeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  welcomeEmoji: { fontSize: 72, marginBottom: 18 },
  welcomeTitle: { fontSize: 24, fontWeight: '900', color: C_TEXT, marginBottom: 8, textAlign: 'center' },
  welcomeText: { fontSize: 14, color: C_SUB, lineHeight: 20, textAlign: 'center', marginBottom: 26 },
  quickActionsContainer: { width: '100%', gap: 12 },
  quickActionButton: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: { backgroundColor: C_PURPLE, borderWidth: 1, borderColor: C_BORDER_STRONG },
  primaryBtnText: { color: '#fff', fontWeight: '900' },
  ghostBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: C_BORDER_STRONG,
  },
  ghostBtnText: { color: C_TEXT, fontWeight: '900' },
  quickActionEmoji: { fontSize: 18, marginRight: 8, color: '#fff' },

  // Teams list
  teamsContainer: { flex: 1 },
  teamCard: {
    backgroundColor: C_CARD,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C_BORDER,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  teamCardFirst: { borderColor: C_BORDER_STRONG },
  teamCardHeader: { marginBottom: 10 },
  teamInfo: { flex: 1 },
  teamName: { fontSize: 18, fontWeight: '900', color: C_TEXT, marginBottom: 2 },
  memberCount: { fontSize: 12, color: C_SUB },

  joinCodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 12 },
  joinCodeLabel: { fontSize: 12, color: C_SUB },
  whitePill: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  whitePillText: { color: '#333', fontWeight: '900', letterSpacing: 1 },

  neonBar: { height: 3, backgroundColor: C_PURPLE, borderRadius: 2, opacity: 0.95 },

  enterContainer: { alignItems: 'flex-end', marginTop: 10 },
  enterText: { fontSize: 12, color: C_TEXT, opacity: 0.9, fontWeight: '800' },

  addMoreTeamsButton: {
    marginTop: 8,
    marginBottom: 100,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: C_BORDER_STRONG,
  },
  addMoreText: { color: C_TEXT, fontWeight: '900' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: {
    backgroundColor: C_CARD,
    borderRadius: 18,
    padding: 18,
    width: width * 0.9,
    maxWidth: 420,
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C_TEXT },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C_BORDER_STRONG,
  },
  closeButtonText: { fontSize: 20, color: C_TEXT, fontWeight: '900' },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: C_BORDER,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C_BORDER_STRONG },
  tabText: { fontSize: 14, color: C_SUB, fontWeight: '800' },
  activeTabText: { color: '#fff' },

  tabContent: { minHeight: 160 },

  inputLabel: { fontSize: 14, color: C_TEXT, marginBottom: 10, fontWeight: '800', textAlign: 'center' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: C_TEXT,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C_BORDER_STRONG,
    textAlign: 'center',
  },
  helpText: { fontSize: 12, color: C_SUB, textAlign: 'center', marginTop: 6 },

  codeInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  codeInputWrapper: { flexDirection: 'row', alignItems: 'center' },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    width: 46,
    height: 56,
    fontSize: 18,
    color: C_TEXT,
    borderWidth: 1,
    borderColor: C_BORDER_STRONG,
    marginHorizontal: 4,
    fontWeight: '900',
  },
  dash: { color: C_SUB, fontSize: 18, marginHorizontal: 8, fontWeight: '900' },
});
