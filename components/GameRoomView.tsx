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
import { db } from "../firebaseConfig";
import LightningFlash from './LightningFlash';
import ParticleEffect from './ParticleEffect';

const { width, height } = Dimensions.get('window');

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
  league: League | undefined;
}

const GameRoomView: React.FC<GameRoomViewProps> = ({ 
  selectedLeague, 
  selectedRoom, 
  onBack, 
  league 
}) => {
  const [timeLeft, setTimeLeft] = useState(45);
  const [coins, setCoins] = useState(300);
  const [showMicroBet, setShowMicroBet] = useState(false);
  const [currentMicroBet, setCurrentMicroBet] = useState<MicroBet | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [showLightning, setShowLightning] = useState(false);
  const [previousMicroBets, setPreviousMicroBets] = useState<MicroBetData[]>([]);

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

  // Use the selectedRoom data instead of creating matchData
  const [matchData, setMatchData] = useState({
    homeTeam: { name: selectedRoom.homeTeam, flag: selectedRoom.homeFlag, score: selectedRoom.homeScore },
    awayTeam: { name: selectedRoom.awayTeam, flag: selectedRoom.awayFlag, score: selectedRoom.awayScore },
    homeTeamName: 'Falcons',
    awayTeamName: 'Buccaneers',
    clock: selectedRoom.clock,
  });

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
    if (selectedLeague !== 'nfl') return;

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
        styles.container, 
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
          <View style={styles.liveIndicator}>
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
        <TouchableOpacity style={styles.menuButton}>
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'] as [string, string]}
            style={styles.menuButtonContainer}
          >
            <Ionicons name="ellipsis-vertical" size={16} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <Animated.ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* Combined Hero Match Display and Score */}
        <Animated.View 
          style={[
            styles.combinedContainer,
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
            style={styles.combinedGradient}
          >
            <View style={styles.combinedOverlay}>
              {/* Top section with rotating icon */}
              <View style={styles.heroSection}>
                <Animated.View 
                  style={[
                    styles.matchIcon,
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
                <Text style={styles.matchStatus}>CHAMPIONSHIP FINAL</Text>
              </View>

              {/* Seamless score section */}
              <View style={styles.scoreSection}>
                <View style={styles.teamScore}>
                  {/* Home Team */}
                  <View style={styles.team}>
                    <Text style={styles.teamFlag}>{matchData.homeTeam.flag}</Text>
                    <Text style={styles.teamName}>{matchData.homeTeam.name.toUpperCase()}</Text>
                  </View>

                  {/* Score + Clock */}
                  <View style={styles.scoreDisplay}>
                    <Text style={styles.score}>
                      {matchData.homeTeam.score} - {matchData.awayTeam.score}
                    </Text>
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchTime}>{matchData.clock}</Text>
                      <View style={styles.stadium}>
                        <Ionicons name="location" size={12} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.stadiumText}>Mercedes-Benz Stadium</Text>
                      </View>
                    </View>
                  </View>

                  {/* Away Team */}
                  <View style={styles.team}>
                    <Text style={styles.teamFlag}>{matchData.awayTeam.flag}</Text>
                    <Text style={styles.teamName}>{matchData.awayTeam.name.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Total Raised Section */}
        <View style={styles.contentContainer}>
          <Animated.View style={[styles.tabContent, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.1)'] as [string, string]}
              style={styles.raisedCard}
            >
              <View style={styles.raisedHeader}>
                <Ionicons name="trending-up" size={24} color="#22c55e" />
                <Text style={styles.raisedLabel}>Total Raised</Text>
              </View>
              <Text style={styles.totalRaisedText}>$347,892</Text>
              <Text style={styles.raisedSubtext}>+$15,420 this hour</Text>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Premium Past Bets */}
        <View style={styles.pastBetsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.pastBetsTitle}>Recent Micro Bets</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.betsScroll}>
            {previousMicroBets.map((bet, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.betCard,
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
                  style={styles.betCardGradient}
                >
                  <View style={styles.betHeader}>
                    <View style={styles.betStatus}>
                      <Ionicons 
                        name={bet.answer ? 'checkmark-circle' : 'help-circle'} 
                        size={16} 
                        color={bet.answer ? '#22c55e' : '#ef4444'} 
                      />
                      <Text style={[
                        styles.betResult,
                        { color: bet.answer ? '#22c55e' : '#ef4444' }
                      ]}>
                        {bet.answer ? 'Resolved' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.betDescription}>{bet.question}</Text>
                  {bet.answer && bet.options?.length > 0 && (
                  <Text style={styles.betChoice}>
                    Winning Option: {bet.options.find(opt => opt.id === bet.answer)?.text || "Unknown"}
                  </Text>
                )}
                  <View style={styles.betFooter}>
                    <Text style={styles.betTime}>
                      {new Date(bet.createdAt?.seconds * 1000).toLocaleTimeString()}
                    </Text>
                    <TouchableOpacity style={styles.shareButton}>
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
        style={styles.bottomContainer}
      >
        <Animated.View 
          style={[
            styles.nextBetCard,
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
            style={styles.timerGradient}
          >
            <View style={styles.timerContainer}>
              <Ionicons 
                name="flash" 
                size={18} 
                color={timeLeft <= 10 ? "#ef4444" : "#4ade80"} 
              />
              <Text style={styles.nextBetLabel}>Next Micro Bet</Text>
            </View>
            <Text style={[
              styles.nextBetTime,
              { color: timeLeft <= 10 ? "#ef4444" : "#ffffff" }
            ]}>
              {formatTime(timeLeft)}
            </Text>
          </LinearGradient>
        </Animated.View>
        
        <View style={styles.coinsCard}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.1)'] as [string, string]}
            style={styles.coinsGradient}
          >
            <View style={styles.coinsHeader}>
              <Ionicons name="diamond" size={18} color="#FFD700" />
              <Text style={styles.coinsLabel}>Coins</Text>
            </View>
            <Text style={styles.coinsAmount}>{coins.toLocaleString()}</Text>
            <Text style={styles.coinsSubtext}>+{Math.floor(coins * 0.05)} today</Text>
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* BEAUTIFUL Clean Micro Bet Popup */}
      <Modal visible={showMicroBet} transparent animationType="none">
        <View style={styles.popupOverlay}>
          <Animated.View
            style={[
              styles.popupContainer,
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
              style={styles.popupGradient}
            >
              {/* Beautiful Header */}
              <View style={styles.popupHeader}>
                <Text style={styles.popupEmoji}>{currentMicroBet?.emoji}</Text>
                <Animated.Text 
                  style={[
                    styles.popupTitle,
                    {
                      transform: [{
                        scale: pulseAnim
                      }]
                    }
                  ]}
                >
                  MICRO BET
                </Animated.Text>
                <Text style={styles.popupSubtitle}>Make your prediction</Text>
              </View>
              
              <Text style={styles.popupQuestion}>{currentMicroBet?.question}</Text>
              
              {/* Beautiful Options */}
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleSwipe('left', currentMicroBet?.optionA || '')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2'] as [string, string]}
                    style={styles.optionGradient}
                  >
                    <View style={styles.optionContent}>
                      <Ionicons name="chevron-back" size={20} color="#ffffff" />
                      <Text style={styles.optionText} numberOfLines={2} ellipsizeMode="tail">
                        {currentMicroBet?.optionA}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
                
                <View style={styles.vsContainer}>
                  <View style={styles.vsCircle}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleSwipe('right', currentMicroBet?.optionB || '')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#f093fb', '#f5576c'] as [string, string]}
                    style={styles.optionGradient}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.optionText} numberOfLines={2} ellipsizeMode="tail">
                        {currentMicroBet?.optionB}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color="#ffffff" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Clean Instructions */}
              <View style={styles.swipeInstructions}>
                <View style={styles.instructionsContainer}>
                  <Ionicons name="swap-horizontal" size={20} color="#64748b" />
                  <Text style={styles.instructionText}>Swipe left or right to bet</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
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

export default GameRoomView;