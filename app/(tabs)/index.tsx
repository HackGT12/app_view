import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_MARGIN = 15;

const LEAGUES = [
  {
    id: 'nfl',
    name: 'NFL',
    image: 'american-football',
    gradient: ['#FF6B35', '#FF8E35'],
    activeGames: 8,
  },
  {
    id: 'nba',
    name: 'NBA',
    image: 'basketball',
    gradient: ['#FF6B6B', '#FF8E8E'],
    activeGames: 12,
  },
  {
    id: 'mlb',
    name: 'MLB',
    image: 'baseball',
    gradient: ['#4ECDC4', '#44B3A8'],
    activeGames: 15,
  },
  {
    id: 'nhl',
    name: 'NHL',
    image: 'ice-cream',
    gradient: ['#45B7D1', '#96CEB4'],
    activeGames: 6,
  },
  {
    id: 'mls',
    name: 'MLS',
    image: 'football',
    gradient: ['#96CEB4', '#FFEAA7'],
    activeGames: 10,
  },
  {
    id: 'ncaa',
    name: 'NCAA Football',
    image: 'school',
    gradient: ['#A29BFE', '#DDA0DD'],
    activeGames: 25,
  },
  {
    id: 'epl',
    name: 'Premier League',
    image: 'football',
    gradient: ['#00B894', '#00CEC9'],
    activeGames: 10,
  },
  {
    id: 'f1',
    name: 'Formula 1',
    image: 'car-sport',
    gradient: ['#E17055', '#FDCB6E'],
    activeGames: 1,
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  const handleLeaguePress = (leagueId: string) => {
    setSelectedLeague(leagueId);
    router.push(`/games/${leagueId}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your League</Text>
        <Text style={styles.subtitle}>Pick a sport and start betting for charity</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        snapToAlignment="center"
        style={styles.scrollView}
      >
        {LEAGUES.map((league, index) => (
          <TouchableOpacity
            key={league.id}
            style={[
              styles.leagueCard,
              {
                marginLeft: index === 0 ? 30 : CARD_MARGIN,
                marginRight: index === LEAGUES.length - 1 ? 30 : CARD_MARGIN,
              },
            ]}
            onPress={() => handleLeaguePress(league.id)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={league.gradient}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={league.image as any}
                    size={60}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.leagueName}>{league.name}</Text>
                <View style={styles.gamesBadge}>
                  <Text style={styles.gamesText}>
                    {league.activeGames} Active Games
                  </Text>
                </View>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.charityInfo}>
          <Ionicons name="heart" size={24} color="#FF6B6B" />
          <Text style={styles.charityText}>$45,230 raised this week</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01161E',
  },
  header: {
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EFF6E0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#AEC3B0',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  leagueCard: {
    width: CARD_WIDTH,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    flex: 1,
    padding: 20,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  leagueName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  gamesBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  gamesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#333',
  },
  bottomSection: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  charityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#124559',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#598392',
  },
  charityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EFF6E0',
    marginLeft: 8,
  },
});
