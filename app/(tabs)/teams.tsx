// app/TeamsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  setDoc,
} from "firebase/firestore";

const TeamsScreen: React.FC = () => {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");
  const [joinTeamId, setJoinTeamId] = useState("");

  // Fetch teams the user is in
  useEffect(() => {
    const fetchTeams = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const teamIds: string[] = userData.teams || [];

          const fetchedTeams = [];
          for (const teamId of teamIds) {
            const teamRef = doc(db, "teams", teamId);
            const teamSnap = await getDoc(teamRef);
            if (teamSnap.exists()) {
              fetchedTeams.push({ id: teamId, ...teamSnap.data() });
            }
          }
          setTeams(fetchedTeams);
        }
      } catch (err) {
        console.error("Error fetching teams:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [user]);

  const handleCreateTeam = async () => {
    if (!user || !newTeamName.trim()) return;

    try {
      const teamRef = doc(db, "teams", `${Date.now()}_${user.uid}`);
      await setDoc(teamRef, {
        name: newTeamName,
        createdBy: user.uid,
        members: [user.uid],
      });

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        teams: arrayUnion(teamRef.id),
      });

      setTeams((prev) => [...prev, { id: teamRef.id, name: newTeamName }]);
      setNewTeamName("");
    } catch (err) {
      console.error("Error creating team:", err);
    }
  };

  const handleJoinTeam = async () => {
    if (!user || !joinTeamId.trim()) return;

    try {
      const teamRef = doc(db, "teams", joinTeamId);
      const teamSnap = await getDoc(teamRef);

      if (teamSnap.exists()) {
        await updateDoc(teamRef, {
          members: arrayUnion(user.uid),
        });

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          teams: arrayUnion(joinTeamId),
        });

        setTeams((prev) => [...prev, { id: joinTeamId, ...teamSnap.data() }]);
        setJoinTeamId("");
      } else {
        alert("Team not found.");
      }
    } catch (err) {
      console.error("Error joining team:", err);
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
      <Text style={styles.header}>Your Teams</Text>
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.teamCard}>
            <Text style={styles.teamName}>{item.name}</Text>
            <Text style={styles.teamId}>ID: {item.id}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>You’re not in any teams yet.</Text>
        }
      />

      {/* Create a Team */}
      <Text style={styles.header}>Create a Team</Text>
      <TextInput
        style={styles.input}
        placeholder="Team Name"
        value={newTeamName}
        onChangeText={setNewTeamName}
      />
      <TouchableOpacity style={styles.button} onPress={handleCreateTeam}>
        <Text style={styles.buttonText}>Create Team</Text>
      </TouchableOpacity>

      {/* Join a Team */}
      <Text style={styles.header}>Join a Team</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Team ID"
        value={joinTeamId}
        onChangeText={setJoinTeamId}
      />
      <TouchableOpacity style={styles.button} onPress={handleJoinTeam}>
        <Text style={styles.buttonText}>Join Team</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TeamsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 20, fontWeight: "600", marginTop: 20, marginBottom: 10 },
  loadingText: { textAlign: "center", marginTop: 50, fontSize: 16 },
  emptyText: { textAlign: "center", marginTop: 20, color: "#777" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  teamCard: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 10,
  },
  teamName: { fontSize: 18, fontWeight: "500" },
  teamId: { fontSize: 14, color: "#666", marginTop: 4 },
});
