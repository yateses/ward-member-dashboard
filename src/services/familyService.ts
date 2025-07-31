import { 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Family, TodoItem, FamilyWithMembers } from '../types/family'
import type { Member } from '../types/member'

class FamilyService {
  private collectionName = 'families'

  /**
   * Create or update a family
   */
  async saveFamily(family: Family): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, family.id)
      await setDoc(docRef, {
        ...family,
        lastUpdated: new Date()
      })
      console.log(`✅ Saved family: ${family.headOfHousehold}`)
    } catch (error) {
      console.error('❌ Error saving family:', error)
      throw error
    }
  }

  /**
   * Get a family by ID
   */
  async getFamily(familyId: string): Promise<Family | null> {
    try {
      const docRef = doc(db, this.collectionName, familyId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Family
        // Convert timestamps back to Date objects
        if (data.lastUpdated && typeof data.lastUpdated === 'object' && 'toDate' in data.lastUpdated) {
          data.lastUpdated = (data.lastUpdated as any).toDate()
        }
        data.todoItems = data.todoItems.map(item => ({
          ...item,
          createdAt: item.createdAt && typeof item.createdAt === 'object' && 'toDate' in item.createdAt 
            ? (item.createdAt as any).toDate() 
            : new Date(item.createdAt),
          completedAt: item.completedAt && typeof item.completedAt === 'object' && 'toDate' in item.completedAt 
            ? (item.completedAt as any).toDate() 
            : item.completedAt
        }))
        return data
      }
      return null
    } catch (error) {
      console.error('❌ Error getting family:', error)
      throw error
    }
  }

  /**
   * Get all families
   */
  async getAllFamilies(): Promise<Family[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName))
      const families: Family[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Family
        // Convert timestamps back to Date objects
        if (data.lastUpdated && typeof data.lastUpdated === 'object' && 'toDate' in data.lastUpdated) {
          data.lastUpdated = (data.lastUpdated as any).toDate()
        }
        data.todoItems = data.todoItems.map(item => ({
          ...item,
          createdAt: item.createdAt && typeof item.createdAt === 'object' && 'toDate' in item.createdAt 
            ? (item.createdAt as any).toDate() 
            : new Date(item.createdAt),
          completedAt: item.completedAt && typeof item.completedAt === 'object' && 'toDate' in item.completedAt 
            ? (item.completedAt as any).toDate() 
            : item.completedAt
        }))
        families.push(data)
      })
      
      return families.sort((a, b) => a.headOfHousehold.localeCompare(b.headOfHousehold))
    } catch (error) {
      console.error('❌ Error getting all families:', error)
      throw error
    }
  }

  /**
   * Get families with member details populated
   */
  async getFamiliesWithMembers(allMembers: Member[]): Promise<FamilyWithMembers[]> {
    try {
      const families = await this.getAllFamilies()
      
      return families.map(family => {
        // Debug logging
        console.log(`🔍 Processing family: ${family.headOfHousehold}`)
        console.log(`📋 Family member IDs:`, family.members)
        console.log(`👥 Available member IDs:`, allMembers.map(m => m.id))
        
        const familyMembers = allMembers.filter(member => {
          // Handle missing IDs by using preferredName as fallback
          const memberId = member.id
          if (!memberId) {
            console.warn(`⚠️ Member ${member.preferredName} has no ID, skipping`)
            return false
          }
          return family.members.includes(memberId)
        })
        
        console.log(`✅ Found ${familyMembers.length} members for family ${family.headOfHousehold}`)
        
        // If no members found, try to recreate the family from members
        if (familyMembers.length === 0) {
          console.warn(`⚠️ No members found for family ${family.headOfHousehold}, attempting to fix...`)
          const membersByHousehold = allMembers.filter(member => 
            member.headOfHouse === family.headOfHousehold
          )
          if (membersByHousehold.length > 0) {
            console.log(`🔧 Found ${membersByHousehold.length} members by household name, updating family...`)
            // Update the family with correct member IDs
            const updatedFamily = {
              ...family,
              members: membersByHousehold.map(m => m.id!).filter(id => id)
            }
            // Save the updated family
            this.saveFamily(updatedFamily)
            
            // Return the fixed family
            const fixedMembers = membersByHousehold.map(member => ({
              id: member.id!,
              preferredName: member.preferredName,
              birthDate: member.birthDate!,
              age: member.age,
              addressStreet1: member.addressStreet1,
              individualPhone: member.individualPhone,
              individualEmail: member.individualEmail
            }))
            
            const memberWithAddress = membersByHousehold.find(member => 
              member.addressStreet1 && member.addressStreet1.trim() !== ''
            )
            const familyAddress = memberWithAddress?.addressStreet1
            
            return {
              ...family,
              members: fixedMembers.sort((a, b) => b.age - a.age),
              address: familyAddress
            }
          }
        }
        
        const membersWithDetails = familyMembers.map(member => ({
          id: member.id!,
          preferredName: member.preferredName,
          birthDate: member.birthDate!,
          age: member.age,
          addressStreet1: member.addressStreet1,
          individualPhone: member.individualPhone,
          individualEmail: member.individualEmail
        }))
        
        // Compute family address from the first member with an address
        const memberWithAddress = familyMembers.find(member => 
          member.addressStreet1 && member.addressStreet1.trim() !== ''
        )
        const familyAddress = memberWithAddress?.addressStreet1
        
        return {
          ...family,
          members: membersWithDetails.sort((a, b) => b.age - a.age), // Sort by age descending
          address: familyAddress
        }
      })
    } catch (error) {
      console.error('❌ Error getting families with members:', error)
      throw error
    }
  }

  /**
   * Get families by review day
   */
  async getFamiliesByReviewDay(reviewDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday', allMembers: Member[]): Promise<FamilyWithMembers[]> {
    try {
      const allFamilies = await this.getFamiliesWithMembers(allMembers)
      return allFamilies.filter(family => family.reviewDay === reviewDay)
    } catch (error) {
      console.error('❌ Error getting families by review day:', error)
      throw error
    }
  }

  /**
   * Add a todo item to a family
   */
  async addTodoItem(familyId: string, todoItem: Omit<TodoItem, 'id' | 'createdAt' | 'completed' | 'completedAt'>): Promise<void> {
    try {
      const family = await this.getFamily(familyId)
      if (!family) {
        throw new Error('Family not found')
      }
      
      const newTodoItem: TodoItem = {
        ...todoItem,
        id: crypto.randomUUID(),
        completed: false,
        createdAt: new Date()
      }
      
      family.todoItems.push(newTodoItem)
      await this.saveFamily(family)
      console.log(`✅ Added todo item to family: ${family.headOfHousehold}`)
    } catch (error) {
      console.error('❌ Error adding todo item:', error)
      throw error
    }
  }

  /**
   * Update a todo item
   */
  async updateTodoItem(familyId: string, todoItemId: string, updates: Partial<TodoItem>): Promise<void> {
    try {
      const family = await this.getFamily(familyId)
      if (!family) {
        throw new Error('Family not found')
      }
      
      const todoIndex = family.todoItems.findIndex(item => item.id === todoItemId)
      if (todoIndex === -1) {
        throw new Error('Todo item not found')
      }
      
      // Update the todo item
      family.todoItems[todoIndex] = {
        ...family.todoItems[todoIndex],
        ...updates,
        completedAt: updates.completed ? new Date() : undefined
      }
      
      await this.saveFamily(family)
      console.log(`✅ Updated todo item in family: ${family.headOfHousehold}`)
    } catch (error) {
      console.error('❌ Error updating todo item:', error)
      throw error
    }
  }

  /**
   * Delete a todo item
   */
  async deleteTodoItem(familyId: string, todoItemId: string): Promise<void> {
    try {
      const family = await this.getFamily(familyId)
      if (!family) {
        throw new Error('Family not found')
      }
      
      family.todoItems = family.todoItems.filter(item => item.id !== todoItemId)
      await this.saveFamily(family)
      console.log(`🗑️ Deleted todo item from family: ${family.headOfHousehold}`)
    } catch (error) {
      console.error('❌ Error deleting todo item:', error)
      throw error
    }
  }

  /**
   * Toggle todo item completion
   */
  async toggleTodoItem(familyId: string, todoItemId: string): Promise<void> {
    try {
      const family = await this.getFamily(familyId)
      if (!family) {
        throw new Error('Family not found')
      }
      
      const todoItem = family.todoItems.find(item => item.id === todoItemId)
      if (!todoItem) {
        throw new Error('Todo item not found')
      }
      
      await this.updateTodoItem(familyId, todoItemId, {
        completed: !todoItem.completed
      })
    } catch (error) {
      console.error('❌ Error toggling todo item:', error)
      throw error
    }
  }

  /**
   * Create families from existing members (group by head of household)
   */
  async createFamiliesFromMembers(members: Member[]): Promise<void> {
    try {
      // Group members by head of household
      const householdGroups = new Map<string, Member[]>()
      
      members.forEach(member => {
        const household = member.headOfHouse
        if (!householdGroups.has(household)) {
          householdGroups.set(household, [])
        }
        householdGroups.get(household)!.push(member)
      })
      
      // Convert to array and sort for consistent assignment
      const households = Array.from(householdGroups.keys()).sort()
      const reviewDays: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'> = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      
      // Create family documents
      for (let i = 0; i < households.length; i++) {
        const household = households[i]
        const householdMembers = householdGroups.get(household)!
        const familyId = `family-${household.replace(/\s+/g, '-').toLowerCase()}`
        
        // Check if family already exists
        const existingFamily = await this.getFamily(familyId)
        if (existingFamily) {
          continue // Skip if already exists
        }
        
        // Assign review day evenly across the week
        const reviewDay = reviewDays[i % 5]
        
        // Debug logging for family creation
        console.log(`🏠 Creating family for household: ${household}`)
        console.log(`👥 Household members:`, householdMembers.map(m => ({ name: m.preferredName, id: m.id })))
        
        const memberIds = householdMembers.map(m => m.id!).filter(id => id) // Filter out undefined IDs
        console.log(`🆔 Member IDs to store:`, memberIds)
        
        const family: Family = {
          id: familyId,
          headOfHousehold: household,
          members: memberIds,
          todoItems: [],
          reviewDay,
          lastUpdated: new Date()
        }
        
        await this.saveFamily(family)
        console.log(`✅ Created family: ${household} (Review: ${reviewDay})`)
      }
    } catch (error) {
      console.error('❌ Error creating families from members:', error)
      throw error
    }
  }

  /**
   * Delete a family
   */
  async deleteFamily(familyId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, familyId)
      await deleteDoc(docRef)
      console.log(`🗑️ Deleted family: ${familyId}`)
    } catch (error) {
      console.error('❌ Error deleting family:', error)
      throw error
    }
  }

  /**
   * Update only the review day for a family
   */
  async updateReviewDay(familyId: string, reviewDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, familyId)
      await updateDoc(docRef, {
        reviewDay: reviewDay,
        lastUpdated: new Date()
      })
      console.log(`✅ Updated review day for family ${familyId} to ${reviewDay}`)
    } catch (error) {
      console.error('❌ Error updating review day:', error)
      throw error
    }
  }

  /**
   * Get all todo items grouped by category
   */
  async getTodoItemsByCategory(allMembers: Member[]): Promise<{
    category: string
    items: Array<{
      id: string
      title: string
      priority: 'low' | 'medium' | 'high'
      completed: boolean
      familyName: string
      familyId: string
    }>
  }[]> {
    try {
      const families = await this.getFamiliesWithMembers(allMembers)
      const categoryMap = new Map<string, Array<{
        id: string
        title: string
        priority: 'low' | 'medium' | 'high'
        completed: boolean
        familyName: string
        familyId: string
      }>>()
      
      families.forEach(family => {
        family.todoItems.forEach(item => {
          if (!categoryMap.has(item.category)) {
            categoryMap.set(item.category, [])
          }
          
          categoryMap.get(item.category)!.push({
            id: item.id,
            title: item.title,
            priority: item.priority,
            completed: item.completed,
            familyName: family.headOfHousehold,
            familyId: family.id
          })
        })
      })
      
      // Convert to array and sort by category name
      return Array.from(categoryMap.entries())
        .map(([category, items]) => ({
          category,
          items: items.sort((a, b) => {
            // Sort by priority first (high, medium, low), then by title
            const priorityOrder = { high: 3, medium: 2, low: 1 }
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
            if (priorityDiff !== 0) return priorityDiff
            return a.title.localeCompare(b.title)
          })
        }))
        .sort((a, b) => a.category.localeCompare(b.category))
    } catch (error) {
      console.error('❌ Error getting todo items by category:', error)
      throw error
    }
  }

  /**
   * Fix corrupted family data by recreating families from members
   */
  async fixCorruptedFamilies(members: Member[]): Promise<void> {
    try {
      console.log('🔧 Starting to fix corrupted family data...')
      
      // Get all existing families
      const existingFamilies = await this.getAllFamilies()
      
      // Check which families have corrupted member data (full objects instead of IDs)
      const corruptedFamilies = existingFamilies.filter(family => {
        if (!family.members || family.members.length === 0) return false
        // Check if any member is an object instead of a string ID
        return family.members.some(member => typeof member === 'object')
      })
      
      if (corruptedFamilies.length === 0) {
        console.log('✅ No corrupted families found')
        return
      }
      
      console.log(`🔧 Found ${corruptedFamilies.length} corrupted families to fix`)
      
      // Delete corrupted families
      for (const family of corruptedFamilies) {
        await this.deleteFamily(family.id)
        console.log(`🗑️ Deleted corrupted family: ${family.headOfHousehold}`)
      }
      
      // Recreate families from members
      await this.createFamiliesFromMembers(members)
      console.log('✅ Successfully recreated families from members')
      
    } catch (error) {
      console.error('❌ Error fixing corrupted families:', error)
      throw error
    }
  }
}

export const familyService = new FamilyService() 