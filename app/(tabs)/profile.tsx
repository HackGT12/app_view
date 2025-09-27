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

const USER_DATA = {
  username: 'SportsFan2025',
  favoriteTeams: ['Chiefs', 'Lakers', 'Dodgers'],
  favoriteLeagues: ['NFL', 'NBA', 'MLB'],
  lifetimeCharity: 2450,
  dailyStreak: 12,
  totalBets: 156,
  winRate: 61,
  currentCoins: 1247,
  rewardsProgress: 75, // out of 100
  rewardLevel: 2, // Current reward level (0-100, 100-200, 200-300, etc.)
};

const PROMO_CARDS = [
  {
    id: '1',
    coins: 100,
    title: 'Daily Login',
    description: 'Login 7 days straight',
    progress: 85,
    gradient: ['#FF6B6B', '#FF8E8E'],
  },
  {
    id: '2',
    coins: 200,
    title: 'Winning Streak',
    description: 'Win 5 bets in a row',
    progress: 40,
    gradient: ['#4ECDC4', '#44B3A8'],
  },
  {
    id: '3',
    coins: 300,
    title: 'Charity Champion',
    description: 'Help raise $500 for charity',
    progress: 92,
    gradient: ['#45B7D1', '#96CEB4'],
  },
];

const STATS = [
  {
    label: 'Total Bets',
    value: USER_DATA.totalBets.toString(),
    icon: 'bar-chart',
  },
  {
    label: 'Win Rate',
    value: `${USER_DATA.winRate}%`,
    icon: 'trophy',
  },
  {
    label: 'Daily Streak',
    value: `${USER_DATA.dailyStreak} days`,
    icon: 'flame',
  },
  {
    label: 'Charity Raised',
    value: `$${USER_DATA.lifetimeCharity}`,
    icon: 'heart',
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<'stats' | 'rewards'>('stats');

  const renderProgressBar = () => {
    const currentRange = USER_DATA.rewardLevel * 100;
    const nextRange = (USER_DATA.rewardLevel + 1) * 100;
    const progress = (USER_DATA.rewardsProgress / 100) * 100;

    return (
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Rewards Progress</Text>
          <Text style={styles.progressRange}>
            {currentRange} - {nextRange} points
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <LinearGradient
              colors={['#598392', '#EFF6E0']}
              style={[styles.progressBarFill, { width: `${progress}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.progressText}>
            {USER_DATA.rewardsProgress}/100 points
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#01161E" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{USER_DATA.username}</Text>
            <Text style={styles.favoriteTeams}>
              {USER_DATA.favoriteTeams.join(' • ')}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'stats' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('stats')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'stats' && styles.activeTabText,
            ]}
          >
            Stats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'rewards' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('rewards')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'rewards' && styles.activeTabText,
            ]}
          >
            Rewards
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'stats' ? (
          <>
            {/* Fun Stats */}
            <View style={styles.funStatSection}>
              <Text style={styles.sectionTitle}>Your Betting Style</Text>
              <View style={styles.funStatCard}>
                <LinearGradient
                  colors={['#124559', '#598392']}
                  style={styles.funStatGradient}
                >
                  <Text style={styles.funStatText}>
                    You pick OVER {USER_DATA.winRate}% of the time
                  </Text>
                  <Ionicons name="trending-up" size={24} color="#EFF6E0" />
                </LinearGradient>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {STATS.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <LinearGradient
                    colors={['#124559', '#01161E']}
                    style={styles.statGradient}
                  >
                    <Ionicons
                      name={stat.icon as any}
                      size={24}
                      color="#598392"
                    />
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            {/* Favorite Leagues */}
            <View style={styles.leaguesSection}>
              <Text style={styles.sectionTitle}>Favorite Leagues</Text>
              <View style={styles.leaguesList}>
                {USER_DATA.favoriteLeagues.map((league, index) => (
                  <View key={index} style={styles.leagueBadge}>
                    <Text style={styles.leagueText}>{league}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Progress Bar */}
            {renderProgressBar()}

            {/* Promo Cards */}
            <View style={styles.promoSection}>
              <Text style={styles.sectionTitle}>Earn More Coins</Text>
              {PROMO_CARDS.map((promo) => (
                <TouchableOpacity key={promo.id} style={styles.promoCard}>
                  <LinearGradient
                    colors={promo.gradient}
                    style={styles.promoGradient}
                  >
                    <View style={styles.promoHeader}>
                      <View style={styles.promoInfo}>
                        <Text style={styles.promoTitle}>{promo.title}</Text>
                        <Text style={styles.promoDescription}>
                          {promo.description}
                        </Text>
                      </View>
                      <View style={styles.promoCoinBadge}>
                        <Ionicons name="diamond" size={16} color="white" />
                        <Text style={styles.promoCoins}>{promo.coins}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.promoProgressContainer}>
                      <View style={styles.promoProgressBar}>
                        <View
                          style={[
                            styles.promoProgressFill,
                            { width: `${promo.progress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.promoProgressText}>
                        {promo.progress}%
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01161E',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#EFF6E0',
    marginBottom: 4,
  },
  favoriteTeams: {
    fontSize: 16,
    color: '#AEC3B0',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#124559',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#598392',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#AEC3B0',
  },
  activeTabText: {
    color: '#EFF6E0',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EFF6E0',
    marginBottom: 16,
  },
  funStatSection: {
    marginBottom: 24,
  },
  funStatCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  funStatGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  funStatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EFF6E0',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: (width - 50) / 2,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#598392',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#EFF6E0',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#AEC3B0',
    textAlign: 'center',
  },
  leaguesSection: {
    marginBottom: 24,
  },
  leaguesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  leagueBadge: {
    backgroundColor: '#124559',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#598392',
  },
  leagueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EFF6E0',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EFF6E0',
  },
  progressRange: {
    fontSize: 14,
    color: '#AEC3B0',
    fontWeight: '500',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#124559',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#AEC3B0',
    textAlign: 'center',
  },
  promoSection: {
    marginBottom: 24,
  },
  promoCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  promoGradient: {
    padding: 20,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  promoInfo: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  promoDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  promoCoinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  promoCoins: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginLeft: 4,
  },
  promoProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginRight: 12,
  },
  promoProgressFill: {
    height: 6,
    backgroundColor: 'white',
    borderRadius: 3,
  },
  promoProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});
