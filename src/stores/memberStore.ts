import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { MemberService } from '../services/memberService'
import type { Member, MemberImportData, Household } from '../types/member'

export const useMemberStore = defineStore('member', () => {
  // State
  const members = ref<Member[]>([])
  const households = ref<Household[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const totalMembers = computed(() => members.value.length)
  const totalHouseholds = computed(() => households.value.length)
  
  const membersByAge = computed(() => {
    const groups = {
      children: members.value.filter(m => m.age < 18),
      youth: members.value.filter(m => m.age >= 18 && m.age < 30),
      adults: members.value.filter(m => m.age >= 30)
    }
    return groups
  })

  const membersWithCallings = computed(() => 
    members.value.filter(m => m.callings && m.callings.length > 0)
  )

  const membersByPriesthood = computed(() => {
    const groups: Record<string, Member[]> = {}
    members.value.forEach(member => {
      if (member.priesthoodOffice) {
        if (!groups[member.priesthoodOffice]) {
          groups[member.priesthoodOffice] = []
        }
        groups[member.priesthoodOffice].push(member)
      }
    })
    return groups
  })

  // Actions
  const fetchAllMembers = async () => {
    loading.value = true
    error.value = null
    try {
      members.value = await MemberService.getAllMembers()
    } catch (err) {
      error.value = `Failed to fetch members: ${err}`
    } finally {
      loading.value = false
    }
  }

  const fetchAllHouseholds = async () => {
    loading.value = true
    error.value = null
    try {
      households.value = await MemberService.getAllHouseholds()
    } catch (err) {
      error.value = `Failed to fetch households: ${err}`
    } finally {
      loading.value = false
    }
  }

  const addMember = async (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true
    error.value = null
    try {
      const id = await MemberService.addMember(memberData)
      await fetchAllMembers() // Refresh the list
      return id
    } catch (err) {
      error.value = `Failed to add member: ${err}`
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateMember = async (id: string, updates: Partial<Member>) => {
    loading.value = true
    error.value = null
    try {
      await MemberService.updateMember(id, updates)
      await fetchAllMembers() // Refresh the list
    } catch (err) {
      error.value = `Failed to update member: ${err}`
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteMember = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await MemberService.deleteMember(id)
      await fetchAllMembers() // Refresh the list
    } catch (err) {
      error.value = `Failed to delete member: ${err}`
      throw err
    } finally {
      loading.value = false
    }
  }

  const importMembers = async (importData: MemberImportData[]) => {
    loading.value = true
    error.value = null
    try {
      const result = await MemberService.importMembers(importData)
      if (result.errors.length > 0) {
        error.value = `Import completed with ${result.errors.length} errors: ${result.errors.join(', ')}`
      }
      await fetchAllMembers() // Refresh the list
      return result
    } catch (err) {
      error.value = `Failed to import members: ${err}`
      throw err
    } finally {
      loading.value = false
    }
  }

  const searchMembers = async (searchTerm: string) => {
    loading.value = true
    error.value = null
    try {
      const results = await MemberService.searchMembers(searchTerm)
      return results
    } catch (err) {
      error.value = `Failed to search members: ${err}`
      return []
    } finally {
      loading.value = false
    }
  }

  const getMemberById = async (id: string) => {
    try {
      return await MemberService.getMember(id)
    } catch (err) {
      error.value = `Failed to get member: ${err}`
      return null
    }
  }

  const getMembersByHousehold = async (headOfHouse: string) => {
    try {
      return await MemberService.getMembersByHousehold(headOfHouse)
    } catch (err) {
      error.value = `Failed to get household members: ${err}`
      return []
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    members,
    households,
    loading,
    error,
    
    // Getters
    totalMembers,
    totalHouseholds,
    membersByAge,
    membersWithCallings,
    membersByPriesthood,
    
    // Actions
    fetchAllMembers,
    fetchAllHouseholds,
    addMember,
    updateMember,
    deleteMember,
    importMembers,
    searchMembers,
    getMemberById,
    getMembersByHousehold,
    clearError
  }
}) 