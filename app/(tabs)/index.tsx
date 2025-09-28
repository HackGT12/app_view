import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RoomListView from '../../components/RoomListView';
import GameRoomView from '../../components/GameRoomView';

// Type definitions
interface GameRoom {
  id: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number;
  awayScore: number;
  clock: string;
  isLive: boolean;
  viewers: number;
  totalRaised: number;
}

interface League {
  id: string;
  name: string;
  image: string;
  gradient: string[];
  activeGames: number;
}

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_SPACING = 3;

const LEAGUES: League[] = [
  {
    id: 'nfl',
    name: 'NFL',
    image: 'american-football',
    gradient: ['#667eea', '#764ba2'],
    activeGames: 8,
  },
  {
    id: 'nba',
    name: 'NBA',
    image: 'basketball',
    gradient: ['#f093fb', '#f5576c'],
    activeGames: 12,
  },
  {
    id: 'mlb',
    name: 'MLB',
    image: 'baseball',
    gradient: ['#4facfe', '#00f2fe'],
    activeGames: 15,
  },
  {
    id: 'nhl',
    name: 'NHL',
    image: 'ice-cream',
    gradient: ['#43e97b', '#38f9d7'],
    activeGames: 6,
  },
  {
    id: 'mls',
    name: 'MLS',
    image: 'football',
    gradient: ['#fa709a', '#fee140'],
    activeGames: 10,
  },
  {
    id: 'ncaa',
    name: 'NCAA Football',
    image: 'school',
    gradient: ['#a8edea', '#fed6e3'],
    activeGames: 25,
  },
  {
    id: 'epl',
    name: 'Premier League',
    image: 'football',
    gradient: ['#ff9a9e', '#fecfef'],
    activeGames: 10,
  },
  {
    id: 'f1',
    name: 'Formula 1',
    image: 'car-sport',
    gradient: ['#ffecd2', '#fcb69f'],
    activeGames: 1,
  },
];

// Sample room data for each league
const LEAGUE_ROOMS: Record<string, GameRoom[]> = {
  nfl: [
    { id: 'nfl-1', name: 'Sunday Night Football', homeTeam: 'Falcons', awayTeam: 'Buccaneers', homeFlag: '🏈', awayFlag: '☠️', homeScore: 14, awayScore: 10, clock: '15:00', isLive: true, viewers: 15420, totalRaised: 89350 },
    { id: 'nfl-2', name: 'Monday Night Football', homeTeam: 'Cowboys', awayTeam: 'Giants', homeFlag: '⭐', awayFlag: '🗽', homeScore: 21, awayScore: 17, clock: '8:45', isLive: true, viewers: 18750, totalRaised: 125680 },
    { id: 'nfl-3', name: 'Primetime Showdown', homeTeam: 'Chiefs', awayTeam: 'Bills', homeFlag: '👑', awayFlag: '🦬', homeScore: 28, awayScore: 24, clock: '2:15', isLive: true, viewers: 22100, totalRaised: 156400 },
    { id: 'nfl-4', name: 'AFC Championship', homeTeam: 'Ravens', awayTeam: 'Bengals', homeFlag: '🐦⬛', awayFlag: '🐅', homeScore: 7, awayScore: 14, clock: '12:30', isLive: true, viewers: 19800, totalRaised: 98750 },
    { id: 'nfl-5', name: 'NFC Wildcard', homeTeam: 'Packers', awayTeam: 'Bears', homeFlag: '🧀', awayFlag: '🐻', homeScore: 35, awayScore: 21, clock: 'FINAL', isLive: false, viewers: 12500, totalRaised: 67890 },
    { id: 'nfl-6', name: 'Divisional Rivalry', homeTeam: 'Rams', awayTeam: '49ers', homeFlag: '🐏', awayFlag: '⛏️', homeScore: 17, awayScore: 20, clock: '5:23', isLive: true, viewers: 16200, totalRaised: 87650 },
    { id: 'nfl-7', name: 'Conference Final', homeTeam: 'Steelers', awayTeam: 'Browns', homeFlag: '⚫', awayFlag: '🤎', homeScore: 24, awayScore: 13, clock: '3:47', isLive: true, viewers: 14800, totalRaised: 76430 },
    { id: 'nfl-8', name: 'Super Bowl Preview', homeTeam: 'Eagles', awayTeam: 'Cardinals', homeFlag: '🦅', awayFlag: '🔴', homeScore: 31, awayScore: 28, clock: '1:55', isLive: true, viewers: 25600, totalRaised: 198250 },
  ],
  nba: [
    { id: 'nba-1', name: 'Lakers vs Warriors', homeTeam: 'Lakers', awayTeam: 'Warriors', homeFlag: '💜', awayFlag: '💛', homeScore: 108, awayScore: 115, clock: '2:45 Q4', isLive: true, viewers: 28500, totalRaised: 145600 },
    { id: 'nba-2', name: 'Celtics vs Heat', homeTeam: 'Celtics', awayTeam: 'Heat', homeFlag: '☘️', awayFlag: '🔥', homeScore: 98, awayScore: 102, clock: '8:20 Q3', isLive: true, viewers: 19800, totalRaised: 98750 },
    { id: 'nba-3', name: 'Nets vs Knicks', homeTeam: 'Nets', awayTeam: 'Knicks', homeFlag: '🏀', awayFlag: '🗽', homeScore: 89, awayScore: 76, clock: 'HALFTIME', isLive: true, viewers: 22100, totalRaised: 134280 },
  ],
  mlb: [
    { id: 'mlb-1', name: 'Yankees vs Red Sox', homeTeam: 'Yankees', awayTeam: 'Red Sox', homeFlag: '⚾', awayFlag: '🧦', homeScore: 7, awayScore: 4, clock: 'Top 8th', isLive: true, viewers: 15600, totalRaised: 87500 },
    { id: 'mlb-2', name: 'Dodgers vs Giants', homeTeam: 'Dodgers', awayTeam: 'Giants', homeFlag: '💙', awayFlag: '🧡', homeScore: 3, awayScore: 8, clock: 'Bot 6th', isLive: true, viewers: 18900, totalRaised: 112340 },
  ],
  nhl: [
    { id: 'nhl-1', name: 'Rangers vs Kings', homeTeam: 'Rangers', awayTeam: 'Kings', homeFlag: '🏒', awayFlag: '👑', homeScore: 2, awayScore: 1, clock: '15:30 P2', isLive: true, viewers: 12400, totalRaised: 65800 },
    { id: 'nhl-2', name: 'Bruins vs Penguins', homeTeam: 'Bruins', awayTeam: 'Penguins', homeFlag: '🐻', awayFlag: '🐧', homeScore: 4, awayScore: 3, clock: '8:45 P3', isLive: true, viewers: 14200, totalRaised: 78900 },
  ],
  mls: [
    { id: 'mls-1', name: 'Atlanta vs Miami', homeTeam: 'Atlanta United', awayTeam: 'Inter Miami', homeFlag: '⚫', awayFlag: '🩷', homeScore: 1, awayScore: 2, clock: "67'", isLive: true, viewers: 9800, totalRaised: 45600 },
    { id: 'mls-2', name: 'LAFC vs Galaxy', homeTeam: 'LAFC', awayTeam: 'LA Galaxy', homeFlag: '⚫', awayFlag: '💫', homeScore: 0, awayScore: 0, clock: "23'", isLive: true, viewers: 11200, totalRaised: 52400 },
  ],
  ncaa: [
    { id: 'ncaa-1', name: 'Alabama vs Georgia', homeTeam: 'Alabama', awayTeam: 'Georgia', homeFlag: '🔴', awayFlag: '🟢', homeScore: 21, awayScore: 14, clock: '3:42 Q3', isLive: true, viewers: 45600, totalRaised: 234500 },
    { id: 'ncaa-2', name: 'Ohio State vs Michigan', homeTeam: 'Ohio State', awayTeam: 'Michigan', homeFlag: '🌰', awayFlag: '〽️', homeScore: 28, awayScore: 35, clock: '12:15 Q4', isLive: true, viewers: 52100, totalRaised: 289650 },
  ],
  epl: [
    { id: 'epl-1', name: 'Manchester Derby', homeTeam: 'Man City', awayTeam: 'Man United', homeFlag: '💙', awayFlag: '❤️', homeScore: 2, awayScore: 1, clock: "78'", isLive: true, viewers: 67800, totalRaised: 456700 },
    { id: 'epl-2', name: 'North London Derby', homeTeam: 'Arsenal', awayTeam: 'Tottenham', homeFlag: '🔴', awayFlag: '⚪', homeScore: 3, awayScore: 2, clock: "85'", isLive: true, viewers: 54300, totalRaised: 378900 },
  ],
  f1: [
    { id: 'f1-1', name: 'Monaco Grand Prix', homeTeam: 'Verstappen', awayTeam: 'Hamilton', homeFlag: '🏎️', awayFlag: '🏁', homeScore: 0, awayScore: 0, clock: 'Lap 45/78', isLive: true, viewers: 89500, totalRaised: 567800 },
  ],
};

// Main HomeScreen Component
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<GameRoom | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleLeaguePress = (leagueId: string) => {
    setSelectedLeague(leagueId);
  };

  const handleRoomSelect = (room: GameRoom) => {
    setSelectedRoom(room);
  };

  const handleBackToSelection = () => {
    if (selectedRoom) {
      // If in game room, go back to room list
      setSelectedRoom(null);
    } else {
      // If in room list, go back to league selection
      setSelectedLeague(null);
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const cardIndex = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
    setCurrentCardIndex(cardIndex);
  };

  // Show game room if both league and room are selected
  if (selectedLeague && selectedRoom) {
    const league = LEAGUES.find(l => l.id === selectedLeague);
    return (
      <GameRoomView 
        selectedLeague={selectedLeague}
        selectedRoom={selectedRoom}
        onBack={handleBackToSelection}
        league={league}
      />
    );
  }

  // Show room list if league is selected but no room
  if (selectedLeague && !selectedRoom) {
    const league = LEAGUES.find(l => l.id === selectedLeague);
    const rooms = LEAGUE_ROOMS[selectedLeague] || [];
    return (
      <RoomListView 
        selectedLeague={selectedLeague}
        onBack={handleBackToSelection}
        onRoomSelect={handleRoomSelect}
        league={league}
        rooms={rooms}
      />
    );
  }

  const availableHeight = height - insets.top - 120; // Account for header and safe areas
  const cardHeight = availableHeight * 0.75; // Use 75% of available height

  return (
    <View style={[styles.container, { paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor="#01161E" translucent={false} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your League</Text>
        <Text style={styles.subtitle}>Pick a sport and start betting for charity</Text>
      </View>

      <View style={styles.scrollViewContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { 
            paddingLeft: (width - CARD_WIDTH) / 2 - CARD_SPACING,
            paddingRight: (width - CARD_WIDTH) / 2 - CARD_SPACING
          }]}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          snapToAlignment="start"
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {LEAGUES.map((league, index) => {
            const isActive = index === currentCardIndex;
            return (
              <TouchableOpacity
                key={league.id}
                style={[
                  styles.leagueCard,
                  {
                    marginRight: index === LEAGUES.length - 1 ? 0 : CARD_SPACING,
                    opacity: isActive ? 1 : 0.7,
                    transform: [{ scale: isActive ? 1 : 0.95 }],
                  },
                ]}
                onPress={() => handleLeaguePress(league.id)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={league.gradient as [string, string, ...string[]]}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name={league.image as any}
                        size={80}
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
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// Original styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01161E',
  },
  header: {
    paddingHorizontal: 30,
    marginBottom: 10,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EFF6E0',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#AEC3B0',
    fontWeight: '400',
  },
  scrollViewContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  leagueCard: {
    width: CARD_WIDTH,
    aspectRatio: 1,
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
    padding: 30,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  gamesBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  gamesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
});