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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAuth } from 'firebase/auth';
import { FirebaseService, UserData } from '../../utils/firebaseService';

const { width } = Dimensions.get('window');

// Layout
const SCREEN_PAD = 20;
const GUTTER = 12;
const CARD_WIDTH = width * 0.9;
const TILE_WIDTH = (width - SCREEN_PAD * 2 - GUTTER) / 2;

// Palette (dark cohesive)
const C_BG = '#01161E';
const C_CARD = '#0F2830';
const C_BORDER = 'rgba(255,255,255,0.08)';
const C_BORDER_STRONG = 'rgba(255,255,255,0.12)';
const C_SUB = '#AEC3B0';
const C_TEXT = '#EFF6E0';

// Accents
const C_PURPLE = '#6E6ADE';
const C_GREEN = '#34D399';

// Gradients
const G_PROFILE = ['#0A3A33', '#09433A'];
const G1 = ['#667eea', '#764ba2'];

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

type Reward = {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;          // coins
  affordable: boolean;
  claimed?: boolean;
};

const INITIAL_AVAILABLE: Reward[] = [
  { id: 'r1', title: 'Free Taco Bowl', description: 'Get a free taco bowl from the taco store', category: 'Food', cost: 1, affordable: true },
  { id: 'r2', title: '$5 Shopping Coupon', description: 'Use this to buy stuff at the store', category: 'Gift Cards', cost: 20, affordable: true },
];
const INITIAL_CLAIMED: Reward[] = [
  { id: 'r3', title: 'Free Taco Bowl', description: 'Get a free taco bowl from the taco store', category: 'Food', cost: 1, affordable: true, claimed: true },
];

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

  const [available, setAvailable] = useState<Reward[]>(INITIAL_AVAILABLE);
  const [claimed, setClaimed] = useState<Reward[]>(INITIAL_CLAIMED);

  useEffect(() => {
    if (user) fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const data = await FirebaseService.getUserData(user.uid);
      setUserData(data);
    } catch (e) {
      console.error('Error fetching user data:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const displayUserData = userData
    ? { ...DEFAULT_USER_DATA, ...userData, name: userData.name || user?.displayName || DEFAULT_USER_DATA.username }
    : { ...DEFAULT_USER_DATA, name: user?.displayName || DEFAULT_USER_DATA.username, coins: 0 };

  // --- Active Bets (first under Stats) ---
  const renderActiveBets = () => (
    <View style={{ marginBottom: 16 }}>
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
            <View style={styles.betHeader}>
              <Text style={styles.matchup} numberOfLines={1}>{bet.matchup}</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{bet.status}</Text>
              </View>
            </View>

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

            <View style={styles.neonBar} />
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // --- Rewards tab UI (compact, claim near diamonds) ---
  const handleClaim = (r: Reward) => {
    setAvailable((prev) => prev.filter(x => x.id !== r.id));
    setClaimed((prev) => [{ ...r, claimed: true }, ...prev]);
  };

  const RewardCard = ({ r, disabled }: { r: Reward; disabled?: boolean }) => (
    <View style={styles.rewardCard}>
      <View style={styles.rewardRow}>
        {/* LEFT: title + desc + tag */}
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.rewardTitle} numberOfLines={1}>{r.title}</Text>
          <Text style={styles.rewardDesc} numberOfLines={1}>{r.description}</Text>
          <Text style={styles.rewardTag} numberOfLines={1}>{r.category}</Text>
        </View>

        {/* RIGHT: diamonds and claim stacked tightly */}
        <View style={styles.rewardRightCol}>
          <View style={styles.whitePill}>
            <Ionicons name="diamond" size={14} color="#333" />
            <Text style={styles.whitePillText}>{r.cost}</Text>
          </View>

          {disabled ? (
            <View style={styles.claimedPill}>
              <Ionicons name="checkmark-circle" size={14} color="#B7C4BD" />
              <Text style={styles.claimedText}>Claimed</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.claimBtn} onPress={() => handleClaim(r)} activeOpacity={0.9}>
              <Text style={styles.claimBtnText}>Claim</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* purple accent line */}
      <View style={[styles.neonBar, { marginTop: 8 }]} />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C_PURPLE} />
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
      {/* Dark green hero header */}
      <View style={styles.header}>
        <LinearGradient colors={G_PROFILE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="person" size={34} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.username}>{displayUserData.name}</Text>
              <Text style={styles.favoriteTeams}>
                {displayUserData.favoriteTeams?.join(' • ') || 'No favorite teams'}
              </Text>
            </View>
            <View style={styles.whitePill}>
              <Ionicons name="diamond" size={14} color="#333" />
              <Text style={styles.whitePillText}>{(displayUserData as any).coins ?? 0} coins</Text>
            </View>
          </View>

          <View style={styles.heroStatusRow}>
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>PROFILE</Text>
            </View>
            <Text style={styles.heroSubStat}>Lifetime raised: ${displayUserData.lifetimeCharity || 0}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['stats', 'rewards'] as const).map((tab) => {
          const active = selectedTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, active && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.9}
            >
              <Text style={[styles.tabText, active && styles.activeTabText]}>
                {tab === 'stats' ? 'Stats' : 'Rewards'}
              </Text>
              {active ? <LinearGradient colors={G1} style={styles.tabUnderline} /> : <View style={{ height: 3 }} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C_PURPLE} />}
      >
        {selectedTab === 'stats' && (
          <>
            {renderActiveBets()}

            {/* 2×2 grid */}
            <View style={styles.statsGrid}>
              {[
                { key: 'total', label: 'Total Bets', value: `${displayUserData.totalBets ?? 0}`, icon: 'bar-chart' },
                { key: 'win', label: 'Win Rate', value: `${displayUserData.winRate ?? 0}%`, icon: 'trophy' },
                { key: 'streak', label: 'Daily Streak', value: `${displayUserData.dailyStreak ?? 0}d`, icon: 'flame' },
                { key: 'charity', label: 'Charity Raised', value: `$${displayUserData.lifetimeCharity ?? 0}`, icon: 'heart' },
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
          </>
        )}

        {selectedTab === 'rewards' && (
          <>
            <Text style={styles.sectionTitle}>Available Rewards</Text>
            <View style={{ paddingHorizontal: SCREEN_PAD, gap: 10, marginBottom: 16 }}>
              {available.map(r => <RewardCard key={r.id} r={r} />)}
              {available.length === 0 && (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No available rewards right now.</Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>Claimed Rewards</Text>
            <View style={{ paddingHorizontal: SCREEN_PAD, gap: 10, marginBottom: 26 }}>
              {claimed.map(r => <RewardCard key={r.id} r={r} disabled />)}
              {claimed.length === 0 && (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>You haven’t claimed any rewards yet.</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C_BG },

  // Header / Hero
  header: { paddingHorizontal: SCREEN_PAD, marginBottom: 10, marginTop: 6 },
  heroCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  whitePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, gap: 6,
  },
  whitePillText: { color: '#333', fontWeight: '700', fontSize: 12 },
  heroStatusRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C_GREEN, marginRight: 8 },
  liveText: { fontSize: 11, fontWeight: '800', color: '#333' },
  heroSubStat: { color: '#E9F7F2', opacity: 0.9, fontWeight: '700', fontSize: 12 },

  username: { fontSize: 22, fontWeight: '800', color: C_TEXT, marginBottom: 2 },
  favoriteTeams: { fontSize: 13, color: '#E7F1EA', opacity: 0.9 },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SCREEN_PAD,
    marginTop: 2,
    marginBottom: 12,
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C_BORDER_STRONG },
  tabText: { fontSize: 15, fontWeight: '700', color: C_SUB },
  activeTabText: { color: '#FFFFFF' },
  tabUnderline: { height: 3, width: '70%', borderRadius: 2, marginTop: 6 },

  content: { flex: 1 },
  scrollContent: { paddingBottom: 28 },

  // Headings
  sectionTitle: { fontSize: 20, fontWeight: '800', color: C_TEXT, marginBottom: 10, paddingHorizontal: SCREEN_PAD },
  subSectionTitle: { fontSize: 16, fontWeight: '800', color: C_TEXT, marginLeft: SCREEN_PAD, marginBottom: 10, opacity: 0.9 },

  // Ticket card (Betting Style)
  ticketCard: {
    marginHorizontal: SCREEN_PAD, marginBottom: 16, borderRadius: 16,
    backgroundColor: C_CARD, borderWidth: 1, borderColor: C_BORDER, padding: 16,
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  ticketHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketTitle: { fontSize: 14, fontWeight: '800', color: C_SUB },
  ticketPrimaryText: { fontSize: 16, fontWeight: '800', color: C_TEXT, marginTop: 8 },

  // 2×2 Stats
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SCREEN_PAD,
    justifyContent: 'space-between', marginTop: 0, marginBottom: 12,
  },
  statTile: {
    width: TILE_WIDTH, borderRadius: 16, backgroundColor: C_CARD,
    borderWidth: 1, borderColor: C_BORDER, padding: 14, marginBottom: GUTTER,
    shadowColor: 'rgba(110,106,222,0.25)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 5,
  },
  statTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statValue: { fontSize: 20, fontWeight: '900', color: C_TEXT },
  statLabel: { fontSize: 12, color: C_SUB, marginTop: 6 },

  // Active bets (carousel)
  activeScrollView: { flexGrow: 0 },
  activeScrollContent: { paddingVertical: 8 },
  betCard: {
    width: CARD_WIDTH, borderRadius: 16, backgroundColor: C_CARD,
    borderWidth: 1, borderColor: C_BORDER, padding: 14,
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    overflow: 'hidden',
  },
  betHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  matchup: { fontSize: 12, fontWeight: '800', color: C_SUB },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: C_BORDER_STRONG },
  statusText: { fontSize: 10, fontWeight: '800', color: '#D9E3DE', letterSpacing: 0.3 },
  betMain: { flexDirection: 'row', alignItems: 'center' },
  player: { fontSize: 16, fontWeight: '900', color: C_TEXT },
  meta: { fontSize: 12, color: C_SUB, marginTop: 2 },
  targetPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A1A1F', borderWidth: 1, borderColor: C_BORDER, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  targetText: { fontSize: 12, fontWeight: '800', color: C_TEXT, marginLeft: 6 },

  // Rewards (slimmer + claim near diamonds)
  rewardCard: {
    borderRadius: 16,
    backgroundColor: C_CARD,
    borderWidth: 1,
    borderColor: C_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 84,                // slimmer
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 7,
  },
  rewardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  rewardRightCol: { alignItems: 'flex-end', marginLeft: 8 },
  rewardTitle: { fontSize: 18, fontWeight: '900', color: C_TEXT },
  rewardDesc: { fontSize: 12, color: C_SUB, marginTop: 2 },
  rewardTag: { fontSize: 11, color: C_SUB, opacity: 0.85, marginTop: 4 },

  claimBtn: {
    marginTop: 6,                   // snug under diamonds
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: C_BORDER_STRONG,
  },
  claimBtnText: { color: C_TEXT, fontWeight: '800' },

  claimedPill: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: C_BORDER_STRONG,
  },
  claimedText: { color: '#B7C4BD', fontWeight: '800' },

  emptyCard: {
    borderRadius: 14, backgroundColor: C_CARD, borderWidth: 1, borderColor: C_BORDER,
    padding: 14, alignItems: 'center',
  },
  emptyText: { color: C_SUB, fontWeight: '600' },

  // Shared small pieces
  whitePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, gap: 6,
  },
  whitePillText: { color: '#333', fontWeight: '700', fontSize: 12 },

  neonBar: { height: 3, backgroundColor: C_PURPLE, borderRadius: 2, opacity: 0.95 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 16, color: C_SUB, marginTop: 12 },
});
