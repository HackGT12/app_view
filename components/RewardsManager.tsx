import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { FirebaseService, Reward, UserData } from '../utils/firebaseService';

const C_BG = '#01161E';
const C_CARD = '#124559';
const C_ACCENT = '#598392';
const C_SUB = '#AEC3B0';
const C_TEXT = '#EFF6E0';

const RewardsManager: React.FC = () => {
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<Reward[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const [userDataResult, availableResult, claimedResult] = await Promise.all([
        FirebaseService.getUserData(user.uid),
        FirebaseService.getAvailableRewards(),
        FirebaseService.getClaimedRewards(user.uid)
      ]);
      
      setUserData(userDataResult);
      setAvailableRewards(availableResult);
      setClaimedRewards(claimedResult);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (reward: Reward) => {
    if (!user || !userData) return;
    
    if (userData.coins < reward.coinCost) {
      Alert.alert('Insufficient Coins', `You need ${reward.coinCost} coins to claim this reward.`);
      return;
    }

    Alert.alert(
      'Claim Reward',
      `Are you sure you want to claim "${reward.title}" for ${reward.coinCost} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Claim', 
          onPress: async () => {
            setClaimingReward(reward.id);
            
            try {
              const success = await FirebaseService.claimReward(user.uid, reward.id, reward.coinCost);
              
              if (success) {
                Alert.alert('Reward Claimed!', `You've successfully claimed ${reward.title}`);
                await fetchData();
              } else {
                Alert.alert('Error', 'Failed to claim reward. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to claim reward. Please try again.');
            } finally {
              setClaimingReward(null);
            }
          }
        }
      ]
    );
  };

  const getAffordabilityPercentage = (coinCost: number) => {
    if (!userData) return 0;
    const percentage = Math.min((userData.coins / coinCost) * 100, 100);
    return Math.round(percentage);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const openRewardModal = (reward: Reward) => {
    setSelectedReward(reward);
    setModalVisible(true);
  };

  if (!user || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={C_ACCENT} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#598392" />
      }
    >
      {/* Available Rewards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Rewards</Text>
        {availableRewards.map((reward) => (
          <View key={reward.id} style={styles.rewardCard}>
            <View style={styles.rewardContent}>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>{reward.title}</Text>
                <Text style={styles.rewardDesc}>{reward.description}</Text>
                <Text style={styles.rewardCategory}>{reward.category}</Text>
                <Text style={styles.affordabilityText}>
                  {getAffordabilityPercentage(reward.coinCost)}% affordable
                </Text>
              </View>
              <View style={styles.rewardActions}>
                <View style={styles.coinBadge}>
                  <Ionicons name="diamond" size={14} color={C_TEXT} />
                  <Text style={styles.coinText}>{reward.coinCost}</Text>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.claimButton,
                    (userData?.coins || 0) < reward.coinCost && styles.claimButtonDisabled
                  ]}
                  onPress={() => handleClaimReward(reward)}
                  disabled={claimingReward === reward.id || (userData?.coins || 0) < reward.coinCost}
                >
                  {claimingReward === reward.id ? (
                    <ActivityIndicator size="small" color={C_TEXT} />
                  ) : (
                    <Text style={[
                      styles.claimButtonText,
                      (userData?.coins || 0) < reward.coinCost && styles.claimButtonTextDisabled
                    ]}>Claim</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Claimed Rewards */}
      {claimedRewards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claimed Rewards</Text>
          {claimedRewards.map((reward) => (
            <TouchableOpacity 
              key={`${reward.id}-${Math.random()}`}
              style={[styles.rewardCard, styles.claimedCard]}
              onPress={() => openRewardModal(reward)}
            >
              <View style={styles.rewardContent}>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  <Text style={styles.rewardDesc}>{reward.description}</Text>
                  <Text style={styles.rewardCategory}>{reward.category}</Text>
                </View>
                <View style={styles.claimedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={C_ACCENT} />
                  <Text style={styles.claimedText}>Claimed</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Reward Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedReward?.title}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={C_TEXT} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>{selectedReward?.description}</Text>
              <Text style={styles.modalCategory}>Category: {selectedReward?.category}</Text>
              <View style={styles.modalCoinInfo}>
                <Ionicons name="diamond" size={16} color={C_ACCENT} />
                <Text style={styles.modalCoinText}>Cost: {selectedReward?.coinCost} coins</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: C_TEXT,
    marginBottom: 12,
  },
  rewardCard: {
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C_ACCENT,
  },
  claimedCard: {
    opacity: 0.8,
    borderColor: C_SUB,
  },
  rewardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
    paddingRight: 12,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C_TEXT,
    marginBottom: 4,
  },
  rewardDesc: {
    fontSize: 12,
    color: C_SUB,
    marginBottom: 4,
  },
  rewardCategory: {
    fontSize: 10,
    color: C_ACCENT,
    fontWeight: '600',
    marginBottom: 4,
  },
  affordabilityText: {
    fontSize: 10,
    color: C_SUB,
    fontStyle: 'italic',
  },
  rewardActions: {
    alignItems: 'center',
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C_BG,
    borderWidth: 1,
    borderColor: C_ACCENT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  coinText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: C_TEXT,
    marginLeft: 4,
  },
  claimButton: {
    backgroundColor: C_ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  claimButtonDisabled: {
    backgroundColor: C_SUB,
    opacity: 0.5,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: C_BG,
  },
  claimButtonTextDisabled: {
    color: C_BG,
  },
  claimedBadge: {
    alignItems: 'center',
  },
  claimedText: {
    fontSize: 10,
    color: C_ACCENT,
    marginTop: 2,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: C_CARD,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: C_ACCENT,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: C_TEXT,
    flex: 1,
  },
  modalBody: {
    flex: 1,
  },
  modalDescription: {
    fontSize: 14,
    color: C_SUB,
    marginBottom: 12,
    lineHeight: 20,
  },
  modalCategory: {
    fontSize: 12,
    color: C_ACCENT,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalCoinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCoinText: {
    fontSize: 14,
    color: C_TEXT,
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default RewardsManager;