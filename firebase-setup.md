# Firebase Setup for Profile and Rewards System

## Required Collections

### 1. Users Collection (`users`)
Each user document should have the following structure:

```javascript
{
  id: "user_uid", // Document ID should match Firebase Auth UID
  name: "User Display Name",
  email: "user@example.com",
  coins: 1000, // Number of coins the user has
  claimedRewards: [], // Array of reward IDs that user has claimed
  favoriteTeams: ["Chiefs", "Lakers", "Dodgers"], // Optional
  favoriteLeagues: ["NFL", "NBA", "MLB"], // Optional
  lifetimeCharity: 2450, // Optional
  dailyStreak: 12, // Optional
  totalBets: 156, // Optional
  winRate: 61, // Optional
  rewardsProgress: 75, // Optional (0-100)
  rewardLevel: 2 // Optional
}
```

### 2. Rewards Collection (`rewards`)
Each reward document should have the following structure:

```javascript
{
  id: "reward_uuid", // Auto-generated document ID
  title: "Premium Sports Analysis",
  description: "Get detailed analysis for upcoming games",
  coinCost: 500, // Cost in coins to claim this reward
  category: "Premium Features", // Category for organization
  imageUrl: "https://example.com/image.jpg", // Optional
  isActive: true // Whether this reward is currently available
}
```

## Sample Data

### Sample Users
```javascript
// User document ID: "user123"
{
  name: "John Doe",
  email: "john@example.com",
  coins: 1500,
  claimedRewards: ["reward1"],
  favoriteTeams: ["Chiefs", "Lakers"],
  favoriteLeagues: ["NFL", "NBA"],
  lifetimeCharity: 1200,
  dailyStreak: 7,
  totalBets: 45,
  winRate: 67,
  rewardsProgress: 80,
  rewardLevel: 3
}
```

### Sample Rewards
```javascript
// Reward document ID: "reward1"
{
  title: "Premium Sports Analysis",
  description: "Get detailed analysis and predictions for upcoming games",
  coinCost: 500,
  category: "Premium Features",
  isActive: true
}

// Reward document ID: "reward2"
{
  title: "VIP Discord Access",
  description: "Join our exclusive VIP Discord community",
  coinCost: 300,
  category: "Community",
  isActive: true
}

// Reward document ID: "reward3"
{
  title: "Custom Team Jersey",
  description: "Get a custom jersey of your favorite team",
  coinCost: 2000,
  category: "Physical Rewards",
  isActive: true
}
```

## Setup Instructions

1. **Create Collections**: In your Firebase Console, create the `users` and `rewards` collections.

2. **Add Sample Data**: Add the sample documents above to test the functionality.

3. **Security Rules**: Update your Firestore security rules to allow authenticated users to:
   - Read their own user document
   - Update their own coins and claimedRewards
   - Read all active rewards

Example security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read active rewards
    match /rewards/{rewardId} {
      allow read: if request.auth != null;
    }
  }
}
```

4. **Initialize User Data**: When a user first logs in, create their user document with default values:
   - coins: 100 (starting coins)
   - claimedRewards: []
   - Other fields as needed

## Integration Notes

- The `FirebaseService` class handles all Firebase operations
- User coins are automatically updated when rewards are claimed
- The profile component fetches real-time data from Firebase
- Rewards are filtered to show only unclaimed ones in the "Available" section
- Claimed rewards are displayed separately in the "Claimed" section