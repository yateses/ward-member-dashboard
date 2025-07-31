import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Member, MemberImportData, Household } from '../types/member'

const MEMBERS_COLLECTION = 'members'
const HOUSEHOLDS_COLLECTION = 'households'

export class MemberService {
  // Convert LCR import data to Member format
  static convertImportDataToMember(data: MemberImportData): Omit<Member, 'id' | 'createdAt' | 'updatedAt'> {
    const now = new Date()
    
    // Parse callings from HTML format
    const callings = data.CALLINGS 
      ? data.CALLINGS
          .replace(/<span class="custom-report-position">/g, '')
          .replace(/<\/span>/g, '')
          .split(/(?=<span class="custom-report-position">|$)/)
          .filter(calling => calling.trim())
          .map(calling => calling.trim())
      : []

    // Handle age more gracefully - only parse if it's a valid number
    let age = 0
    if (data.AGE && data.AGE.trim()) {
      const parsedAge = parseInt(data.AGE)
      if (!isNaN(parsedAge) && parsedAge >= 0 && parsedAge <= 120) {
        age = parsedAge
      }
    }

    // Handle gender more gracefully - only use if it's valid
    let gender: 'M' | 'F' = 'M' // default
    if (data.GENDER && ['M', 'F'].includes(data.GENDER)) {
      gender = data.GENDER as 'M' | 'F'
    }

    // Handle birth day/year more gracefully
    let birthDay: number | undefined = undefined
    if (data.BIRTH_DAY && data.BIRTH_DAY.trim()) {
      const parsed = parseInt(data.BIRTH_DAY)
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
        birthDay = parsed
      }
    }

    let birthYear: number | undefined = undefined
    if (data.BIRTH_YEAR && data.BIRTH_YEAR.trim()) {
      const parsed = parseInt(data.BIRTH_YEAR)
      if (!isNaN(parsed) && parsed >= 1900 && parsed <= new Date().getFullYear()) {
        birthYear = parsed
      }
    }

    // Create the member object
    const member = {
      preferredName: data.PREFERRED_NAME || '',
      headOfHouse: data.HEAD_OF_HOUSE || '',
      addressStreet1: data.ADDRESS_STREET_1 || '',
      age,
      baptismDate: data.BAPTISM_DATE || null,
      birthDate: data.BIRTH_DATE || null,
      callings,
      birthDay,
      birthMonth: data.BIRTH_MONTH || null,
      birthYear,
      birthplace: data.BIRTHPLACE || null,
      gender,
      individualPhone: data.INDIVIDUAL_PHONE || null,
      individualEmail: data.INDIVIDUAL_EMAIL || null,
      marriageDate: data.MARRIAGE_DATE || null,
      priesthoodOffice: data.PRIESTHOOD_OFFICE || null,
      templeRecommendExpirationDate: data.TEMPLE_RECOMMEND_EXPIRATION_DATE || null
    }

    // Remove undefined values (Firestore doesn't support undefined)
    const cleanMember = Object.fromEntries(
      Object.entries(member).filter(([_, value]) => value !== undefined)
    ) as Omit<Member, 'id' | 'createdAt' | 'updatedAt'>

    return cleanMember
  }

  // Add a single member
  static async addMember(memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date()
    const member: Omit<Member, 'id'> = {
      ...memberData,
      createdAt: now,
      updatedAt: now
    }
    
    const docRef = await addDoc(collection(db, MEMBERS_COLLECTION), member)
    return docRef.id
  }

  // Import multiple members from LCR data
  static async importMembers(importData: MemberImportData[]): Promise<{ success: number; updated: number; errors: string[] }> {
    const batch = writeBatch(db)
    const errors: string[] = []
    let successCount = 0
    let updatedCount = 0

    // Get existing members to check for duplicates
    const existingMembers = await this.getAllMembers()
    const existingMemberMap = new Map<string, Member>()
    
    // Create a map of existing members using name + head of house as key
    existingMembers.forEach(member => {
      const key = `${member.preferredName}|${member.headOfHouse}`
      existingMemberMap.set(key, member)
    })

    for (const data of importData) {
      try {
        const memberData = this.convertImportDataToMember(data)
        const now = new Date()
        const memberKey = `${memberData.preferredName}|${memberData.headOfHouse}`
        
        const existingMember = existingMemberMap.get(memberKey)
        
        if (existingMember) {
          // Update existing member
          const updatedMember: Partial<Member> = {
            ...memberData,
            updatedAt: now
          }
          
          // Don't update createdAt timestamp for existing records
          delete (updatedMember as any).createdAt
          
          const docRef = doc(db, MEMBERS_COLLECTION, existingMember.id!)
          batch.update(docRef, updatedMember)
          updatedCount++
        } else {
          // Create new member
          const newMember: Omit<Member, 'id'> = {
            ...memberData,
            createdAt: now,
            updatedAt: now
          }
          
          const docRef = doc(collection(db, MEMBERS_COLLECTION))
          batch.set(docRef, newMember)
          successCount++
        }
      } catch (error) {
        errors.push(`Error processing ${data.PREFERRED_NAME}: ${error}`)
      }
    }

    try {
      await batch.commit()
    } catch (error) {
      errors.push(`Batch commit failed: ${error}`)
    }

    return { success: successCount, updated: updatedCount, errors }
  }

  // Get all members
  static async getAllMembers(): Promise<Member[]> {
    const querySnapshot = await getDocs(collection(db, MEMBERS_COLLECTION))
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      
      // Convert Firestore timestamps to Date objects
      const convertTimestamp = (timestamp: any): Date => {
        if (!timestamp) return new Date()
        if (timestamp instanceof Date) return timestamp
        if (typeof timestamp === 'object' && 'toDate' in timestamp) {
          return timestamp.toDate()
        }
        if (typeof timestamp === 'number') return new Date(timestamp)
        if (typeof timestamp === 'string') return new Date(timestamp)
        return new Date()
      }
      
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt)
      }
    }) as Member[]
  }

  // Get members by household
  static async getMembersByHousehold(headOfHouse: string): Promise<Member[]> {
    const q = query(
      collection(db, MEMBERS_COLLECTION),
      where('headOfHouse', '==', headOfHouse),
      orderBy('preferredName')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      
      // Convert Firestore timestamps to Date objects
      const convertTimestamp = (timestamp: any): Date => {
        if (!timestamp) return new Date()
        if (timestamp instanceof Date) return timestamp
        if (typeof timestamp === 'object' && 'toDate' in timestamp) {
          return timestamp.toDate()
        }
        if (typeof timestamp === 'number') return new Date(timestamp)
        if (typeof timestamp === 'string') return new Date(timestamp)
        return new Date()
      }
      
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt)
      }
    }) as Member[]
  }

  // Get a single member by ID
  static async getMember(id: string): Promise<Member | null> {
    const docRef = doc(db, MEMBERS_COLLECTION, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      
      // Convert Firestore timestamps to Date objects
      const convertTimestamp = (timestamp: any): Date => {
        if (!timestamp) return new Date()
        if (timestamp instanceof Date) return timestamp
        if (typeof timestamp === 'object' && 'toDate' in timestamp) {
          return timestamp.toDate()
        }
        if (typeof timestamp === 'number') return new Date(timestamp)
        if (typeof timestamp === 'string') return new Date(timestamp)
        return new Date()
      }
      
      return {
        id: docSnap.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt)
      } as Member
    }
    
    return null
  }

  // Update a member
  static async updateMember(id: string, updates: Partial<Member>): Promise<void> {
    const docRef = doc(db, MEMBERS_COLLECTION, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    })
  }

  // Delete a member
  static async deleteMember(id: string): Promise<void> {
    const docRef = doc(db, MEMBERS_COLLECTION, id)
    await deleteDoc(docRef)
  }

  // Get all households
  static async getAllHouseholds(): Promise<Household[]> {
    const members = await this.getAllMembers()
    const householdsMap = new Map<string, Member[]>()
    
    // Group members by household
    members.forEach(member => {
      const key = member.headOfHouse
      if (!householdsMap.has(key)) {
        householdsMap.set(key, [])
      }
      householdsMap.get(key)!.push(member)
    })
    
    // Convert to household objects
    const households: Household[] = []
    for (const [headOfHouse, members] of householdsMap) {
      // Safely convert dates, handling both Date objects and Firestore timestamps
      const safeGetTime = (dateField: any): number => {
        if (!dateField) return Date.now()
        if (dateField instanceof Date) return dateField.getTime()
        if (typeof dateField === 'object' && 'toDate' in dateField) {
          return dateField.toDate().getTime()
        }
        if (typeof dateField === 'number') return dateField
        if (typeof dateField === 'string') return new Date(dateField).getTime()
        return Date.now()
      }
      
      const household: Household = {
        headOfHouse,
        address: members[0]?.addressStreet1 || '',
        members: members.sort((a, b) => a.preferredName.localeCompare(b.preferredName)),
        createdAt: new Date(Math.min(...members.map(m => safeGetTime(m.createdAt)))),
        updatedAt: new Date(Math.max(...members.map(m => safeGetTime(m.updatedAt))))
      }
      households.push(household)
    }
    
    return households.sort((a, b) => a.headOfHouse.localeCompare(b.headOfHouse))
  }

  // Search members
  static async searchMembers(searchTerm: string): Promise<Member[]> {
    const allMembers = await this.getAllMembers()
    const term = searchTerm.toLowerCase()
    
    return allMembers.filter(member => 
      member.preferredName.toLowerCase().includes(term) ||
      member.headOfHouse.toLowerCase().includes(term) ||
      member.addressStreet1.toLowerCase().includes(term) ||
      member.individualEmail?.toLowerCase().includes(term) ||
      member.individualPhone?.includes(term)
    )
  }

  // Check for potential duplicates in import data
  static async checkImportDuplicates(importData: MemberImportData[]): Promise<{
    newMembers: number
    existingMembers: number
    potentialDuplicates: Array<{ name: string; headOfHouse: string; existingId?: string }>
  }> {
    const existingMembers = await this.getAllMembers()
    const existingMemberMap = new Map<string, Member>()
    
    // Create a map of existing members using name + head of house as key
    existingMembers.forEach(member => {
      const key = `${member.preferredName}|${member.headOfHouse}`
      existingMemberMap.set(key, member)
    })

    let newMembers = 0
    let existingMembersCount = 0
    const potentialDuplicates: Array<{ name: string; headOfHouse: string; existingId?: string }> = []

    for (const data of importData) {
      const memberKey = `${data.PREFERRED_NAME}|${data.HEAD_OF_HOUSE}`
      const existingMember = existingMemberMap.get(memberKey)
      
      if (existingMember) {
        existingMembersCount++
        potentialDuplicates.push({
          name: data.PREFERRED_NAME,
          headOfHouse: data.HEAD_OF_HOUSE,
          existingId: existingMember.id
        })
      } else {
        newMembers++
      }
    }

    return {
      newMembers,
      existingMembers: existingMembersCount,
      potentialDuplicates
    }
  }
} 