import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  type User
} from 'firebase/auth'
import { auth } from '@/firebase/config'

class AuthService {
  private currentUser: User | null = null

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user
      console.log('Auth state changed:', user ? 'Logged in' : 'Logged out')
    })
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      this.currentUser = userCredential.user
      return userCredential.user
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth)
      this.currentUser = null
    } catch (error: any) {
      console.error('Logout error:', error)
      throw new Error('Failed to logout')
    }
  }

  async createUser(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error: any) {
      console.error('Create user error:', error)
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address'
      case 'auth/wrong-password':
        return 'Incorrect password'
      case 'auth/invalid-email':
        return 'Invalid email address'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later'
      default:
        return 'Authentication failed. Please try again'
    }
  }
}

export const authService = new AuthService() 