// app/teams.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TextInput, Button, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, arrayUnion } from "firebase/firestore";

// ⚡ Make sure Firebase is initialized in your project already
// (firebase/app + firebase/auth + firebase/firestore)

export default function TeamsScreen() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const teamIds = userData.teams || [];

          const fetchedTeams: any[] = [];
          for (const id of teamIds) {
            const teamRef = doc(db, "teams", id);
            const teamSnap = await getDoc(teamRef);
            if (teamSnap.exists()) {
              fetchedTeams.push({ id: teamSnap.id, ...teamSnap.data() });
            }
          }
          setTeams(fetchedTeams);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Create team doc
      const teamRef = await addDoc(collection(db, "teams"), {
        name: newTeamName,
        createdBy: user.uid,
        members: [user.uid],
        createdAt: new Date(),
      });

      // Add team ID to user doc
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        teams: arrayUnion(teamRef.id),
      });

      // Update local state
      setTeams((prev) => [...prev, { id: teamRef.id, name: newTeamName, createdBy: user.uid }]);
      setNewTeamName("");
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EFF6E0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Teams</Text>

      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.teamCard}>
            <Text style={styles.teamName}>{item.name}</Text>
            <Text style={styles.teamMeta}>Created by: {item.createdBy}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>You’re not in any teams yet.</Text>}
      />

      <View style={styles.newTeamContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter team name"
          placeholderTextColor="#598392"
          value={newTeamName}
          onChangeText={setNewTeamName}
        />
        <TouchableOpacity style={styles.button} onPress={handleCreateTeam}>
          <Text style={styles.buttonText}>Create Team</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#01161E",
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#01161E",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#EFF6E0",
    marginBottom: 20,
  },
  teamCard: {
    backgroundColor: "#124559",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#598392",
  },
  teamName: {
    color: "#EFF6E0",
    fontSize: 18,
    fontWeight: "600",
  },
  teamMeta: {
    color: "#AEC3B0",
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    color: "#598392",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  newTeamContainer: {
    marginTop: 20,
  },
  input: {
    borderColor: "#598392",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: "#EFF6E0",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#598392",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#EFF6E0",
    fontWeight: "600",
  },
});
