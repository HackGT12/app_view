import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAuth } from 'firebase/auth';
import { FirebaseService, UserData } from '../../utils/firebaseService';
import RewardsManager from '../../components/RewardsManager';

const { width } = Dimensions.get('window');

// Layout constants
const SCREEN_PAD = 20;
const GUTTER = 12;
const CARD_WIDTH = width * 0.9; // stretched swipe cards
const TILE_WIDTH = (width - SCREEN_PAD * 2 - GUTTER) / 2; // 2-up grid with gutter

// Brand palette
const C_BG = '#01161E';
const C_CARD = '#124559';
const C_ACCENT = '#598392';
const C_SUB = '#AEC3B0';
const C_TEXT = '#EFF6E0';

const DEFAULT_USER_DATA = {
  username: 'SportsFan2025',
  favoriteTeams: ['Chiefs', 'Lakers', 'Dodgers'],
  favoriteLeagues: ['NFL', 'NBA', 'MLB'],
  lifetimeCharity: 2450,
  dailyStreak: 12,
  totalBets: 156,
  winRate: 61,
  currentCoins: 0,
  rewardsProgress: 75,
  rewardLevel: 2,
};

/** Swipeable Active Bets (inside Stats) */
const ACTIVE_BETS = [
  { id: 'b1', league: 'MLB', matchup: 'LAD 9 vs NYY 4', name: 'Shohei Ohtani',  meta: 'Hits',        target: '1.5',  status: 'Final' },
  { id: 'b2', league: 'MLB', matchup: 'LAD 9 vs NYY 4', name: 'Aaron Judge',     meta: 'Home Runs',  target: '0.5',  status: 'Final' },
  { id: 'b3', league: 'NFL', matchup: 'KC 22 vs PHI 40', name: 'Patrick Mahomes',meta: 'Pass Yards', target: '148.5',status: 'Final' },
  { id: 'b4', league: 'NFL', matchup: 'KC 22 vs PHI 40', name: 'Jalen Hurts',    meta: 'Pass Yards', target: '178.5',status: 'Final' },
  { id: 'b5', league: 'WNBA',matchup: 'IND 92 vs DAL 88',name: 'Caitlin Clark',  meta: 'Points',     target: '21.5', status: 'Final' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const auth = getAuth();
  const user = auth.currentUser;
  
  const [selectedTab, setSelectedTab] = useState<'stats' | 'rewards'>('stats');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      const data = await FirebaseService.getUserData(user.uid);
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const displayUserData = userData ? {
    ...DEFAULT_USER_DATA,
    ...userData,
    name: userData.name || user?.displayName || DEFAULT_USER_DATA.username
  } : {
    ...DEFAULT_USER_DATA,
    name: user?.displayName || DEFAULT_USER_DATA.username,
    coins: 0
  };

  /** Active Bets carousel – inside Stats page */
  const renderActiveBets = () => (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.subSectionTitle}>Active Bets</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.activeScrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + GUTTER * 2}
        snapToAlignment="center"
        style={styles.activeScrollView}
      >
        {ACTIVE_BETS.map((bet, index) => (
          <View
            key={bet.id}
            style={[
              styles.betCard,
              {
                marginLeft: index === 0 ? SCREEN_PAD : GUTTER,
                marginRight: index === ACTIVE_BETS.length - 1 ? SCREEN_PAD : GUTTER,
              },
            ]}
          >
            {/* Matchup + status */}
            <View style={styles.betHeader}>
              <Text style={styles.matchup} numberOfLines={1}>{bet.matchup}</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{bet.status}</Text>
              </View>
            </View>

            {/* Player + meta + target */}
            <View style={styles.betMain}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.player} numberOfLines={1}>{bet.name}</Text>
                <Text style={styles.meta}>{bet.meta}</Text>
              </View>

              <View style={styles.targetPill}>
                <Ionicons name="ellipse-outline" size={12} color={C_SUB} />
                <Text style={styles.targetText}>{bet.target}</Text>
              </View>
            </View>

            {/* Accent bar */}
            <View style={styles.neonBar} />
          </View>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C_ACCENT} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Please log in to view your profile</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={C_BG} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{displayUserData.name}</Text>
            <Text style={styles.favoriteTeams}>{displayUserData.favoriteTeams?.join(' • ') || 'No favorite teams'}</Text>
            <View style={styles.coinsContainer}>
              <Ionicons name="diamond" size={16} color={C_ACCENT} />
              <Text style={styles.coinsText}>{displayUserData.coins} coins</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs: Stats | Rewards */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'stats' && styles.activeTab]}
          onPress={() => setSelectedTab('stats')}
        >
          <Text style={[styles.tabText, selectedTab === 'stats' && styles.activeTabText]}>Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'rewards' && styles.activeTab]}
          onPress={() => setSelectedTab('rewards')}
        >
          <Text style={[styles.tabText, selectedTab === 'rewards' && styles.activeTabText]}>Rewards</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#598392" />
        }
      >
        {selectedTab === 'stats' && (
          <>
            {/* Betting Style */}
            <View style={styles.ticketCard}>
              <View style={styles.ticketHeaderRow}>
                <Text style={styles.ticketTitle}>Your Betting Style</Text>
                <Ionicons name="trending-up" size={18} color={C_SUB} />
              </View>
              <Text style={styles.ticketPrimaryText}>
                You pick <Text style={{ fontWeight: '900' }}>OVER {displayUserData.winRate}%</Text> of the time
              </Text>
              <View style={[styles.neonBar, { width: '72%', marginTop: 12 }]} />
            </View>

            {/* Active Bets (stretched, swipeable) */}
            {renderActiveBets()}

            {/* Stats block — 2x2 */}
            <View style={styles.statsGrid}>
              {[
                { key: 'total', label: 'Total Bets', value: displayUserData.totalBets?.toString() || '0', icon: 'bar-chart' },
                { key: 'win', label: 'Win Rate', value: `${displayUserData.winRate || 0}%`, icon: 'trophy' },
                { key: 'streak', label: 'Daily Streak', value: `${displayUserData.dailyStreak || 0}d`, icon: 'flame' },
                { key: 'charity', label: 'Charity Raised', value: `$${displayUserData.lifetimeCharity || 0}`, icon: 'heart' },
              ].map((stat) => (
                <View key={stat.key} style={styles.statTile}>
                  <View style={styles.statTopRow}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Ionicons name={stat.icon as any} size={18} color={C_SUB} />
                  </View>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <View style={[styles.neonBar, { width: '60%', marginTop: 10 }]} />
                </View>
              ))}
            </View>
          </>
        )}

        {selectedTab === 'rewards' && (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={C_ACCENT} />
                <Text style={styles.loadingText}>Loading rewards...</Text>
              </View>
            ) : (
              <>
                {/* Rewards Manager only (progress bar removed) */}
                <RewardsManager />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C_BG },
  header: { paddingHorizontal: SCREEN_PAD, marginBottom: 20 },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C_TEXT,
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  profileInfo: { flex: 1 },
  username: { fontSize: 24, fontWeight: '800', color: C_TEXT, marginBottom: 4 },
  favoriteTeams: { fontSize: 16, color: C_SUB, fontWeight: '500', marginBottom: 4 },
  coinsContainer: { flexDirection: 'row', alignItems: 'center' },
  coinsText: { fontSize: 14, fontWeight: '700', color: C_ACCENT, marginLeft: 4 },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SCREEN_PAD,
    marginBottom: 16,
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: C_ACCENT,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: C_ACCENT },
  tabText: { fontSize: 16, fontWeight: '600', color: C_SUB },
  activeTabText: { color: C_BG },

  content: { flex: 1 },
  scrollContent: { paddingBottom: 28 },

  sectionTitle: { fontSize: 20, fontWeight: '700', color: C_TEXT, marginBottom: 12, paddingHorizontal: SCREEN_PAD },
  subSectionTitle: { fontSize: 16, fontWeight: '800', color: C_TEXT, marginLeft: SCREEN_PAD, marginBottom: 10, opacity: 0.9 },

  // Betting Style (ticket)
  ticketCard: {
    marginHorizontal: SCREEN_PAD,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: C_CARD,
    borderWidth: 1,
    borderColor: C_ACCENT,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ticketHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketTitle: { fontSize: 14, fontWeight: '800', color: C_SUB },
  ticketPrimaryText: { fontSize: 16, fontWeight: '800', color: C_TEXT, marginTop: 8 },

  // Stats block (2x2)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SCREEN_PAD,
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 18,
  },
  statTile: {
    width: TILE_WIDTH,
    borderRadius: 16,
    backgroundColor: C_CARD,
    borderWidth: 1,
    borderColor: C_ACCENT,
    padding: 14,
    marginBottom: GUTTER,
  },
  statTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statValue: { fontSize: 20, fontWeight: '900', color: C_TEXT },
  statLabel: { fontSize: 12, color: C_SUB, marginTop: 4 },

  // Active Bets ticket styles (stretched)
  activeScrollView: { flexGrow: 0 },
  activeScrollContent: { paddingVertical: 8 },

  betCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: C_CARD,
    borderWidth: 1,
    borderColor: C_ACCENT,
    padding: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  betHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  matchup: { fontSize: 12, fontWeight: '800', color: C_SUB },
  statusPill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    backgroundColor: 'rgba(174,195,176,0.15)', borderWidth: 1, borderColor: C_SUB,
  },
  statusText: { fontSize: 10, fontWeight: '800', color: C_TEXT },
  betMain: { flexDirection: 'row', alignItems: 'center' },
  player: { fontSize: 16, fontWeight: '900', color: C_TEXT },
  meta: { fontSize: 12, color: C_SUB, marginTop: 2 },

  targetPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C_BG, borderWidth: 1, borderColor: C_ACCENT,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  targetText: { fontSize: 12, fontWeight: '800', color: C_TEXT, marginLeft: 6 },

  // Accent bar
  neonBar: { height: 3, backgroundColor: C_ACCENT, borderRadius: 2, opacity: 0.95 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 16, color: C_SUB, marginTop: 12 },
});
