import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  quarter: string;
  timeRemaining: string;
  charityPot: number;
}

const MOCK_GAMES: Record<string, Game[]> = {
  nfl: [
    {
      id: '1',
      homeTeam: 'Chiefs',
      awayTeam: 'Bills',
      homeScore: 21,
      awayScore: 17,
      status: 'LIVE',
      quarter: '3rd',
      timeRemaining: '8:34',
      charityPot: 12450,
    },
    {
      id: '2',
      homeTeam: 'Cowboys',
      awayTeam: 'Giants',
      homeScore: 14,
      awayScore: 10,
      status: 'LIVE',
      quarter: '2nd',
      timeRemaining: '2:15',
      charityPot: 8920,
    },
    {
      id: '3',
      homeTeam: '49ers',
      awayTeam: 'Rams',
      homeScore: 0,
      awayScore: 0,
      status: 'UPCOMING',
      quarter: '',
      timeRemaining: 'Starts in 2 hrs',
      charityPot: 5600,
    },
  ],
  nba: [
    {
      id: '4',
      homeTeam: 'Lakers',
      awayTeam: 'Warriors',
      homeScore: 95,
      awayScore: 102,
      status: 'LIVE',
      quarter: '4th',
      timeRemaining: '4:23',
      charityPot: 15200,
    },
    {
      id: '5',
      homeTeam: 'Celtics',
      awayTeam: 'Heat',
      homeScore: 78,
      awayScore: 81,
      status: 'LIVE',
      quarter: '3rd',
      timeRemaining: '7:45',
      charityPot: 9800,
    },
  ],
};

export default function GamesScreen() {
  const insets = useSafeAreaInsets();
  const { league } = useLocalSearchParams<{ league: string }>();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    if (league && MOCK_GAMES[league]) {
      setGames(MOCK_GAMES[league]);
    }
  }, [league]);

  const handleGamePress = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return '#FF3B30';
      case 'UPCOMING':
        return '#30D158';
      case 'FINAL':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#EFF6E0" />
        </TouchableOpacity>
        <Text style={styles.title}>{league?.toUpperCase()} Games</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={styles.gameCard}
            onPress={() => handleGamePress(game.id)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#124559', '#01161E']}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.gameHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(game.status) },
                  ]}
                >
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{game.status}</Text>
                </View>
                <Text style={styles.timeText}>{game.timeRemaining}</Text>
              </View>

              <View style={styles.matchup}>
                <View style={styles.team}>
                  <Text style={styles.teamName}>{game.awayTeam}</Text>
                  <Text style={styles.teamScore}>{game.awayScore}</Text>
                </View>
                <Text style={styles.vs}>@</Text>
                <View style={styles.team}>
                  <Text style={styles.teamName}>{game.homeTeam}</Text>
                  <Text style={styles.teamScore}>{game.homeScore}</Text>
                </View>
              </View>

              {game.quarter && (
                <Text style={styles.quarterText}>{game.quarter} Quarter</Text>
              )}

              <View style={styles.charitySection}>
                <Ionicons name="heart" size={16} color="#FF6B6B" />
                <Text style={styles.charityText}>
                  ${game.charityPot.toLocaleString()} raised
                </Text>
              </View>

              <View style={styles.actionIndicator}>
                <Text style={styles.actionText}>Tap to join betting</Text>
                <Ionicons name="chevron-forward" size={16} color="#AEC3B0" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#124559',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EFF6E0',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gameCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#598392',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  timeText: {
    fontSize: 14,
    color: '#AEC3B0',
    fontWeight: '500',
  },
  matchup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EFF6E0',
    marginBottom: 4,
  },
  teamScore: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EFF6E0',
  },
  vs: {
    fontSize: 16,
    color: '#AEC3B0',
    fontWeight: '600',
    marginHorizontal: 20,
  },
  quarterText: {
    fontSize: 14,
    color: '#AEC3B0',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  charitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  charityText: {
    fontSize: 14,
    color: '#EFF6E0',
    fontWeight: '600',
    marginLeft: 4,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#598392',
  },
  actionText: {
    fontSize: 12,
    color: '#AEC3B0',
    marginRight: 4,
  },
});
