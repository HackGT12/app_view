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
  ActivityIndicator,
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

// Game Room View Component
const GameRoomView = ({ selectedLeague, onBack }: { selectedLeague: string; onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState('Live Info');
  const [timeLeft, setTimeLeft] = useState(45);
  const [coins, setCoins] = useState(300);
  const [showMicroBet, setShowMicroBet] = useState(false);
  const [currentMicroBet, setCurrentMicroBet] = useState<{question: string; optionA: string; optionB: string} | null>(null);
  const insets = useSafeAreaInsets();

  // Animation values for popup
  const popupScale = useRef(new Animated.Value(0)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const swipeAnimX = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Entry animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
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
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > 100) {
          const direction = gestureState.dx > 0 ? 'right' : 'left';
          const choice = direction === 'left' ? (currentMicroBet?.optionA || '') : (currentMicroBet?.optionB || '');
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
    stats: {
      shooting: { home: 12, away: 22 },
      attacks: { home: 22, away: 43 },
      possession: { home: 42, away: 58 },
      corners: { home: 32, away: 4 }
    }
  };

  const pastBets = [
    {
      id: 1,
      description: 'Next Goal Scorer',
      choice: 'Messi',
      result: 'won',
      rightPercentage: 15,
      wrongPercentage: 85,
    },
    {
      id: 2,
      description: 'Next Card Color',
      choice: 'Yellow',
      result: 'lost',
      rightPercentage: 78,
      wrongPercentage: 22,
    },
    {
      id: 3,
      description: 'Next Corner',
      choice: 'Brazil',
      result: 'won',
      rightPercentage: 45,
      wrongPercentage: 55,
    }
  ];

  // Timer countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          triggerMicroBet();
          return Math.floor(Math.random() * 60) + 30;
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
        optionB: "Argentina"
      },
      {
        question: "Next card color?",
        optionA: "Yellow",
        optionB: "Red"
      },
      {
        question: "Next corner kick?",
        optionA: "Brazil",
        optionB: "Argentina"
      }
    ];

    const randomBet = microBets[Math.floor(Math.random() * microBets.length)];
    setCurrentMicroBet(randomBet);
    setShowMicroBet(true);

    Animated.parallel([
      Animated.spring(popupScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(popupOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSwipe = (direction: string, choice: string) => {
    Animated.timing(swipeAnimX, {
      toValue: direction === 'left' ? -width : width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowMicroBet(false);
      swipeAnimX.setValue(0);
      popupScale.setValue(0);
      popupOpacity.setValue(0);
      setCoins(prev => prev + Math.floor(Math.random() * 50) + 10);
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Live Info':
        return (
          <View style={gameStyles.statsContainer}>
            {Object.entries(matchData.stats).map(([key, value]) => (
              <View key={key} style={gameStyles.statRow}>
                <Text style={gameStyles.statValue}>{value.home}</Text>
                <Text style={gameStyles.statLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <Text style={gameStyles.statValue}>{value.away}</Text>
              </View>
            ))}
            <TouchableOpacity style={gameStyles.seeAllButton}>
              <Text style={gameStyles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
        );
      case 'Total Raised':
        return (
          <View style={gameStyles.tabContent}>
            <Text style={gameStyles.totalRaisedText}>$125,420</Text>
            <Text style={gameStyles.totalRaisedLabel}>Total Raised This Game</Text>
          </View>
        );
      case 'Live Comments':
        return (
          <ScrollView style={gameStyles.commentsContainer}>
            <View style={gameStyles.comment}>
              <Text style={gameStyles.commentUser}>User123:</Text>
              <Text style={gameStyles.commentText}>Brazil looking strong! 🔥</Text>
            </View>
            <View style={gameStyles.comment}>
              <Text style={gameStyles.commentUser}>BetKing:</Text>
              <Text style={gameStyles.commentText}>Easy money on next goal</Text>
            </View>
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View 
      style={[
        gameStyles.container, 
        { 
          paddingTop: insets.top,
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.1)" translucent />
      
      {/* Header with glassmorphism effect */}
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={gameStyles.header}
      >
        <TouchableOpacity style={gameStyles.backButton} onPress={handleBack}>
          <View style={gameStyles.backButtonContainer}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </View>
        </TouchableOpacity>
        <Text style={gameStyles.headerTitle}>{league?.name} Live</Text>
        <TouchableOpacity style={gameStyles.menuButton}>
          <View style={gameStyles.menuButtonContainer}>
            <Ionicons name="ellipsis-vertical" size={16} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={gameStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Match Display */}
        <View style={gameStyles.matchContainer}>
          <LinearGradient
            colors={league?.gradient as [string, string] || ['#667eea', '#764ba2']}
            style={gameStyles.matchGradient}
          >
            <View style={gameStyles.matchOverlay}>
              <View style={gameStyles.matchContent}>
                <View style={gameStyles.matchIcon}>
                  <Ionicons name={league?.image as any} size={48} color="#ffffff" />
                </View>
                <Text style={gameStyles.liveText}>LIVE NOW</Text>
                <View style={gameStyles.livePulse} />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Elegant Score Card */}
        <View style={gameStyles.scoreCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={gameStyles.scoreGradient}
          >
            <View style={gameStyles.teamScore}>
              <View style={gameStyles.team}>
                <Text style={gameStyles.teamFlag}>{matchData.homeTeam.flag}</Text>
                <Text style={gameStyles.teamName}>BRA</Text>
              </View>
              <View style={gameStyles.scoreDisplay}>
                <Text style={gameStyles.score}>
                  {matchData.homeTeam.score} - {matchData.awayTeam.score}
                </Text>
                <Text style={gameStyles.matchTime}>78'</Text>
              </View>
              <View style={gameStyles.team}>
                <Text style={gameStyles.teamFlag}>{matchData.awayTeam.flag}</Text>
                <Text style={gameStyles.teamName}>ARG</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Modern Tabs */}
        <View style={gameStyles.tabsWrapper}>
          <View style={gameStyles.tabsContainer}>
            {['Live Info', 'Total Raised', 'Live Comments'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[gameStyles.tab, activeTab === tab && gameStyles.activeTab]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[gameStyles.tabText, activeTab === tab && gameStyles.activeTabText]}>
                  {tab}
                </Text>
                {activeTab === tab && <View style={gameStyles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View style={gameStyles.contentContainer}>
          {renderTabContent()}
        </View>

        {/* Modern Past Bets */}
        <View style={gameStyles.pastBetsContainer}>
          <Text style={gameStyles.pastBetsTitle}>Recent Micro Bets</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={gameStyles.betsScroll}>
            {pastBets.map((bet) => (
              <View key={bet.id} style={gameStyles.betCard}>
                <LinearGradient
                  colors={bet.result === 'won' ? ['#4ade80', '#22c55e'] : ['#ef4444', '#dc2626']}
                  style={gameStyles.betCardGradient}
                >
                  <View style={gameStyles.betHeader}>
                    <Ionicons 
                      name={bet.result === 'won' ? 'checkmark-circle' : 'close-circle'} 
                      size={20} 
                      color="#ffffff" 
                    />
                    <Text style={gameStyles.betResult}>
                      {bet.result === 'won' ? 'Won!' : 'Lost'}
                    </Text>
                  </View>
                  <Text style={gameStyles.betDescription}>{bet.description}</Text>
                  <Text style={gameStyles.betChoice}>Your pick: {bet.choice}</Text>
                  <View style={gameStyles.betStats}>
                    <Text style={gameStyles.betPercentage}>
                      {bet.rightPercentage}% correct
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Modern Bottom Panel */}
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.2)']}
        style={gameStyles.bottomContainer}
      >
        <View style={gameStyles.nextBetCard}>
          <View style={gameStyles.timerContainer}>
            <Ionicons name="time-outline" size={18} color="#ffffff" />
            <Text style={gameStyles.nextBetLabel}>Next Bet</Text>
          </View>
          <Text style={gameStyles.nextBetTime}>{formatTime(timeLeft)}</Text>
        </View>
        
        <View style={gameStyles.coinsCard}>
          <View style={gameStyles.coinsHeader}>
            <Ionicons name="trophy" size={18} color="#FFD700" />
            <Text style={gameStyles.coinsLabel}>Coins</Text>
          </View>
          <Text style={gameStyles.coinsAmount}>{coins}</Text>
        </View>
      </LinearGradient>

      {/* Ultra Modern Micro Bet Popup */}
      <Modal visible={showMicroBet} transparent animationType="none">
        <View style={gameStyles.popupOverlay}>
          <Animated.View
            style={[
              gameStyles.popupContainer,
              {
                transform: [
                  { scale: popupScale },
                  { translateX: swipeAnimX }
                ],
                opacity: popupOpacity,
              },
            ]}
            {...panResponder.panHandlers}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
              style={gameStyles.popupGradient}
            >
              <View style={gameStyles.popupHeader}>
                <Text style={gameStyles.popupTitle}>🔥 MICRO BET</Text>
                <View style={gameStyles.popupPulse} />
              </View>
              
              <Text style={gameStyles.popupQuestion}>{currentMicroBet?.question || ''}</Text>
              
              <View style={gameStyles.optionsContainer}>
                <TouchableOpacity
                  style={[gameStyles.optionButton, gameStyles.optionLeft]}
                  onPress={() => handleSwipe('left', currentMicroBet?.optionA || '')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={gameStyles.optionGradient}
                  >
                    <Text style={gameStyles.optionText}>{currentMicroBet?.optionA || ''}</Text>
                    <Text style={gameStyles.swipeHint}>👈 Swipe</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <View style={gameStyles.vsContainer}>
                  <Text style={gameStyles.vsText}>VS</Text>
                </View>
                
                <TouchableOpacity
                  style={[gameStyles.optionButton, gameStyles.optionRight]}
                  onPress={() => handleSwipe('right', currentMicroBet?.optionB || '')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#f093fb', '#f5576c']}
                    style={gameStyles.optionGradient}
                  >
                    <Text style={gameStyles.optionText}>{currentMicroBet?.optionB || ''}</Text>
                    <Text style={gameStyles.swipeHint}>Swipe 👉</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={gameStyles.swipeInstructions}>
                <Ionicons name="swap-horizontal" size={20} color="#ffffff" />
                <Text style={gameStyles.instructionText}>Swipe or tap to place your bet!</Text>
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

  const handleLeaguePress = (leagueId: string) => {
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
      <StatusBar barStyle="light-content" backgroundColor="#01161E" />
      
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
              colors={league.gradient as [string, string]}
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
                  <Text style={styles.gamesText}>{league.activeGames} Active Games</Text>
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

// Original styles (keeping the same for league selection)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#01161E' },
  header: { paddingHorizontal: 30, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: '#EFF6E0', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#AEC3B0', fontWeight: '400' },
  scrollView: { flex: 1 },
  scrollContent: { paddingVertical: 20 },
  leagueCard: {
    width: CARD_WIDTH,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: { flex: 1, padding: 20 },
  cardContent: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  iconContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  leagueName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  gamesBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 15,
  },
  gamesText: { fontSize: 12, fontWeight: '600', color: '#333' },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: '700', color: '#333' },
  bottomSection: { paddingHorizontal: 30, paddingBottom: 30 },
  charityInfo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#124559', paddingVertical: 16, paddingHorizontal: 20,
    borderRadius: 12, borderWidth: 1, borderColor: '#598392',
  },
  charityText: { fontSize: 16, fontWeight: '600', color: '#EFF6E0', marginLeft: 8 },
});

// Ultra Modern Game Room styles
const gameStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    zIndex: 10,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  menuButton: {
    zIndex: 10,
  },
  menuButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  matchContainer: {
    height: 220,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  matchGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
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
  liveText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
    marginTop: 8,
  },
  scoreCard: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
  },
  scoreGradient: {
    padding: 20,
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
    fontSize: 28,
    marginBottom: 4,
  },
  teamName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  scoreDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  score: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  matchTime: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
  },
  tabsWrapper: {
    paddingHorizontal: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 20,
    height: 2,
    backgroundColor: '#4ade80',
    borderRadius: 1,
  },
  contentContainer: {
    margin: 20,
    marginTop: 10,
  },
  statsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    width: 40,
    textAlign: 'center',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
  },
  seeAllButton: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  seeAllText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  totalRaisedText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4ade80',
    marginBottom: 4,
  },
  totalRaisedLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  commentsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    maxHeight: 200,
    padding: 16,
  },
  comment: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  commentUser: {
    color: '#4ade80',
    fontWeight: '700',
    marginRight: 8,
    fontSize: 14,
  },
  commentText: {
    color: '#ffffff',
    flex: 1,
    fontSize: 14,
  },
  pastBetsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pastBetsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  betsScroll: {
    paddingBottom: 8,
  },
  betCard: {
    width: 200,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  betCardGradient: {
    padding: 16,
  },
  betHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  betResult: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  betDescription: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.9,
  },
  betChoice: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 8,
  },
  betStats: {
    alignItems: 'flex-start',
  },
  betPercentage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  nextBetCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextBetLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  nextBetTime: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  coinsCard: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 16,
    padding: 16,
    minWidth: 100,
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
    fontWeight: '600',
    marginLeft: 6,
  },
  coinsAmount: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '800',
  },
  // Ultra Modern Popup Styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  popupContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  popupGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  popupHeader: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  popupTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  popupPulse: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff3b30',
  },
  popupQuestion: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
    lineHeight: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  optionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  optionLeft: {
    marginRight: 6,
  },
  optionRight: {
    marginLeft: 6,
  },
  optionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  swipeHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  vsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  swipeInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});