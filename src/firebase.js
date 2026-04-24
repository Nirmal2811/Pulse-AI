import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyAc4yzL1GVes7MkjCIJMWmKXHdypneZM8E',
  authDomain: 'ai-fitness-tracker-879d2.firebaseapp.com',
  projectId: 'ai-fitness-tracker-879d2',
  storageBucket: 'ai-fitness-tracker-879d2.firebasestorage.app',
  messagingSenderId: '605559875764',
  appId: '1:605559875764:web:d19a7bf6582e75e785cfe1',
  measurementId: 'G-QQ55MZRHPB',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Analytics
export const analytics = getAnalytics(app)

export default app
