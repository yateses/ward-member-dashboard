import { 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'
import { db } from '../firebase/config'

export interface CompletionData {
  birthdays: string[]
  anniversaries: string[]
  lastUpdated: Date
}

export interface MonthlyCompletions {
  [monthKey: string]: CompletionData
}

class BirthdayAnniversaryService {
  private collectionName = 'birthday-anniversary-completions'

  /**
   * Save completion data for a specific month
   */
  async saveMonthCompletions(monthKey: string, birthdays: string[], anniversaries: string[]): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, monthKey)
      const completionData: CompletionData = {
        birthdays,
        anniversaries,
        lastUpdated: new Date()
      }
      
      await setDoc(docRef, completionData)
      console.log(`✅ Saved completions for ${monthKey}`)
    } catch (error) {
      console.error('❌ Error saving month completions:', error)
      throw error
    }
  }

  /**
   * Load completion data for a specific month
   */
  async loadMonthCompletions(monthKey: string): Promise<CompletionData | null> {
    try {
      const docRef = doc(db, this.collectionName, monthKey)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data() as CompletionData
        // Convert timestamp back to Date if needed
        if (data.lastUpdated && typeof data.lastUpdated === 'object' && 'toDate' in data.lastUpdated) {
          data.lastUpdated = (data.lastUpdated as any).toDate()
        }
        console.log(`✅ Loaded completions for ${monthKey}`)
        return data
      } else {
        console.log(`📝 No completions found for ${monthKey}`)
        return null
      }
    } catch (error) {
      console.error('❌ Error loading month completions:', error)
      throw error
    }
  }

  /**
   * Load all completion data for multiple months
   */
  async loadAllCompletions(monthKeys: string[]): Promise<MonthlyCompletions> {
    try {
      const completions: MonthlyCompletions = {}
      
      // Load each month's data
      for (const monthKey of monthKeys) {
        const data = await this.loadMonthCompletions(monthKey)
        if (data) {
          completions[monthKey] = data
        }
      }
      
      console.log(`✅ Loaded completions for ${Object.keys(completions).length} months`)
      return completions
    } catch (error) {
      console.error('❌ Error loading all completions:', error)
      throw error
    }
  }

  /**
   * Delete completion data for a specific month
   */
  async deleteMonthCompletions(monthKey: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, monthKey)
      await deleteDoc(docRef)
      console.log(`🗑️ Deleted completions for ${monthKey}`)
    } catch (error) {
      console.error('❌ Error deleting month completions:', error)
      throw error
    }
  }

  /**
   * Get all completion documents (for admin purposes)
   */
  async getAllCompletions(): Promise<MonthlyCompletions> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName))
      const completions: MonthlyCompletions = {}
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as CompletionData
        // Convert timestamp back to Date if needed
        if (data.lastUpdated && typeof data.lastUpdated === 'object' && 'toDate' in data.lastUpdated) {
          data.lastUpdated = (data.lastUpdated as any).toDate()
        }
        completions[doc.id] = data
      })
      
      console.log(`✅ Loaded all completions (${Object.keys(completions).length} months)`)
      return completions
    } catch (error) {
      console.error('❌ Error loading all completions:', error)
      throw error
    }
  }
}

export const birthdayAnniversaryService = new BirthdayAnniversaryService() 