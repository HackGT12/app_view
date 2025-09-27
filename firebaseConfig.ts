// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCpV7RxENR1VZLEnxoDIJ9E4P0Ka_rbPn8",
  authDomain: "hackgt12-5bb2b.firebaseapp.com",
  projectId: "hackgt12-5bb2b",
  storageBucket: "hackgt12-5bb2b.firebasestorage.app",
  messagingSenderId: "194109623403",
  appId: "1:194109623403:web:874947cf0743318c7db52e",
  measurementId: "G-V4JRB4VED6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

// Initialize Analytics only if supported
let analytics: any = null;
isSupported().then((supported: boolean) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { analytics };

export default app;