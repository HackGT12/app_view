import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  arrayUnion,
  increment,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface ActiveBet {
  betId: string;
  optionId: string;
  placedAt: any;
  question: string;
  status: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  coins: number;
  claimedRewards: string[];
  activeBets?: ActiveBet[];
  favoriteTeams?: string[];
  favoriteLeagues?: string[];
  lifetimeCharity?: number;
  dailyStreak?: number;
  totalBets?: number;
  winRate?: number;
  rewardsProgress?: number;
  rewardLevel?: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  coinCost: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
}

export class FirebaseService {
  private static sponsors = ["Nike", "Adidas", "New Balance"];
  private static sponsorIndex = 0;

  private static getNextSponsor(): string {
    const sponsor = this.sponsors[this.sponsorIndex];
    this.sponsorIndex = (this.sponsorIndex + 1) % this.sponsors.length; // cycle
    return sponsor;
  }

  static async getUserData(userId: string): Promise<UserData | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = { id: userId, ...userSnap.data() } as UserData;
        // Calculate stats from user's active bets
        if (userData.activeBets) {
          const stats = await this.calculateUserStats(userData.activeBets);
          userData.winRate = stats.winRate;
          userData.lifetimeCharity = stats.charityRaised;
          userData.dailyStreak = stats.dailyStreak;
          userData.totalBets = userData.activeBets.length;
        }
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  // Update user coins
  static async updateUserCoins(userId: string, coinChange: number): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        coins: increment(coinChange)
      });
      return true;
    } catch (error) {
      console.error('Error updating user coins:', error);
      return false;
    }
  }

  static async recordMicroBetVote(betId: string, userId: string, optionId: string) {
    try {
      await updateDoc(doc(db, 'microBets', betId), {
        [`options.${optionId}.votes`]: increment(1),
        [`voters.${userId}`]: optionId
      });
      return true;
    } catch (error) {
      console.error('Error recording micro bet vote:', error);
      return false;
    }
  }

  // Get all available rewards
  static async getAvailableRewards(): Promise<Reward[]> {
    try {
      const rewardsRef = collection(db, 'rewards');
      const querySnapshot = await getDocs(rewardsRef);
      
      const rewards: Reward[] = [];
      querySnapshot.forEach((doc) => {
        rewards.push({ id: doc.id, ...doc.data() } as Reward);
      });
      
      return rewards;
    } catch (error) {
      console.error('Error fetching rewards:', error);
      return [];
    }
  }

  // Claim a reward
  static async claimReward(userId: string, rewardId: string, coinCost: number): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Check if user has enough coins
      const userData = await this.getUserData(userId);
      if (!userData || userData.coins < coinCost) {
        throw new Error('Insufficient coins');
      }

      // Update user data: deduct coins and add to claimed rewards
      await updateDoc(userRef, {
        coins: increment(-coinCost),
        claimedRewards: arrayUnion(rewardId)
      });

      return true;
    } catch (error) {
      console.error('Error claiming reward:', error);
      return false;
    }
  }

  // Get claimed rewards details
  static async getClaimedRewards(userId: string): Promise<Reward[]> {
    try {
      const userData = await this.getUserData(userId);
      if (!userData || !userData.claimedRewards?.length) {
        return [];
      }

      const rewardsRef = collection(db, 'rewards');
      const querySnapshot = await getDocs(rewardsRef);
      
      const allRewards: Reward[] = [];
      querySnapshot.forEach((doc) => {
        allRewards.push({ id: doc.id, ...doc.data() } as Reward);
      });
      
      return allRewards.filter(reward => userData.claimedRewards.includes(reward.id));
    } catch (error) {
      console.error('Error fetching claimed rewards:', error);
      return [];
    }
  }

  // Calculate stats from active bets
  static async calculateUserStats(activeBets: ActiveBet[]): Promise<{winRate: number, charityRaised: number, dailyStreak: number}> {
    try {
      if (!activeBets?.length) {
        return { winRate: 0, charityRaised: 0, dailyStreak: 0 };
      }

      let wins = 0;
      let totalBets = 0;
      let charityTotal = 0;
      const betDates: Date[] = [];

      for (const bet of activeBets) {
        const betRef = doc(db, 'microBets', bet.betId);
        const betSnap = await getDoc(betRef);
        
        if (betSnap.exists()) {
          const betData = betSnap.data();
          if (betData.answer && betData.answer !== 'opt3') {
            totalBets++;
            betDates.push(bet.placedAt.toDate());
            
            if (bet.optionId === betData.answer) {
              wins++;
              // Skip charity calculation for now to avoid errors
              charityTotal += betData.donation || 0;
            }
          }
        }
      }

      // Calculate daily streak
      const dailyStreak = this.calculateDailyStreak(betDates);
      const winRate = totalBets > 0 ? Math.round((wins / totalBets) * 100) : 0;

      return { winRate, charityRaised: Math.round(charityTotal), dailyStreak };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return { winRate: 0, charityRaised: 0, dailyStreak: 0 };
    }
  }

  // Calculate daily streak from bet dates
  static calculateDailyStreak(betDates: Date[]): number {
    if (!betDates.length) return 0;
    
    const uniqueDates = [...new Set(betDates.map(date => date.toDateString()))]
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasActivity = uniqueDates.some(date => {
        const betDate = new Date(date);
        betDate.setHours(0, 0, 0, 0);
        return betDate.getTime() === checkDate.getTime();
      });
      
      if (hasActivity) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Create a new group bet (saves to microBets collection)
  static async createGroupBet(
    question: string, 
    minRange: number, 
    maxRange: number, 
    createdBy: string
  ): Promise<string | null> {
    try {
      const groupLine = {
        question,
        min: minRange,
        max: maxRange,
        active: true,
        createdBy,
        createdAt: new Date(),
        sponsor: this.getNextSponsor(),   // 👈 NEW sponsor assignment
      };

      const docRef = doc(collection(db, "microBets"));
      await setDoc(docRef, {
        ...groupLine,
        gameId: "default", // 👈 tie bet to a game (adjust as needed)
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating group bet:", error);
      return null;
    }
  }
  
  // Set the actual answer for a group line (creator only)
  static async setGroupLineAnswer(lineId: string, actual: number, userId: string): Promise<boolean> {
    try {
      const lineRef = doc(db, 'groupLines', lineId);
      const lineSnap = await getDoc(lineRef);
      
      if (!lineSnap.exists()) return false;
      
      const lineData = lineSnap.data();
      if (lineData.createdBy !== userId) return false;
      
      await updateDoc(lineRef, {
        actual,
        active: false
      });
      return true;
    } catch (error) {
      console.error('Error setting group line answer:', error);
      return false;
    }
  }
}