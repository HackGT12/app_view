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
        <Text style={styles.loadingText}>Loading teams...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teams</Text>
      
      <ScrollView style={styles.teamsContainer}>
        {teams.length === 0 ? (
          <Text style={styles.emptyText}>You're not in any teams yet.</Text>
        ) : (
          teams.map((team) => (
            <TouchableOpacity 
              key={team.id} 
              style={styles.teamCard}
              onPress={() => router.push({
                pathname: '/team-detail',
                params: { teamId: team.id, teamName: team.name }
              })}
            >
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.joinCodeText}>Join Code: {team.joinCode}</Text>
              <Text style={styles.memberCount}>{team.members.length} members</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'create' && styles.activeTab]}
                onPress={() => setActiveTab('create')}
              >
                <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
                  Create Group
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'join' && styles.activeTab]}
                onPress={() => setActiveTab('join')}
              >
                <Text style={[styles.tabText, activeTab === 'join' && styles.activeTabText]}>
                  Join Group
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabContent}>
              {activeTab === 'create' ? (
                <View>
                  <Text style={styles.inputLabel}>Team Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter team name"
                    placeholderTextColor="#AEC3B0"
                    value={newTeamName}
                    onChangeText={setNewTeamName}
                  />
                  <TouchableOpacity style={styles.actionButton} onPress={handleCreateTeam}>
                    <Text style={styles.actionButtonText}>Create Team</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.inputLabel}>Join Code</Text>
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
                    <Text style={styles.actionButtonText}>Join Team</Text>
                  </TouchableOpacity>
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
    backgroundColor: '#01161E',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EFF6E0',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#EFF6E0',
  },
  teamsContainer: {
    flex: 1,
    marginBottom: 80,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#AEC3B0',
    fontSize: 16,
  },
  teamCard: {
    backgroundColor: '#124559',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EFF6E0',
    marginBottom: 5,
  },
  joinCodeText: {
    fontSize: 14,
    color: '#598392',
    marginBottom: 3,
  },
  memberCount: {
    fontSize: 12,
    color: '#AEC3B0',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#598392',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  floatingButtonText: {
    fontSize: 24,
    color: '#EFF6E0',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#124559',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  closeButton: {
    fontSize: 24,
    color: '#EFF6E0',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#01161E',
    borderRadius: 8,
    padding: 4,
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
  tabContent: {
    minHeight: 120,
  },
  inputLabel: {
    fontSize: 16,
    color: '#EFF6E0',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#01161E',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#EFF6E0',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#598392',
  },
  actionButton: {
    backgroundColor: '#598392',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#EFF6E0',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#01161E',
    borderRadius: 8,
    width: 40,
    height: 50,
    fontSize: 18,
    color: '#EFF6E0',
    borderWidth: 1,
    borderColor: '#598392',
    marginHorizontal: 4,
  },
  dash: {
    color: '#EFF6E0',
    fontSize: 18,
    marginHorizontal: 8,
  },
});