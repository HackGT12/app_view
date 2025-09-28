import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  PanResponder,
  StatusBar,
  Vibration,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // ✅ adjust path if needed

// Type definitions
interface LightningPath {
  id: number;
  opacity: Animated.Value;
  x: number;
  rotation: number;
}

interface Particle {
  id: number;
  animation: Animated.Value;
  x: number;
  y: number;
  scale: Animated.Value;
}

interface MicroBet {
  question: string;
  optionA: string;
  optionB: string;
  emoji: string;
}

interface MicroBetOption {
  id: string;
  text: string;
  votes: number;
}

interface MicroBetData {
  actionDescription: string;
  answer: string;
  closedAt: any;
  createdAt: any;
  donation: number;
  maxDonation: number;
  options: MicroBetOption[];
  question: string;
  sponsor: string;
  status: string;
}

interface GameRoomViewProps {
  selectedLeague: string;
  selectedRoom: GameRoom;
  onBack: () => void;
}

interface RoomListViewProps {
  selectedLeague: string;
  onBack: () => void;
  onRoomSelect: (room: GameRoom) => void;
}

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

interface LightningFlashProps {
  visible: boolean;
}

interface ParticleEffectProps {
  visible: boolean;
}

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_SPACING = 3;

const LEAGUES = [
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
    { id: 'nfl-1', name: 'Sunday Night Football', homeTeam: 'Falcons', awayTeam: 'Buccaneers', homeFlag: '🏈', awayFlag: '🏴‍☠️', homeScore: 14, awayScore: 10, clock: '15:00', isLive: true, viewers: 15420, totalRaised: 89350 },
    { id: 'nfl-2', name: 'Monday Night Football', homeTeam: 'Cowboys', awayTeam: 'Giants', homeFlag: '⭐', awayFlag: '🗽', homeScore: 21, awayScore: 17, clock: '8:45', isLive: true, viewers: 18750, totalRaised: 125680 },
    { id: 'nfl-3', name: 'Primetime Showdown', homeTeam: 'Chiefs', awayTeam: 'Bills', homeFlag: '👑', awayFlag: '🦬', homeScore: 28, awayScore: 24, clock: '2:15', isLive: true, viewers: 22100, totalRaised: 156400 },
    { id: 'nfl-4', name: 'AFC Championship', homeTeam: 'Ravens', awayTeam: 'Bengals', homeFlag: '🐦‍⬛', awayFlag: '🐅', homeScore: 7, awayScore: 14, clock: '12:30', isLive: true, viewers: 19800, totalRaised: 98750 },
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

// Lightning Flash Component
const LightningFlash: React.FC<LightningFlashProps> = ({ visible }) => {
  const flashAnim = useRef(new Animated.Value(0)).current;
  const lightningPaths = useRef<LightningPath[]>([]);

  useEffect(() => {
    if (visible) {
      // Create lightning paths
      lightningPaths.current = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        opacity: new Animated.Value(0),
        x: Math.random() * width,
        rotation: Math.random() * 360,
      }));

      // Flash sequence
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Lightning bolt animations
      lightningPaths.current.forEach((path, index) => {
        Animated.sequence([
          Animated.delay(index * 50),
          Animated.timing(path.opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(path.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Screen flash */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: '#FFD700',
            opacity: flashAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      />
      {/* Lightning bolts */}
      {lightningPaths.current.map((path) => (
        <Animated.View
          key={path.id}
          style={[
            styles.lightning,
            {
              left: path.x,
              opacity: path.opacity,
              transform: [{ rotate: `${path.rotation}deg` }],
            },
          ]}
        >
          <Text style={styles.lightningBolt}>⚡</Text>
        </Animated.View>
      ))}
    </View>
  );
};

// Particle Effect Component
const ParticleEffect: React.FC<ParticleEffectProps> = ({ visible }) => {
  const particles = useRef<Particle[]>([]);
  
  useEffect(() => {
    if (visible) {
      // Create multiple particles
      particles.current = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        animation: new Animated.Value(0),
        x: Math.random() * width,
        y: height / 2,
        scale: new Animated.Value(0),
      }));

      // Animate particles
      particles.current.forEach((particle, index) => {
        Animated.parallel([
          Animated.timing(particle.animation, {
            toValue: 1,
            duration: 2000 + index * 100,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
              transform: [
                {
                  translateY: particle.animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -height],
                  }),
                },
                {
                  scale: particle.scale,
                },
              ],
              opacity: particle.animation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1, 0],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

// Room List View Component
const RoomListView: React.FC<RoomListViewProps> = ({ selectedLeague, onBack, onRoomSelect }) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(width)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const league = LEAGUES.find(l => l.id === selectedLeague);
  const rooms = LEAGUE_ROOMS[selectedLeague] || [];

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
        roomListStyles.container, 
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
        style={roomListStyles.header}
      >
        <TouchableOpacity style={roomListStyles.backButton} onPress={handleBack}>
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'] as [string, string]}
            style={roomListStyles.backButtonContainer}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
        <View style={roomListStyles.headerCenter}>
          <Text style={roomListStyles.headerTitle}>{league?.name}</Text>
          <Text style={roomListStyles.headerSubtitle}>{rooms.length} Active Games</Text>
        </View>
        <View style={roomListStyles.placeholder} />
      </LinearGradient>

      {/* League Header Card */}
      <View style={roomListStyles.leagueHeader}>
        <LinearGradient
          colors={(league?.gradient || ['#667eea', '#764ba2']) as [string, string, ...string[]]}
          style={roomListStyles.leagueHeaderGradient}
        >
          <View style={roomListStyles.leagueInfo}>
            <Ionicons name={league?.image as any} size={32} color="#ffffff" />
            <Text style={roomListStyles.leagueTitle}>{league?.name}</Text>
            <View style={roomListStyles.liveBadge}>
              <Animated.View 
                style={[
                  roomListStyles.liveDot,
                  {
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    })
                  }
                ]} 
              />
              <Text style={roomListStyles.liveText}>LIVE</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Rooms List */}
      <ScrollView style={roomListStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={roomListStyles.roomsContainer}>
          {rooms.map((room, index) => (
            <TouchableOpacity
              key={room.id}
              style={roomListStyles.roomCard}
              onPress={() => onRoomSelect(room)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={(room.isLive 
                  ? ['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.05)']
                  : ['rgba(107, 114, 128, 0.2)', 'rgba(107, 114, 128, 0.05)']) as [string, string]}
                style={roomListStyles.roomCardGradient}
              >
                <View style={roomListStyles.roomHeader}>
                  <Text style={roomListStyles.roomName}>{room.name}</Text>
                  <View style={[
                    roomListStyles.statusBadge,
                    { backgroundColor: room.isLive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(107, 114, 128, 0.3)' }
                  ]}>
                    <View style={[
                      roomListStyles.statusDot,
                      { backgroundColor: room.isLive ? '#22c55e' : '#6b7280' }
                    ]} />
                    <Text style={[
                      roomListStyles.statusText,
                      { color: room.isLive ? '#22c55e' : '#6b7280' }
                    ]}>
                      {room.isLive ? 'LIVE' : 'FINAL'}
                    </Text>
                  </View>
                </View>

                <View style={roomListStyles.matchInfo}>
                  <View style={roomListStyles.team}>
                    <Text style={roomListStyles.teamFlag}>{room.homeFlag}</Text>
                    <Text style={roomListStyles.teamName}>{room.homeTeam}</Text>
                  </View>

                  <View style={roomListStyles.scoreContainer}>
                    <Text style={roomListStyles.score}>
                      {room.homeScore} - {room.awayScore}
                    </Text>
                    <Text style={roomListStyles.clock}>{room.clock}</Text>
                  </View>

                  <View style={roomListStyles.team}>
                    <Text style={roomListStyles.teamFlag}>{room.awayFlag}</Text>
                    <Text style={roomListStyles.teamName}>{room.awayTeam}</Text>
                  </View>
                </View>

                <View style={roomListStyles.roomFooter}>
                  <View style={roomListStyles.stat}>
                    <Ionicons name="eye" size={12} color="rgba(255,255,255,0.6)" />
                    <Text style={roomListStyles.statText}>{room.viewers.toLocaleString()}</Text>
                  </View>
                  <View style={roomListStyles.stat}>
                    <Ionicons name="trending-up" size={12} color="#22c55e" />
                    <Text style={roomListStyles.statText}>${room.totalRaised.toLocaleString()}</Text>
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

// Game Room View Component
const GameRoomView: React.FC<GameRoomViewProps> = ({ selectedLeague, selectedRoom, onBack }) => {
  const [timeLeft, setTimeLeft] = useState(45);
  const [coins, setCoins] = useState(300);
  const [showMicroBet, setShowMicroBet] = useState(false);
  const [currentMicroBet, setCurrentMicroBet] = useState<MicroBet | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [showLightning, setShowLightning] = useState(false);
  const [previousMicroBets, setPreviousMicroBets] = useState<MicroBetData[]>([]); // ✅ add this

  const insets = useSafeAreaInsets();

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const swipeAnimX = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  // Continuous animations
  useEffect(() => {
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

    // Pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Sparkle effect
    Animated.loop(
      Animated.timing(sparkleAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    const loadPreviousMicroBets = async () => {
      try {
        const q = query(collection(db, 'microBets'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const bets: MicroBetData[] = [];
  
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as MicroBetData;
        
          // Normalize options into array
          let normalizedOptions: MicroBetOption[] = [];
          if (Array.isArray(data.options)) {
            normalizedOptions = data.options;
          } else if (data.options && typeof data.options === 'object') {
            normalizedOptions = Object.keys(data.options).map((key) => ({
              id: key,
              ...(data.options as any)[key],
            }));
          }
        
          bets.push({
            ...data,
            options: normalizedOptions,
          });
        });
  
        setPreviousMicroBets(bets);
      } catch (error) {
        console.error('Error loading previous micro bets:', error);
      }
    };
  
    loadPreviousMicroBets();
  }, []);

  // Entry animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderMove: (evt, gestureState) => {
        swipeAnimX.setValue(gestureState.dx);
        
        // Vibrate during swipe
        if (Math.abs(gestureState.dx) > 50) {
          Vibration.vibrate(10);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > 120) {
          const direction = gestureState.dx > 0 ? 'right' : 'left';
          const choice = direction === 'left' ? currentMicroBet?.optionA : currentMicroBet?.optionB;
          handleSwipe(direction, choice || '');
        } else {
          Animated.spring(swipeAnimX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const league = LEAGUES.find(l => l.id === selectedLeague);
  
  // Use the selectedRoom data instead of creating matchData
  const [matchData, setMatchData] = useState({
    homeTeam: { name: selectedRoom.homeTeam, flag: selectedRoom.homeFlag, score: selectedRoom.homeScore },
    awayTeam: { name: selectedRoom.awayTeam, flag: selectedRoom.awayFlag, score: selectedRoom.awayScore },
    clock: selectedRoom.clock,
  });  

  const pastBets = [
    {
      id: 1,
      description: 'Next Goal Scorer',
      choice: 'Messi',
      result: 'won',
      amount: '+125',
    },
    {
      id: 2,
      description: 'Next Card Color',
      choice: 'Yellow',
      result: 'lost',
      amount: '-50',
    },
    {
      id: 3,
      description: 'Next Corner',
      choice: 'Brazil',
      result: 'won',
      amount: '+75',
    },
    {
      id: 4,
      description: 'Next Foul',
      choice: 'Argentina',
      result: 'won',
      amount: '+200',
    },
  ];

  // Timer countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          triggerMicroBet();
          return Math.floor(Math.random() * 45) + 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (selectedLeague !== 'nfl') return; // ✅ only run for NFL
  
    const ws = new WebSocket('ws://10.136.7.78:8080');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connected to WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 Received data:', data);
  
        // ✅ update scores
        if (
          typeof data.homeTeamScore === 'number' &&
          typeof data.awayTeamScore === 'number'
        ) {
          setMatchData((prev) => ({
            ...prev,
            homeTeam: { ...prev.homeTeam, score: data.homeTeamScore },
            awayTeam: { ...prev.awayTeam, score: data.awayTeamScore },
          }));
        }
  
        // ✅ always pull clock from the latest play
        if (data?.payload?.clock) {
          setMatchData((prev) => ({
            ...prev,
            clock: data.payload.clock,
          }));
        }
      } catch (err) {
        console.error('Bad WS data:', err);
      }
    };

    ws.onclose = () => {
      console.log('⚠️ WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [selectedLeague]);  

  const triggerMicroBet = async () => {
    try {
      // 🔎 get most recent micro bets
      const q = query(collection(db, "microBets"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
  
      const bets: MicroBetData[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as MicroBetData;
  
        // ✅ normalize options
        let normalizedOptions: MicroBetOption[] = [];
        if (Array.isArray(data.options)) {
          normalizedOptions = data.options;
        } else if (data.options && typeof data.options === "object") {
          normalizedOptions = Object.keys(data.options).map((key) => ({
            id: key,
            ...(data.options as any)[key],
          }));
        }
  
        bets.push({
          ...data,
          options: normalizedOptions,
        });
      });
  
      if (bets.length > 0) {
        const latestBet = bets[0]; // 🆕 pick the most recent
  
        setCurrentMicroBet({
          question: latestBet.question,
          optionA: latestBet.options[0]?.text || "Option A",
          optionB: latestBet.options[1]?.text || "Option B",
          emoji: "⚡",
        });
  
        // --- keep all your animations below unchanged ---
        setShowLightning(true);
        setShowParticles(true);
  
        if (Platform.OS === "ios") {
          Vibration.vibrate([0, 100, 50, 100, 50, 200]);
        } else {
          Vibration.vibrate([100, 50, 100, 50, 200]);
        }
  
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
  
        setTimeout(() => {
          setShowLightning(false);
          setShowMicroBet(true);
  
          Animated.parallel([
            Animated.spring(popupScale, {
              toValue: 1,
              tension: 100,
              friction: 6,
              useNativeDriver: true,
            }),
            Animated.timing(popupOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start();
        }, 800);
  
        setTimeout(() => setShowParticles(false), 2000);
      }
    } catch (error) {
      console.error("❌ Failed to trigger micro bet:", error);
    }
  };  

  const handleSwipe = (direction: string, choice: string) => {
    // Success vibration
    Vibration.vibrate(200);

    // Explosive exit animation
    Animated.parallel([
      Animated.timing(swipeAnimX, {
        toValue: direction === 'left' ? -width * 1.5 : width * 1.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(popupScale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowMicroBet(false);
      swipeAnimX.setValue(0);
      popupScale.setValue(0);
      popupOpacity.setValue(0);
      
      const earned = Math.floor(Math.random() * 100) + 25;
      setCoins(prev => prev + earned);
      
      // Show success particles
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 1500);
    });
  };

  const handleBack = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onBack();
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View 
      style={[
        gameStyles.container, 
        { 
          paddingTop: insets.top,
          transform: [
            { translateX: slideAnim },
            { translateX: shakeAnim }
          ]
        }
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#01161E" translucent={false} />
      
      {/* Particle Effects */}
      <ParticleEffect visible={showParticles} />
      {/* Lightning Effects */}
      <LightningFlash visible={showLightning} />
      
      {/* Premium Header */}
      <LinearGradient
        colors={['rgba(1,22,30,0.8)', 'rgba(1,22,30,0.4)'] as [string, string]}
        style={gameStyles.header}
      >
        <TouchableOpacity style={gameStyles.backButton} onPress={handleBack}>
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'] as [string, string]}
            style={gameStyles.backButtonContainer}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
        <View style={gameStyles.headerCenter}>
          <Text style={gameStyles.headerTitle}>{league?.name}</Text>
          <View style={gameStyles.liveIndicator}>
            <Animated.View 
              style={[
                gameStyles.liveDot,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  })
                }
              ]} 
            />
            <Text style={gameStyles.liveText}>LIVE</Text>
          </View>
        </View>
        <TouchableOpacity style={gameStyles.menuButton}>
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'] as [string, string]}
            style={gameStyles.menuButtonContainer}
          >
            <Ionicons name="ellipsis-vertical" size={16} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <Animated.ScrollView 
        style={gameStyles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* Combined Hero Match Display and Score */}
        <Animated.View 
          style={[
            gameStyles.combinedContainer,
            {
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [0, 200],
                    outputRange: [0, -50],
                    extrapolate: 'clamp',
                  }),
                },
                {
                  scale: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.02],
                  })
                }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={[...(league?.gradient || ['#667eea', '#764ba2']), 'rgba(1,22,30,0.3)'] as [string, string, string]}
            style={gameStyles.combinedGradient}
          >
            <View style={gameStyles.combinedOverlay}>
              {/* Top section with rotating icon */}
              <View style={gameStyles.heroSection}>
                <Animated.View 
                  style={[
                    gameStyles.matchIcon,
                    {
                      transform: [{
                        rotate: sparkleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        })
                      }]
                    }
                  ]}
                >
                  <Ionicons name={league?.image as any} size={48} color="#ffffff" />
                </Animated.View>
                <Text style={gameStyles.matchStatus}>CHAMPIONSHIP FINAL</Text>
              </View>

              {/* Seamless score section */}
              <View style={gameStyles.scoreSection}>
                <View style={gameStyles.teamScore}>
                  {/* Falcons */}
                  <View style={gameStyles.team}>
                    <Text style={gameStyles.teamFlag}>{matchData.homeTeam.flag}</Text>
                    <Text style={gameStyles.teamName}>{matchData.homeTeam.name.toUpperCase()}</Text>
                  </View>

                  {/* Score + Clock */}
                  <View style={gameStyles.scoreDisplay}>
                    <Text style={gameStyles.score}>
                      {matchData.homeTeam.score} - {matchData.awayTeam.score}
                    </Text>
                    <View style={gameStyles.matchInfo}>
                      <Text style={gameStyles.matchTime}>{matchData.clock}</Text>
                      <View style={gameStyles.stadium}>
                        <Ionicons name="location" size={12} color="rgba(255,255,255,0.6)" />
                        <Text style={gameStyles.stadiumText}>Mercedes-Benz Stadium</Text>
                      </View>
                    </View>
                  </View>

                  {/* Buccaneers */}
                  <View style={gameStyles.team}>
                    <Text style={gameStyles.teamFlag}>{matchData.awayTeam.flag}</Text>
                    <Text style={gameStyles.teamName}>{matchData.awayTeam.name.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Total Raised Section */}
        <View style={gameStyles.contentContainer}>
          <Animated.View style={[gameStyles.tabContent, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.1)'] as [string, string]}
              style={gameStyles.raisedCard}
            >
              <View style={gameStyles.raisedHeader}>
                <Ionicons name="trending-up" size={24} color="#22c55e" />
                <Text style={gameStyles.raisedLabel}>Total Raised</Text>
              </View>
              <Text style={gameStyles.totalRaisedText}>$347,892</Text>
              <Text style={gameStyles.raisedSubtext}>+$15,420 this hour</Text>
              <View style={gameStyles.progressBar}>
                <View style={gameStyles.progressFill} />
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Premium Past Bets */}
        <View style={gameStyles.pastBetsContainer}>
          <View style={gameStyles.sectionHeader}>
            <Text style={gameStyles.pastBetsTitle}>Recent Micro Bets</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={gameStyles.betsScroll}>
            {previousMicroBets.map((bet, index) => (
              <Animated.View
                key={index}
                style={[
                  gameStyles.betCard,
                  {
                    transform: [{
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.05],
                        outputRange: [1, index === 0 ? 1.02 : 1],
                      })
                    }]
                  }
                ]}
              >
                <LinearGradient
                  colors={(bet.status === 'closed' 
                    ? ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.1)']
                    : ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)']) as [string, string]}
                  style={gameStyles.betCardGradient}
                >
                  <View style={gameStyles.betHeader}>
                    <View style={gameStyles.betStatus}>
                      <Ionicons 
                        name={bet.answer ? 'checkmark-circle' : 'help-circle'} 
                        size={16} 
                        color={bet.answer ? '#22c55e' : '#ef4444'} 
                      />
                      <Text style={[
                        gameStyles.betResult,
                        { color: bet.answer ? '#22c55e' : '#ef4444' }
                      ]}>
                        {bet.answer ? 'Resolved' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  <Text style={gameStyles.betDescription}>{bet.question}</Text>
                  {bet.answer && bet.options?.length > 0 && (
                  <Text style={gameStyles.betChoice}>
                    Winning Option: {bet.options.find(opt => opt.id === bet.answer)?.text || "Unknown"}
                  </Text>
                )}
                  <View style={gameStyles.betFooter}>
                    <Text style={gameStyles.betTime}>
                      {new Date(bet.createdAt?.seconds * 1000).toLocaleTimeString()}
                    </Text>
                    <TouchableOpacity style={gameStyles.shareButton}>
                      <Ionicons name="share-outline" size={12} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      </Animated.ScrollView>

      {/* Ultra Premium Bottom Panel */}
      <LinearGradient
        colors={['rgba(1,22,30,0.3)', 'rgba(1,22,30,0.6)'] as [string, string]}
        style={gameStyles.bottomContainer}
      >
        <Animated.View 
          style={[
            gameStyles.nextBetCard,
            {
              transform: [{
                scale: timeLeft <= 10 ? pulseAnim : new Animated.Value(1)
              }]
            }
          ]}
        >
          <LinearGradient
            colors={(timeLeft <= 10 
              ? ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)']
              : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']) as [string, string]}
            style={gameStyles.timerGradient}
          >
            <View style={gameStyles.timerContainer}>
              <Ionicons 
                name="flash" 
                size={18} 
                color={timeLeft <= 10 ? "#ef4444" : "#4ade80"} 
              />
              <Text style={gameStyles.nextBetLabel}>Next Micro Bet</Text>
            </View>
            <Text style={[
              gameStyles.nextBetTime,
              { color: timeLeft <= 10 ? "#ef4444" : "#ffffff" }
            ]}>
              {formatTime(timeLeft)}
            </Text>
          </LinearGradient>
        </Animated.View>
        
        <View style={gameStyles.coinsCard}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.1)'] as [string, string]}
            style={gameStyles.coinsGradient}
          >
            <View style={gameStyles.coinsHeader}>
              <Ionicons name="diamond" size={18} color="#FFD700" />
              <Text style={gameStyles.coinsLabel}>Coins</Text>
            </View>
            <Text style={gameStyles.coinsAmount}>{coins.toLocaleString()}</Text>
            <Text style={gameStyles.coinsSubtext}>+{Math.floor(coins * 0.05)} today</Text>
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* BEAUTIFUL Clean Micro Bet Popup */}
      <Modal visible={showMicroBet} transparent animationType="none">
        <View style={gameStyles.popupOverlay}>
          <Animated.View
            style={[
              gameStyles.popupContainer,
              {
                transform: [
                  { scale: popupScale },
                  { translateX: swipeAnimX },
                  {
                    rotateZ: swipeAnimX.interpolate({
                      inputRange: [-width, 0, width],
                      outputRange: ['-15deg', '0deg', '15deg'],
                    })
                  }
                ],
                opacity: popupOpacity,
              },
            ]}
            {...panResponder.panHandlers}
          >
            <LinearGradient
              colors={['#1a1a2e', '#16213e', '#0f3460'] as [string, string, string]}
              style={gameStyles.popupGradient}
            >
              {/* Beautiful Header */}
              <View style={gameStyles.popupHeader}>
                <Text style={gameStyles.popupEmoji}>{currentMicroBet?.emoji}</Text>
                <Animated.Text 
                  style={[
                    gameStyles.popupTitle,
                    {
                      transform: [{
                        scale: pulseAnim
                      }]
                    }
                  ]}
                >
                  MICRO BET
                </Animated.Text>
                <Text style={gameStyles.popupSubtitle}>Make your prediction</Text>
              </View>
              
              <Text style={gameStyles.popupQuestion}>{currentMicroBet?.question}</Text>
              
              {/* Beautiful Options */}
              <View style={gameStyles.optionsContainer}>
                <TouchableOpacity
                  style={gameStyles.optionButton}
                  onPress={() => handleSwipe('left', currentMicroBet?.optionA || '')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2'] as [string, string]}
                    style={gameStyles.optionGradient}
                  >
                    <View style={gameStyles.optionContent}>
                      <Ionicons name="chevron-back" size={20} color="#ffffff" />
                      <Text style={gameStyles.optionText} numberOfLines={2} ellipsizeMode="tail">
                        {currentMicroBet?.optionA}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
                
                <View style={gameStyles.vsContainer}>
                  <View style={gameStyles.vsCircle}>
                    <Text style={gameStyles.vsText}>VS</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={gameStyles.optionButton}
                  onPress={() => handleSwipe('right', currentMicroBet?.optionB || '')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#f093fb', '#f5576c'] as [string, string]}
                    style={gameStyles.optionGradient}
                  >
                    <View style={gameStyles.optionContent}>
                      <Text style={gameStyles.optionText} numberOfLines={2} ellipsizeMode="tail">
                        {currentMicroBet?.optionB}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color="#ffffff" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Clean Instructions */}
              <View style={gameStyles.swipeInstructions}>
                <View style={gameStyles.instructionsContainer}>
                  <Ionicons name="swap-horizontal" size={20} color="#64748b" />
                  <Text style={gameStyles.instructionText}>Swipe left or right to bet</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </Animated.View>
  );
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
    return (
      <GameRoomView 
        selectedLeague={selectedLeague}
        selectedRoom={selectedRoom}
        onBack={handleBackToSelection}
      />
    );
  }

  // Show room list if league is selected but no room
  if (selectedLeague && !selectedRoom) {
    return (
      <RoomListView 
        selectedLeague={selectedLeague}
        onBack={handleBackToSelection}
        onRoomSelect={handleRoomSelect}
      />
    );
  }

  const availableHeight = height - insets.top - 120; // Account for header and safe areas
  const cardHeight = availableHeight * 0.75; // Use 75% of available height

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
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
                    height: cardHeight,
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
    fontSize: 28,
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
  lightning: {
    position: 'absolute',
    top: '20%',
  },
  lightningBolt: {
    fontSize: 50,
    color: '#FFD700',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
});

// Room List styles
const roomListStyles = StyleSheet.create({
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

// Ultra Premium Game Room styles
const gameStyles = StyleSheet.create({
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
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
    letterSpacing: 1,
  },
  menuButton: {
    zIndex: 10,
  },
  menuButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  combinedContainer: {
    height: 280,
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  combinedGradient: {
    flex: 1,
  },
  combinedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(1,22,30,0.3)',
    paddingVertical: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  matchIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  matchStatus: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    opacity: 0.9,
  },
  scoreSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  teamScore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    alignItems: 'center',
    flex: 1,
  },
  teamFlag: {
    fontSize: 32,
    marginBottom: 8,
  },
  teamName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  teamRecord: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '500',
  },
  scoreDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  score: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  matchInfo: {
    alignItems: 'center',
  },
  matchTime: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  stadium: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stadiumText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginLeft: 2,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  tabContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  raisedCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  raisedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  raisedLabel: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  totalRaisedText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  raisedSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '73%',
    height: '100%',
    backgroundColor: '#22c55e',
  },
  pastBetsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pastBetsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  betsScroll: {
    paddingBottom: 8,
  },
  betCard: {
    width: 220,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
  },
  betCardGradient: {
    padding: 16,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  betStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  betResult: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  betAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  betDescription: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  betChoice: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginBottom: 12,
  },
  betFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  shareButton: {
    padding: 4,
  },
  bottomContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  nextBetCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  timerGradient: {
    padding: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextBetLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  nextBetTime: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  coinsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 120,
  },
  coinsGradient: {
    padding: 16,
    alignItems: 'center',
  },
  coinsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coinsLabel: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  coinsAmount: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  coinsSubtext: {
    color: 'rgba(255, 215, 0, 0.7)',
    fontSize: 9,
  },
  // BEAUTIFUL Clean Popup Styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  popupGradient: {
    padding: 32,
  },
  popupHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  popupEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  popupTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },
  popupSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  popupQuestion: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '600',
    lineHeight: 28,
  },
  optionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 16,
  },
  optionButton: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  optionGradient: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    minHeight: 70,
    justifyContent: 'center',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    width: '100%',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  vsContainer: {
    alignItems: 'center',
  },
  vsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  vsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  swipeInstructions: {
    alignItems: 'center',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  instructionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
});