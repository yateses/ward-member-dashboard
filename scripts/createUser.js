#!/usr/bin/env node

import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import dotenv from 'dotenv'
import readline from 'readline'

// Load environment variables
dotenv.config()

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function createUser() {
  try {
    console.log('🔐 FH5 Members - User Creation\n')
    
    const email = await question('Enter email address: ')
    const password = await question('Enter password (min 6 characters): ')
    
    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters long')
      rl.close()
      return
    }
    
    console.log('\n⏳ Creating user account...')
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    console.log('✅ User created successfully!')
    console.log(`📧 Email: ${userCredential.user.email}`)
    console.log(`🆔 User ID: ${userCredential.user.uid}`)
    console.log('\n🎉 You can now log in to the FH5 Members app!')
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message)
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('💡 This email is already registered. Try logging in instead.')
    }
  } finally {
    rl.close()
  }
}

createUser() 