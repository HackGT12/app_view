import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

interface GameSelectionProps {
  teamName: string | string[];
  onGameSelect: (gameId: string) => void;
}

const GameSelection: React.FC<GameSelectionProps> = ({ teamName, onGameSelect }) => {
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
          onPress={() => onGameSelect('falcons-bucks')}
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
              <Text style={styles.teamLogo}>🏴☠️</Text>
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
};

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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
});

export default GameSelection;