import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

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

interface RoomListViewProps {
  selectedLeague: string;
  onBack: () => void;
  onRoomSelect: (room: GameRoom) => void;
  league: League | undefined;
  rooms: GameRoom[];
}

const RoomListView: React.FC<RoomListViewProps> = ({ 
  selectedLeague, 
  onBack, 
  onRoomSelect, 
  league, 
  rooms 
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(width)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Entry animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleBack = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onBack();
    });
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          paddingTop: insets.top,
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#01161E" translucent={false} />
      
      {/* Header */}
      <LinearGradient
        colors={['rgba(1,22,30,0.8)', 'rgba(1,22,30,0.4)'] as [string, string]}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'] as [string, string]}
            style={styles.backButtonContainer}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{league?.name}</Text>
          <Text style={styles.headerSubtitle}>{rooms.length} Active Games</Text>
        </View>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* League Header Card */}
      <View style={styles.leagueHeader}>
        <LinearGradient
          colors={(league?.gradient || ['#667eea', '#764ba2']) as [string, string, ...string[]]}
          style={styles.leagueHeaderGradient}
        >
          <View style={styles.leagueInfo}>
            <Ionicons name={league?.image as any} size={32} color="#ffffff" />
            <Text style={styles.leagueTitle}>{league?.name}</Text>
            <View style={styles.liveBadge}>
              <Animated.View 
                style={[
                  styles.liveDot,
                  {
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    })
                  }
                ]} 
              />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Rooms List */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.roomsContainer}>
          {rooms.map((room, index) => (
            <TouchableOpacity
              key={room.id}
              style={styles.roomCard}
              onPress={() => onRoomSelect(room)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={(room.isLive 
                  ? ['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.05)']
                  : ['rgba(107, 114, 128, 0.2)', 'rgba(107, 114, 128, 0.05)']) as [string, string]}
                style={styles.roomCardGradient}
              >
                <View style={styles.roomHeader}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: room.isLive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(107, 114, 128, 0.3)' }
                  ]}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: room.isLive ? '#22c55e' : '#6b7280' }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: room.isLive ? '#22c55e' : '#6b7280' }
                    ]}>
                      {room.isLive ? 'LIVE' : 'FINAL'}
                    </Text>
                  </View>
                </View>

                <View style={styles.matchInfo}>
                  <View style={styles.team}>
                    <Text style={styles.teamFlag}>{room.homeFlag}</Text>
                    <Text style={styles.teamName}>{room.homeTeam}</Text>
                  </View>

                  <View style={styles.scoreContainer}>
                    <Text style={styles.score}>
                      {room.homeScore} - {room.awayScore}
                    </Text>
                    <Text style={styles.clock}>{room.clock}</Text>
                  </View>

                  <View style={styles.team}>
                    <Text style={styles.teamFlag}>{room.awayFlag}</Text>
                    <Text style={styles.teamName}>{room.awayTeam}</Text>
                  </View>
                </View>

                <View style={styles.roomFooter}>
                  <View style={styles.stat}>
                    <Ionicons name="eye" size={12} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.statText}>{room.viewers.toLocaleString()}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="trending-up" size={12} color="#22c55e" />
                    <Text style={styles.statText}>${room.totalRaised.toLocaleString()}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01161E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    zIndex: 10,
  },
  backButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  placeholder: {
    width: 44,
  },
  leagueHeader: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  leagueHeaderGradient: {
    padding: 20,
    alignItems: 'center',
  },
  leagueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leagueTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  scrollContainer: {
    flex: 1,
  },
  roomsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  roomCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  roomCardGradient: {
    padding: 20,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  team: {
    alignItems: 'center',
    flex: 1,
  },
  teamFlag: {
    fontSize: 24,
    marginBottom: 4,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    flex: 1,
  },
  score: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  clock: {
    fontSize: 11,
    color: '#4ade80',
    fontWeight: '600',
  },
  roomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
});

export default RoomListView;