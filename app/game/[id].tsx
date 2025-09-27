import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

interface BetOption {
  id: string;
  question: string;
  option1: string;
  option2: string;
  odds1: string;
  odds2: string;
}

interface PastBet {
  id: string;
  question: string;
  result: string;
  amount: number;
}

const MOCK_GAME = {
  id: '1',
  homeTeam: 'Chiefs',
  awayTeam: 'Bills',
  homeScore: 21,
  awayScore: 17,
  status: 'LIVE',
  quarter: '3rd',
  timeRemaining: '8:34',
  charityPot: 12450,
};

const CURRENT_BET: BetOption = {
  id: '1',
  question: 'Will the next play be a PASS?',
  option1: 'YES',
  option2: 'NO',
  odds1: '+120',
  odds2: '-110',
};

const PAST_BETS: PastBet[] = [
  {
    id: '1',
    question: 'Will Chiefs score next?',
    result: 'WON',
    amount: 50,
  },
  {
    id: '2',
    question: 'Over/Under 2.5 yards',
    result: 'LOST',
    amount: 30,
  },
  {
    id: '3',
    question: 'Next play: RUN or PASS?',
    result: 'WON',
    amount: 75,
  },
];

export default function LiveGameScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [countdown, setCountdown] = useState(15);
  const [showBetCard, setShowBetCard] = useState(false);
  const [charityPot, setCharityPot] = useState(MOCK_GAME.charityPot);
  
  const translateX = new Animated.Value(0);
  const cardScale = new Animated.Value(0);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setShowBetCard(true);
          animateBetCardIn();
          return 30; // Reset to 30 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate charity pot increasing
    const potTimer = setInterval(() => {
      setCharityPot((prev) => prev + Math.floor(Math.random() * 50) + 10);
    }, 3000);

    return () => clearInterval(potTimer);
  }, []);

  const animateBetCardIn = () => {
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateBetCardOut = (direction: 'left' | 'right') => {
    const toValue = direction === 'left' ? -width : width;
    
    Animated.parallel([
      Animated.timing(translateX, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset values
      translateX.setValue(0);
      cardScale.setValue(0);
      opacity.setValue(0);
      setShowBetCard(false);
    });
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (Math.abs(translationX) > width * 0.3) {
        const direction = translationX > 0 ? 'right' : 'left';
        const choice = direction === 'right' ? CURRENT_BET.option1 : CURRENT_BET.option2;
        
        // Show confirmation toast
        console.log(`Bet placed: ${choice}`);
        animateBetCardOut(direction);
      } else {
        // Snap back
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
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
        <Text style={styles.headerTitle}>Live Game</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Scoreboard */}
        <LinearGradient
          colors={['#124559', '#01161E']}
          style={styles.scoreboard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.gameStatus}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.timeText}>
              {MOCK_GAME.quarter} • {MOCK_GAME.timeRemaining}
            </Text>
          </View>

          <View style={styles.scoreContainer}>
            <View style={styles.teamSection}>
              <Text style={styles.teamName}>{MOCK_GAME.awayTeam}</Text>
              <Text style={styles.teamScore}>{MOCK_GAME.awayScore}</Text>
            </View>
            <Text style={styles.vs}>@</Text>
            <View style={styles.teamSection}>
              <Text style={styles.teamName}>{MOCK_GAME.homeTeam}</Text>
              <Text style={styles.teamScore}>{MOCK_GAME.homeScore}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Charity Pot */}
        <View style={styles.charityContainer}>
          <Ionicons name="heart" size={24} color="#FF6B6B" />
          <Text style={styles.charityAmount}>
            ${charityPot.toLocaleString()}
          </Text>
          <Text style={styles.charityLabel}>raised for charity</Text>
        </View>

        {/* Past Bets */}
        <View style={styles.pastBetsSection}>
          <Text style={styles.sectionTitle}>Recent Bets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pastBetsScroll}
          >
            {PAST_BETS.map((bet) => (
              <View key={bet.id} style={styles.pastBetCard}>
                <Text style={styles.pastBetQuestion}>{bet.question}</Text>
                <View style={styles.pastBetResult}>
                  <Text
                    style={[
                      styles.pastBetStatus,
                      {
                        color: bet.result === 'WON' ? '#30D158' : '#FF3B30',
                      },
                    ]}
                  >
                    {bet.result}
                  </Text>
                  <Text style={styles.pastBetAmount}>+{bet.amount} coins</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Countdown Timer */}
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownLabel}>Next bet in</Text>
        <View style={styles.countdownCircle}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      </View>

      {/* Bet Card Overlay */}
      {showBetCard && (
        <View style={styles.betOverlay}>
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <Animated.View
              style={[
                styles.betCard,
                {
                  transform: [
                    { translateX },
                    { scale: cardScale },
                  ],
                  opacity,
                },
              ]}
            >
              <LinearGradient
                colors={['#598392', '#124559']}
                style={styles.betCardGradient}
              >
                <Text style={styles.betQuestion}>{CURRENT_BET.question}</Text>
                
                <View style={styles.betOptions}>
                  <View style={styles.betOption}>
                    <Text style={styles.optionText}>{CURRENT_BET.option2}</Text>
                    <Text style={styles.oddsText}>{CURRENT_BET.odds2}</Text>
                  </View>
                  <View style={styles.betDivider} />
                  <View style={styles.betOption}>
                    <Text style={styles.optionText}>{CURRENT_BET.option1}</Text>
                    <Text style={styles.oddsText}>{CURRENT_BET.odds1}</Text>
                  </View>
                </View>
                
                <View style={styles.swipeInstructions}>
                  <View style={styles.swipeDirection}>
                    <Ionicons name="chevron-back" size={20} color="#FF3B30" />
                    <Text style={styles.swipeText}>Swipe left for NO</Text>
                  </View>
                  <View style={styles.swipeDirection}>
                    <Text style={styles.swipeText}>Swipe right for YES</Text>
                    <Ionicons name="chevron-forward" size={20} color="#30D158" />
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </PanGestureHandler>
        </View>
      )}
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
  headerTitle: {
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
    paddingBottom: 120,
  },
  scoreboard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#598392',
  },
  gameStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 4,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  timeText: {
    fontSize: 14,
    color: '#AEC3B0',
    fontWeight: '500',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EFF6E0',
    marginBottom: 8,
  },
  teamScore: {
    fontSize: 48,
    fontWeight: '800',
    color: '#EFF6E0',
  },
  vs: {
    fontSize: 18,
    color: '#AEC3B0',
    fontWeight: '600',
    marginHorizontal: 20,
  },
  charityContainer: {
    alignItems: 'center',
    backgroundColor: '#124559',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#598392',
  },
  charityAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EFF6E0',
    marginVertical: 4,
  },
  charityLabel: {
    fontSize: 14,
    color: '#AEC3B0',
  },
  pastBetsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EFF6E0',
    marginBottom: 16,
  },
  pastBetsScroll: {
    paddingRight: 20,
  },
  pastBetCard: {
    backgroundColor: '#124559',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: '#598392',
  },
  pastBetQuestion: {
    fontSize: 14,
    color: '#EFF6E0',
    marginBottom: 8,
    fontWeight: '500',
  },
  pastBetResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pastBetStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  pastBetAmount: {
    fontSize: 12,
    color: '#AEC3B0',
  },
  countdownContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: 14,
    color: '#AEC3B0',
    marginBottom: 8,
  },
  countdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#124559',
    borderWidth: 3,
    borderColor: '#598392',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#EFF6E0',
  },
  betOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  betCard: {
    width: width * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  betCardGradient: {
    padding: 24,
  },
  betQuestion: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EFF6E0',
    textAlign: 'center',
    marginBottom: 24,
  },
  betOptions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  betOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  betDivider: {
    width: 1,
    backgroundColor: '#AEC3B0',
    opacity: 0.3,
  },
  optionText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#EFF6E0',
    marginBottom: 4,
  },
  oddsText: {
    fontSize: 16,
    color: '#AEC3B0',
    fontWeight: '600',
  },
  swipeInstructions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#AEC3B0',
    borderTopOpacity: 0.3,
  },
  swipeDirection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeText: {
    fontSize: 12,
    color: '#AEC3B0',
    marginHorizontal: 4,
  },
});
