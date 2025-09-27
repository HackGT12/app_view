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

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_MARGIN = 15;

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

// Lightning Flash Component
const LightningFlash = ({ visible }) => {
  const flashAnim = useRef(new Animated.Value(0)).current;
  const lightningPaths = useRef([]);

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
const ParticleEffect = ({ visible }) => {
  const particles = useRef([]);
  
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

// Game Room View Component
const GameRoomView = ({ selectedLeague, onBack }) => {
  const [timeLeft, setTimeLeft] = useState(45);
  const [coins, setCoins] = useState(300);
  const [showMicroBet, setShowMicroBet] = useState(false);
  const [currentMicroBet, setCurrentMicroBet] = useState(null);
  const [showParticles, setShowParticles] = useState(false);
  const [showLightning, setShowLightning] = useState(false);
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
          handleSwipe(direction, choice);
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
  
  const matchData = {
    homeTeam: { name: 'Brazil', flag: '🇧🇷', score: 3 },
    awayTeam: { name: 'Argentina', flag: '🇦🇷', score: 0 },
  };

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

  const triggerMicroBet = () => {
    const microBets = [
      {
        question: "Who will score the next goal?",
        optionA: "Brazil",
        optionB: "Argentina",
      },
      {
        question: "Next card color?",
        optionA: "Yellow",
        optionB: "Red",
      },
      {
        question: "Next corner kick?",
        optionA: "Brazil",
        optionB: "Argentina",
      },
      {
        question: "Next player to get fouled?",
        optionA: "Messi",
        optionB: "Neymar",
      }
    ];

    const randomBet = microBets[Math.floor(Math.random() * microBets.length)];
    setCurrentMicroBet(randomBet);
    
    // Lightning first, then popup
    setShowLightning(true);
    setShowParticles(true);

    // Epic vibration pattern
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 100, 50, 100, 50, 200]);
    } else {
      Vibration.vibrate([100, 50, 100, 50, 200]);
    }

    // Screen shake effect
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      setShowLightning(false);
      setShowMicroBet(true);

      // Epic popup animation
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
  };

  const handleSwipe = (direction, choice) => {
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

  const formatTime = (seconds) => {
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
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      
      {/* Particle Effects */}
      <ParticleEffect visible={showParticles} />
      {/* Lightning Effects */}
      <LightningFlash visible={showLightning} />
      
      {/* Premium Header */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)']}
        style={gameStyles.header}
      >
        <TouchableOpacity style={gameStyles.backButton} onPress={handleBack}>
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
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
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
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
        {/* Hero Match Display with Parallax */}
        <Animated.View 
          style={[
            gameStyles.matchContainer,
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
            colors={[...league?.gradient || ['#667eea', '#764ba2'], 'rgba(0,0,0,0.3)']}
            style={gameStyles.matchGradient}
          >
            <View style={gameStyles.matchOverlay}>
              <View style={gameStyles.matchContent}>
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
                  <Ionicons name={league?.image} size={48} color="#ffffff" />
                </Animated.View>
                <Text style={gameStyles.matchStatus}>CHAMPIONSHIP FINAL</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Premium Score Card */}
        <View style={gameStyles.scoreCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
            style={gameStyles.scoreGradient}
          >
            <View style={gameStyles.teamScore}>
              <View style={gameStyles.team}>
                <Text style={gameStyles.teamFlag}>{matchData.homeTeam.flag}</Text>
                <Text style={gameStyles.teamName}>BRAZIL</Text>
                <Text style={gameStyles.teamRecord}>12-2-1</Text>
              </View>
              <View style={gameStyles.scoreDisplay}>
                <Text style={gameStyles.score}>
                  {matchData.homeTeam.score} - {matchData.awayTeam.score}
                </Text>
                <View style={gameStyles.matchInfo}>
                  <Text style={gameStyles.matchTime}>78' • 2nd Half</Text>
                  <View style={gameStyles.stadium}>
                    <Ionicons name="location" size={12} color="rgba(255,255,255,0.6)" />
                    <Text style={gameStyles.stadiumText}>Maracanã</Text>
                  </View>
                </View>
              </View>
              <View style={gameStyles.team}>
                <Text style={gameStyles.teamFlag}>{matchData.awayTeam.flag}</Text>
                <Text style={gameStyles.teamName}>ARGENTINA</Text>
                <Text style={gameStyles.teamRecord}>10-3-2</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Total Raised Section - Compact Full Width */}
        <View style={gameStyles.totalRaisedBottom}>
          <Animated.View 
            style={[
              gameStyles.tabContent, 
              { transform: [{ scale: 0.95 }] } // slightly smaller but still full width
            ]}
          >
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.1)']}
              style={[gameStyles.raisedCard, { paddingVertical: 14, paddingHorizontal: 16 }]}
            >
              <View style={[gameStyles.raisedHeader, { marginBottom: 8 }]}>
                <Ionicons name="trending-up" size={20} color="#22c55e" />
                <Text style={[gameStyles.raisedLabel, { fontSize: 13 }]}>
                  Total Raised
                </Text>
              </View>

              <Text style={[gameStyles.totalRaisedText, { fontSize: 22 }]}>
                $347,892
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Premium Past Bets */}
        <View style={gameStyles.pastBetsContainer}>
          <View style={gameStyles.sectionHeader}>
            <Text style={gameStyles.pastBetsTitle}>Recent Micro Bets</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={gameStyles.betsScroll}>
            {pastBets.map((bet, index) => (
              <Animated.View
                key={bet.id}
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
                  colors={bet.result === 'won' 
                    ? ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.1)'] 
                    : ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)']}
                  style={gameStyles.betCardGradient}
                >
                  <View style={gameStyles.betHeader}>
                    <View style={gameStyles.betStatus}>
                      <Ionicons 
                        name={bet.result === 'won' ? 'checkmark-circle' : 'close-circle'} 
                        size={16} 
                        color={bet.result === 'won' ? '#22c55e' : '#ef4444'} 
                      />
                      <Text style={[
                        gameStyles.betResult,
                        { color: bet.result === 'won' ? '#22c55e' : '#ef4444' }
                      ]}>
                        {bet.result === 'won' ? 'Won' : 'Lost'}
                      </Text>
                    </View>
                    <Text style={[
                      gameStyles.betAmount,
                      { color: bet.result === 'won' ? '#22c55e' : '#ef4444' }
                    ]}>
                      {bet.amount}
                    </Text>
                  </View>
                  <Text style={gameStyles.betDescription}>{bet.description}</Text>
                  <Text style={gameStyles.betChoice}>Your pick: {bet.choice}</Text>
                  <View style={gameStyles.betFooter}>
                    <Text style={gameStyles.betTime}>2 min ago</Text>
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
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
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
            colors={timeLeft <= 10 
              ? ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)']
              : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
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
            colors={['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.1)']}
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
              colors={['#1a1a2e', '#16213e', '#0f3460']}
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
                  onPress={() => handleSwipe('left', currentMicroBet?.optionA)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={gameStyles.optionGradient}
                  >
                    <View style={gameStyles.optionContent}>
                      <Ionicons name="chevron-back" size={24} color="#ffffff" />
                      <Text style={gameStyles.optionText}>{currentMicroBet?.optionA}</Text>
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
                  onPress={() => handleSwipe('right', currentMicroBet?.optionB)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#f093fb', '#f5576c']}
                    style={gameStyles.optionGradient}
                  >
                    <View style={gameStyles.optionContent}>
                      <Text style={gameStyles.optionText}>{currentMicroBet?.optionB}</Text>
                      <Ionicons name="chevron-forward" size={24} color="#ffffff" />
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
  const [selectedLeague, setSelectedLeague] = useState(null);

  const handleLeaguePress = (leagueId) => {
    setSelectedLeague(leagueId);
  };

  const handleBackToSelection = () => {
    setSelectedLeague(null);
  };

  if (selectedLeague) {
    return (
      <GameRoomView 
        selectedLeague={selectedLeague} 
        onBack={handleBackToSelection}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
      <StatusBar barStyle="light-content" backgroundColor="#01161E" translucent={false} />
      
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
                    name={league.image}
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

// Ultra Premium Game Room styles
const gameStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  matchContainer: {
    height: 200,
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  matchGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchContent: {
    alignItems: 'center',
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
  scoreCard: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
  },
  scoreGradient: {
    padding: 24,
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
    fontSize: 36,
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
  // Total Raised Bottom Section
  totalRaisedBottom: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tabContent: {
    alignItems: 'center',
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
    padding: 20,
    alignItems: 'center',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  optionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
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