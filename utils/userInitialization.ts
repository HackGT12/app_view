import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { UserData } from './firebaseService';

export const initializeUserData = async (userId: string, userEmail: string, userName?: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    // Only initialize if user doesn't exist
    if (!userSnap.exists()) {
      const initialUserData: Partial<UserData> = {
        name: userName || 'New User',
        email: userEmail,
        coins: 100, // Starting coins (not 0)
        claimedRewards: [], // Empty array (not 0)
        favoriteTeams: [],
        favoriteLeagues: [],
        lifetimeCharity: 0,
        dailyStreak: 0,
        totalBets: 0,
        winRate: 0,
        rewardsProgress: 0,
        rewardLevel: 1
      };
      
      await setDoc(userRef, initialUserData);
      console.log(`User data initialized: ${userName || 'New User'} with 100 coins`);
      return true;
    } else {
      console.log('User already exists, skipping initialization');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing user data:', error);
    return false;
  }
};

// Call this function after successful authentication
export const handleUserLogin = async (user: any) => {
  if (user) {
    await initializeUserData(user.uid, user.email, user.displayName);
  }
};