import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
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

  const generateJoinCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const fetchTeams = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const teamIds: string[] = userData.teams || [];

        const fetchedTeams = [];
        for (const teamId of teamIds) {
          const teamRef = doc(db, 'teams', teamId);
          const teamSnap = await getDoc(teamRef);
          if (teamSnap.exists()) {
            fetchedTeams.push({ id: teamId, ...teamSnap.data() } as Team);
          }
        }
        setTeams(fetchedTeams);
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
      const joinCode = generateJoinCode();
      const teamId = `${Date.now()}_${user.uid}`;
      const teamRef = doc(db, 'teams', teamId);
      
      await setDoc(teamRef, {
        name: newTeamName,
        joinCode,
        createdBy: user.uid,
        members: [user.uid],
        createdAt: new Date(),
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        teams: arrayUnion(teamId),
      });

      setTeams((prev) => [...prev, { 
        id: teamId, 
        name: newTeamName, 
        joinCode,
        createdBy: user.uid,
        members: [user.uid],
        createdAt: new Date()
      }]);
      
      setNewTeamName('');
      setModalVisible(false);
      Alert.alert('Success', `Team created! Join code: ${joinCode}`);
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

      await updateDoc(teamDoc.ref, {
        members: arrayUnion(user.uid),
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        teams: arrayUnion(teamDoc.id),
      });

      setTeams((prev) => [...prev, { id: teamDoc.id, ...teamData }]);
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
          /* Welcome Section for New Users */
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeEmoji}>🎯</Text>
            <Text style={styles.welcomeTitle}>Ready to Start Betting?</Text>
            <Text style={styles.welcomeText}>
              Create your own team or join friends to start placing bets together
            </Text>
            
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={[styles.quickActionButton, styles.createTeamButton]}
                onPress={() => {
                  setActiveTab('create');
                  setModalVisible(true);
                }}
              >
                <Text style={styles.quickActionEmoji}>➕</Text>
                <Text style={styles.quickActionText}>Create Team</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, styles.joinTeamButton]}
                onPress={() => {
                  setActiveTab('join');
                  setModalVisible(true);
                }}
              >
                <Text style={styles.quickActionEmoji}>🔗</Text>
                <Text style={styles.quickActionText}>Join Team</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Teams List */
          <ScrollView style={styles.teamsContainer} showsVerticalScrollIndicator={false}>
            {teams.map((team, index) => (
              <TouchableOpacity 
                key={team.id} 
                style={[styles.teamCard, index === 0 && styles.firstTeamCard]}
                onPress={() => router.push({
                  pathname: '/team-detail',
                  params: { teamId: team.id, teamName: team.name }
                })}
              >
                <View style={styles.teamCardHeader}>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.memberCount}>{team.members.length} members</Text>
                  </View>
                </View>
                
                <View style={styles.joinCodeContainer}>
                  <Text style={styles.joinCodeLabel}>Join Code</Text>
                  <View style={styles.joinCodeBadge}>
                    <Text style={styles.joinCodeText}>{team.joinCode}</Text>
                  </View>
                </View>
                
                <View style={styles.enterContainer}>
                  <Text style={styles.enterText}>Tap to Enter →</Text>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Add More Teams Button */}
            <TouchableOpacity
              style={styles.addMoreTeamsButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.enterText}>+ Add More Teams</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeTab === 'create' ? 'Create Team' : '🔗 Join Team'}
              </Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'create' && styles.activeTab]}
                onPress={() => setActiveTab('create')}
              >
                <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
                  Create Team
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'join' && styles.activeTab]}
                onPress={() => setActiveTab('join')}
              >
                <Text style={[styles.tabText, activeTab === 'join' && styles.activeTabText]}>
                  Join Team
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabContent}>
              {activeTab === 'create' ? (
                <View>
                  <Text style={styles.inputLabel}>Team Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your team name"
                    placeholderTextColor="#6B7280"
                    value={newTeamName}
                    onChangeText={setNewTeamName}
                  />
                  <TouchableOpacity style={styles.actionButton} onPress={handleCreateTeam}>
                    <Text style={styles.actionButtonText}>🎯 Create Team</Text>
                  </TouchableOpacity>
                  <Text style={styles.helpText}>
                    You'll get a 6-digit code to share with friends
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.inputLabel}>Enter Join Code</Text>
                  <View style={styles.codeInputContainer}>
                    {joinCode.map((digit, index) => (
                      <View key={index} style={styles.codeInputWrapper}>
                        <TextInput
                          style={styles.codeInput}
                          value={digit}
                          onChangeText={(text) => {
                            if (text.length <= 1 && /^[0-9]*$/.test(text)) {
                              const newCode = [...joinCode];
                              newCode[index] = text;
                              setJoinCode(newCode);
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
                  <TouchableOpacity style={styles.actionButton} onPress={handleJoinTeam}>
                    <Text style={styles.actionButtonText}>🔗 Join Team</Text>
                  </TouchableOpacity>
                  <Text style={styles.helpText}>
                    Ask your friend for their team's join code
                  </Text>
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
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  quickActionsContainer: {
    width: '100%',
    gap: 16,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createTeamButton: {
    backgroundColor: '#00F5FF',
  },
  joinTeamButton: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#00F5FF',
  },
  quickActionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  quickActionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A0E27',
  },
  teamsContainer: {
    flex: 1,
  },
  teamCard: {
    backgroundColor: 'rgba(16, 23, 42, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  firstTeamCard: {
    borderColor: '#00F5FF',
    shadowOpacity: 0.2,
  },
  teamCardHeader: {
    marginBottom: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  joinCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  joinCodeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00F5FF',
  },
  enterContainer: {
    alignItems: 'flex-end',
  },
  enterText: {
    fontSize: 14,
    color: '#00F5FF',
    fontWeight: '600',
  },
  addMoreTeamsButton: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#00F5FF',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
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
  tabContent: {
    minHeight: 160,
  },
  inputLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#00F5FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#0A0E27',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  codeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    width: 45,
    height: 55,
    fontSize: 18,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(0, 245, 255, 0.3)',
    marginHorizontal: 4,
    fontWeight: 'bold',
  },
  dash: {
    color: '#6B7280',
    fontSize: 18,
    marginHorizontal: 8,
    fontWeight: 'bold',
  },
});