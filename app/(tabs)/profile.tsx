import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const USER_DATA = {
  username: 'SportsFan2025',
  favoriteTeams: ['Chiefs', 'Lakers', 'Dodgers'],
  favoriteLeagues: ['NFL', 'NBA', 'MLB'],
  lifetimeCharity: 2450,
  dailyStreak: 12,
  totalBets: 156,
  winRate: 61,
  currentCoins: 1247,
  rewardsProgress: 75, // 0-100
  rewardLevel: 2,
};

const PROMO_CARDS = [
  { id: '1', coins: 100, title: 'Daily Login', description: 'Login 7 days straight', progress: 85 },
  { id: '2', coins: 200, title: 'Winning Streak', description: 'Win 5 bets in a row', progress: 40 },
  { id: '3', coins: 300, title: 'Charity Champion', description: 'Help raise $500 for charity', progress: 92 },
];

const STATS = [
  { key: 'total', label: 'Total Bets', value: USER_DATA.totalBets.toString(), icon: 'bar-chart' },
  { key: 'win', label: 'Win Rate', value: `${USER_DATA.winRate}%`, icon: 'trophy' },
  { key: 'streak', label: 'Daily Streak', value: `${USER_DATA.dailyStreak}d`, icon: 'flame' },
  { key: 'charity', label: 'Charity Raised', value: `$${USER_DATA.lifetimeCharity}`, icon: 'heart' },
];

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
  const [selectedTab, setSelectedTab] = useState<'stats' | 'rewards'>('stats');

  const renderProgressBar = () => {
    const currentRange = USER_DATA.rewardLevel * 100;
    const nextRange = (USER_DATA.rewardLevel + 1) * 100;
    const progress = USER_DATA.rewardsProgress;

    return (
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Rewards Progress</Text>
          <Text style={styles.progressRange}>{currentRange} - {nextRange} points</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <LinearGradient
              colors={[C_ACCENT, C_TEXT]}
              style={[styles.progressBarFill, { width: `${progress}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.progressText}>{USER_DATA.rewardsProgress}/100 points</Text>
        </View>
      </View>
    );
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

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={C_BG} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{USER_DATA.username}</Text>
            <Text style={styles.favoriteTeams}>{USER_DATA.favoriteTeams.join(' • ')}</Text>
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

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {selectedTab === 'stats' && (
          <>
            {/* Betting Style */}
            <View style={styles.ticketCard}>
              <View style={styles.ticketHeaderRow}>
                <Text style={styles.ticketTitle}>Your Betting Style</Text>
                <Ionicons name="trending-up" size={18} color={C_SUB} />
              </View>
              <Text style={styles.ticketPrimaryText}>
                You pick <Text style={{ fontWeight: '900' }}>OVER {USER_DATA.winRate}%</Text> of the time
              </Text>
              <View style={[styles.neonBar, { width: '72%', marginTop: 12 }]} />
            </View>

            {/* Active Bets (stretched, swipeable) */}
            {renderActiveBets()}

            {/* Stats block — 2x2 */}
            <View style={styles.statsGrid}>
              {STATS.map((stat) => (
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

            {/* Favorite Leagues */}
            <View style={{ marginTop: 8, marginBottom: 24 }}>
              <Text style={styles.sectionTitle}>Favorite Leagues</Text>
              <View style={styles.leaguesList}>
                {USER_DATA.favoriteLeagues.map((league, index) => (
                  <View key={index} style={styles.leagueChip}>
                    <Text style={styles.leagueChipText}>{league}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {selectedTab === 'rewards' && (
          <>
            {/* Progress (already palette-matched) */}
            {renderProgressBar()}

            {/* Rewards Promos — now same look as stats cards */}
            <View style={styles.promoSection}>
              <Text style={styles.sectionTitle}>Earn More Coins</Text>
              {PROMO_CARDS.map((promo) => (
                <View key={promo.id} style={styles.promoTicket}>
                  <View style={styles.promoTopRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.promoTitleText}>{promo.title}</Text>
                      <Text style={styles.promoDescText}>{promo.description}</Text>
                    </View>
                    <View style={styles.promoCoinBadge}>
                      <Ionicons name="diamond" size={16} color={C_TEXT} />
                      <Text style={styles.promoCoins}>{promo.coins}</Text>
                    </View>
                  </View>

                  <View style={styles.promoBarBg}>
                    <View style={[styles.promoBarFill, { width: `${promo.progress}%` }]} />
                  </View>
                  <Text style={styles.promoProgressLabel}>{promo.progress}%</Text>
                </View>
              ))}
            </View>
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
  favoriteTeams: { fontSize: 16, color: C_SUB, fontWeight: '500' },

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

  // Favorite leagues
  leaguesList: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SCREEN_PAD },
  leagueChip: {
    backgroundColor: C_BG,
    borderWidth: 1,
    borderColor: C_ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  leagueChipText: { fontSize: 12, fontWeight: '800', color: C_TEXT },

  // Rewards progress
  progressSection: { marginBottom: 24 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: SCREEN_PAD },
  progressTitle: { fontSize: 20, fontWeight: '700', color: C_TEXT },
  progressRange: { fontSize: 14, color: C_SUB, fontWeight: '500' },
  progressBarContainer: { marginBottom: 8, paddingHorizontal: SCREEN_PAD },
  progressBarBackground: { height: 8, backgroundColor: C_CARD, borderRadius: 4, marginBottom: 8, borderWidth: 1, borderColor: C_ACCENT },
  progressBarFill: { height: 8, borderRadius: 4 },
  progressText: { fontSize: 14, color: C_SUB, textAlign: 'center' },

  // Rewards promos — STAT-STYLE cards
  promoSection: { marginBottom: 24 },
  promoTicket: {
    marginHorizontal: SCREEN_PAD,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: C_CARD,
    borderWidth: 1,
    borderColor: C_ACCENT,
    padding: 16,
  },
  promoTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  promoTitleText: { fontSize: 16, fontWeight: '900', color: C_TEXT },
  promoDescText: { fontSize: 12, color: C_SUB, marginTop: 4 },

  promoCoinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C_BG,
    borderWidth: 1,
    borderColor: C_ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  promoCoins: { fontSize: 14, fontWeight: '800', color: C_TEXT, marginLeft: 6 },

  promoBarBg: {
    height: 6,
    backgroundColor: C_BG,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: C_ACCENT,
    marginTop: 12,
    overflow: 'hidden',
  },
  promoBarFill: { height: 6, backgroundColor: C_ACCENT },
  promoProgressLabel: { fontSize: 12, fontWeight: '700', color: C_SUB, marginTop: 6, textAlign: 'right' },

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
});
