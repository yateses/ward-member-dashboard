import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Your Firebase configuration
// You'll need to replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyDH_2FVGuVlz_WOH71xrHu5XE4qGevkEXk",
  authDomain: "bishop-ministry.firebaseapp.com",
  projectId: "bishop-ministry",
  storageBucket: "bishop-ministry.firebasestorage.app",
  messagingSenderId: "350752679794",
  appId: "1:350752679794:web:a902f0a6a1bf7f2189dfeb"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Auth
export const auth = getAuth(app)

export default app 