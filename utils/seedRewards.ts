import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const sampleRewards = [
  {
    title: "Premium Sports Analysis",
    description: "Get detailed analysis and predictions for upcoming games",
    coinCost: 500,
    category: "Premium Features",
    isActive: true
  },
  {
    title: "VIP Discord Access",
    description: "Join our exclusive VIP Discord community with expert insights",
    coinCost: 300,
    category: "Community",
    isActive: true
  },
  {
    title: "Custom Team Jersey",
    description: "Get a custom jersey of your favorite team delivered to your door",
    coinCost: 2000,
    category: "Physical Rewards",
    isActive: true
  },
  {
    title: "Weekly Newsletter",
    description: "Receive our premium weekly sports newsletter with insider tips",
    coinCost: 150,
    category: "Content",
    isActive: true
  },
  {
    title: "1-on-1 Strategy Session",
    description: "30-minute personal consultation with our sports betting expert",
    coinCost: 1500,
    category: "Consultation",
    isActive: true
  },
  {
    title: "Mobile App Pro Features",
    description: "Unlock advanced features in our mobile app for 3 months",
    coinCost: 800,
    category: "Premium Features",
    isActive: true
  },
  {
    title: "Sports Memorabilia",
    description: "Authentic signed sports memorabilia from your favorite players",
    coinCost: 3000,
    category: "Physical Rewards",
    isActive: true
  },
  {
    title: "Early Access Pass",
    description: "Get early access to new features and betting opportunities",
    coinCost: 400,
    category: "Premium Features",
    isActive: true
  }
];

export const seedRewards = async (): Promise<void> => {
  try {
    const rewardsCollection = collection(db, 'rewards');
    
    for (const reward of sampleRewards) {
      await addDoc(rewardsCollection, reward);
      console.log(`Added reward: ${reward.title}`);
    }
    
    console.log('All sample rewards added successfully!');
  } catch (error) {
    console.error('Error seeding rewards:', error);
  }
};

// Uncomment the line below and run this file to seed your Firebase with sample rewards
// seedRewards();