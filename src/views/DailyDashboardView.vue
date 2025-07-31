<template>
  <div class="daily-dashboard">
    <div class="header">
      <h1>📅 Daily Dashboard</h1>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading daily data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>⚠️ {{ error }}</p>
      <button @click="loadDailyData" class="btn btn-secondary">Retry</button>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Today's Birthdays -->
      <div class="section">
        <h2>🎂 Today's Birthdays</h2>
        <div v-if="todaysBirthdays.length === 0" class="empty-state">
          <p>No birthdays today</p>
        </div>
                 <div v-else class="birthday-list">
           <div 
             v-for="birthday in todaysBirthdays" 
             :key="birthday.id"
             class="birthday-item"
             :class="{ 'completed': isBirthdayCompleted(birthday.id) }"
           >
             <label class="birthday-checkbox">
               <input 
                 type="checkbox" 
                 :checked="isBirthdayCompleted(birthday.id)"
                 @change="toggleBirthday(birthday.id)"
               />
               <span class="checkmark"></span>
             </label>
             <div class="birthday-icon">🎂</div>
             <div class="birthday-info">
               <div class="birthday-name">{{ birthday.preferredName }}</div>
               <div class="birthday-details">
                 <span class="birthday-age">{{ birthday.age }} years old</span>
                 <span class="birthday-household">{{ birthday.headOfHouse }}</span>
               </div>
             </div>
           </div>
         </div>
      </div>

      <!-- Today's Anniversaries -->
      <div class="section">
        <h2>💒 Today's Anniversaries</h2>
        <div v-if="todaysAnniversaries.length === 0" class="empty-state">
          <p>No anniversaries today</p>
        </div>
                 <div v-else class="anniversary-list">
           <div 
             v-for="anniversary in todaysAnniversaries" 
             :key="anniversary.id"
             class="anniversary-item"
             :class="{ 'completed': isAnniversaryCompleted(anniversary.id) }"
           >
             <label class="anniversary-checkbox">
               <input 
                 type="checkbox" 
                 :checked="isAnniversaryCompleted(anniversary.id)"
                 @change="toggleAnniversary(anniversary.id)"
               />
               <span class="checkmark"></span>
             </label>
             <div class="anniversary-icon">💒</div>
             <div class="anniversary-info">
               <div class="anniversary-names">
                 <span v-for="member in anniversary.members" :key="member.id" class="member-name">
                   {{ member.preferredName }}
                 </span>
               </div>
               <div class="anniversary-details">
                 <span class="anniversary-years">{{ getAnniversaryYearsFromDate(anniversary.marriageDate) }} years</span>
                 <span class="anniversary-household">{{ anniversary.headOfHouse }}</span>
               </div>
             </div>
           </div>
         </div>
      </div>

      <!-- Today's Families -->
      <div class="section">
        <div class="section-header">
          <h2>👨‍👩‍👧‍👦 {{ selectedDayLabel }} Families</h2>
          <div class="day-selector">
            <label for="day-select">Review Day:</label>
            <select 
              id="day-select" 
              v-model="selectedDay" 
              @change="onDayChange"
              class="day-dropdown"
            >
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
            </select>
          </div>
        </div>
        <div v-if="todaysFamilies.length === 0" class="empty-state">
          <p>No families scheduled for {{ selectedDayLabel.toLowerCase() }}</p>
        </div>
        <div v-else class="families-grid">
          <div 
            v-for="family in todaysFamilies" 
            :key="family.id"
            class="family-card"
          >
            <!-- Family Header -->
            <div class="family-header">
              <div class="family-info">
                <h3 class="family-name">{{ family.headOfHousehold }}</h3>
                <div class="review-day">
                  <span class="review-label">Review Day:</span>
                  <span class="review-day-value">{{ selectedDayLabel }}</span>
                </div>
              </div>
              <div class="family-stats">
                <span class="stat">
                  <span class="stat-label">Members:</span>
                  <span class="stat-value">{{ family.members.length }}</span>
                </span>
                <span class="stat">
                  <span class="stat-label">Todos:</span>
                  <span class="stat-value">{{ family.todoItems.filter(item => !item.completed).length }}</span>
                </span>
              </div>
            </div>

            <!-- Family Members -->
            <div class="family-members">
              <h4>👥 Family Members</h4>
              <div class="members-list">
                <div 
                  v-for="member in family.members" 
                  :key="member.id"
                  class="member-item"
                >
                  <span class="member-name">{{ getFirstName(member.preferredName) }}</span>
                  <div class="member-details">
                    <span class="member-age">{{ member.age }}</span>
                    <span class="member-birthday">{{ formatBirthday(member.birthDate) }}</span>
                  </div>
                </div>
              </div>
            </div>

                         <!-- Todo Items -->
             <div class="todo-section">
               <div class="todo-header">
                 <h4>📝 To-Do Items</h4>
                 <button 
                   @click="showAddTodoModal = true; selectedFamily = family"
                   class="btn btn-small btn-primary"
                 >
                   Add Item
                 </button>
               </div>
               
               <div v-if="family.todoItems.length === 0" class="empty-todos">
                 <p>No to-do items yet. Click "Add Item" to get started.</p>
               </div>
               
               <div v-else class="todo-list">
                 <div 
                   v-for="todo in filteredTodoItems(family.todoItems)" 
                   :key="todo.id"
                   class="todo-item"
                   :class="{ 
                     'completed': todo.completed,
                     'priority-high': todo.priority === 'high',
                     'priority-medium': todo.priority === 'medium',
                     'priority-low': todo.priority === 'low'
                   }"
                 >
                   <label class="todo-checkbox">
                     <input 
                       type="checkbox" 
                       :checked="todo.completed"
                       @change="toggleTodoItem(family.id, todo.id)"
                     />
                     <span class="checkmark"></span>
                   </label>
                   
                   <div class="todo-content">
                     <div class="todo-title">{{ todo.title }}</div>
                     
                     <div class="todo-meta">
                       <span class="todo-priority" :class="`priority-${todo.priority}`">
                         {{ todo.priority }}
                       </span>
                       <span v-if="todo.category" class="todo-category">
                         {{ todo.category }}
                       </span>
                       <span class="todo-date">
                         {{ formatDate(todo.createdAt) }}
                       </span>
                     </div>
                   </div>
                   
                   <button 
                     @click="deleteTodoItem(family.id, todo.id)"
                     class="btn btn-small btn-danger"
                     title="Delete todo item"
                   >
                     🗑️
                   </button>
                 </div>
               </div>
             </div>
          </div>
                 </div>
       </div>
     </div>

     <!-- Add Todo Modal -->
     <div v-if="showAddTodoModal" class="modal-overlay" @click="showAddTodoModal = false">
       <div class="modal" @click.stop>
         <div class="modal-header">
           <h3>Add To-Do Item</h3>
           <button @click="showAddTodoModal = false" class="btn btn-small btn-secondary">✕</button>
         </div>
         
         <form @submit.prevent="addTodoItem" class="modal-form">
           <div class="form-group">
             <label for="todo-title">Title *</label>
             <input 
               id="todo-title"
               v-model="newTodo.title"
               type="text"
               required
               placeholder="Enter todo title"
             />
           </div>
           

           
           <div class="form-row">
             <div class="form-group">
               <label for="todo-priority">Priority</label>
               <select id="todo-priority" v-model="newTodo.priority">
                 <option value="low">Low</option>
                 <option value="medium">Medium</option>
                 <option value="high">High</option>
               </select>
             </div>
             
             <div class="form-group">
               <label for="todo-category">Category</label>
               <input 
                 id="todo-category"
                 v-model="newTodo.category"
                 type="text"
                 placeholder="e.g., Visit, Call, Follow-up"
               />
             </div>
           </div>
           
           <div class="modal-actions">
             <button type="button" @click="showAddTodoModal = false" class="btn btn-secondary">
               Cancel
             </button>
             <button type="submit" class="btn btn-primary" :disabled="isAddingTodo">
               {{ isAddingTodo ? 'Adding...' : 'Add Item' }}
             </button>
           </div>
         </form>
       </div>
     </div>
   </div>
 </template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMemberStore } from '../stores/memberStore'
import { familyService } from '../services/familyService'
import { birthdayAnniversaryService } from '../services/birthdayAnniversaryService'
import type { FamilyWithMembers, TodoItem } from '../types/family'
import type { Member } from '../types/member'

const memberStore = useMemberStore()

// Reactive state
const selectedDay = ref<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'>('monday')
const todaysFamilies = ref<FamilyWithMembers[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const showAddTodoModal = ref(false)
const selectedFamily = ref<FamilyWithMembers | null>(null)
const isAddingTodo = ref(false)
const showCompletedItems = ref(false)

// Birthday/Anniversary tracking
const completedBirthdays = ref<string[]>([])
const completedAnniversaries = ref<string[]>([])
const isLoadingCompletions = ref(false)

// New todo form
const newTodo = ref({
  title: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  category: ''
})

// Computed
const selectedDayLabel = computed(() => {
  return selectedDay.value.charAt(0).toUpperCase() + selectedDay.value.slice(1)
})

const todaysBirthdays = computed(() => {
  const today = new Date()
  const todayDay = today.getDate()
  const todayMonth = today.getMonth() + 1
  
  return memberStore.members.filter(member => {
    if (!member.birthDate) return false
    const birthDate = new Date(member.birthDate)
    return birthDate.getDate() === todayDay && birthDate.getMonth() + 1 === todayMonth
  }).sort((a, b) => a.preferredName.localeCompare(b.preferredName))
})

const todaysAnniversaries = computed(() => {
  const today = new Date()
  const todayDay = today.getDate()
  const todayMonth = today.getMonth() + 1
  
  const membersWithAnniversaries = memberStore.members.filter(member => {
    if (!member.marriageDate) return false
    const marriageDate = new Date(member.marriageDate)
    return marriageDate.getDate() === todayDay && marriageDate.getMonth() + 1 === todayMonth
  })

  // Group by household to find couples
  const householdGroups = new Map<string, typeof membersWithAnniversaries>()
  
  membersWithAnniversaries.forEach(member => {
    const household = member.headOfHouse
    if (!householdGroups.has(household)) {
      householdGroups.set(household, [])
    }
    householdGroups.get(household)!.push(member)
  })

  // Create anniversary entries for each couple
  const anniversaryEntries: Array<{
    id: string
    members: typeof membersWithAnniversaries
    marriageDate: string
    headOfHouse: string
  }> = []

  householdGroups.forEach((members, household) => {
    if (members.length > 0) {
      const firstMember = members[0]
      anniversaryEntries.push({
        id: `anniversary-${household}`,
        members,
        marriageDate: firstMember.marriageDate!,
        headOfHouse: household
      })
    }
  })

  return anniversaryEntries.sort((a, b) => a.headOfHouse.localeCompare(b.headOfHouse))
})

// Methods
const loadDailyData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    todaysFamilies.value = await familyService.getFamiliesByReviewDay(selectedDay.value, memberStore.members)
  } catch (err) {
    error.value = 'Failed to load daily data'
    console.error('Error loading daily data:', err)
  } finally {
    isLoading.value = false
  }
}

const onDayChange = () => {
  loadDailyData()
}

const filteredTodoItems = (todoItems: TodoItem[]) => {
  if (showCompletedItems.value) {
    return todoItems
  }
  return todoItems.filter(item => !item.completed)
}

const toggleTodoItem = async (familyId: string, todoId: string) => {
  try {
    await familyService.toggleTodoItem(familyId, todoId)
    await loadDailyData() // Reload to get updated data
  } catch (err) {
    console.error('Error toggling todo item:', err)
  }
}

const addTodoItem = async () => {
  if (!selectedFamily.value) return
  
  isAddingTodo.value = true
  
  try {
          await familyService.addTodoItem(selectedFamily.value.id, {
        title: newTodo.value.title,
        category: newTodo.value.category || 'General',
        priority: newTodo.value.priority
      })
    
    // Reset form
    newTodo.value = {
      title: '',
      priority: 'medium',
      category: ''
    }
    
    showAddTodoModal.value = false
    selectedFamily.value = null
    
    // Reload families
    await loadDailyData()
  } catch (err) {
    console.error('Error adding todo item:', err)
  } finally {
    isAddingTodo.value = false
  }
}

const deleteTodoItem = async (familyId: string, todoId: string) => {
  if (!confirm('Are you sure you want to delete this todo item?')) return
  
  try {
    await familyService.deleteTodoItem(familyId, todoId)
    await loadDailyData()
  } catch (err) {
    console.error('Error deleting todo item:', err)
  }
}

// Birthday/Anniversary completion methods
const loadCompletedEvents = async () => {
  isLoadingCompletions.value = true
  try {
    const today = new Date()
    const monthKey = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`
    const completions = await birthdayAnniversaryService.loadMonthCompletions(monthKey)
    
    if (completions) {
      completedBirthdays.value = completions.birthdays
      completedAnniversaries.value = completions.anniversaries
    } else {
      completedBirthdays.value = []
      completedAnniversaries.value = []
    }
  } catch (err) {
    console.error('Error loading completed events:', err)
    completedBirthdays.value = []
    completedAnniversaries.value = []
  } finally {
    isLoadingCompletions.value = false
  }
}

const isBirthdayCompleted = (birthdayId: string) => {
  return completedBirthdays.value.includes(birthdayId)
}

const isAnniversaryCompleted = (anniversaryId: string) => {
  return completedAnniversaries.value.includes(anniversaryId)
}

const toggleBirthday = async (birthdayId: string) => {
  try {
    const today = new Date()
    const monthKey = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`
    
    let newBirthdays = [...completedBirthdays.value]
    if (isBirthdayCompleted(birthdayId)) {
      newBirthdays = newBirthdays.filter(id => id !== birthdayId)
    } else {
      newBirthdays.push(birthdayId)
    }
    
    await birthdayAnniversaryService.saveMonthCompletions(
      monthKey,
      newBirthdays,
      completedAnniversaries.value
    )
    
    completedBirthdays.value = newBirthdays
  } catch (err) {
    console.error('Error toggling birthday completion:', err)
  }
}

const toggleAnniversary = async (anniversaryId: string) => {
  try {
    const today = new Date()
    const monthKey = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`
    
    let newAnniversaries = [...completedAnniversaries.value]
    if (isAnniversaryCompleted(anniversaryId)) {
      newAnniversaries = newAnniversaries.filter(id => id !== anniversaryId)
    } else {
      newAnniversaries.push(anniversaryId)
    }
    
    await birthdayAnniversaryService.saveMonthCompletions(
      monthKey,
      completedBirthdays.value,
      newAnniversaries
    )
    
    completedAnniversaries.value = newAnniversaries
  } catch (err) {
    console.error('Error toggling anniversary completion:', err)
  }
}

const getFirstName = (fullName: string) => {
  // Handle "Last, First" format
  if (fullName.includes(',')) {
    const parts = fullName.split(',')
    return parts[1]?.trim() || fullName
  }
  // Handle "First Last" format
  return fullName.split(' ')[0]
}

const formatBirthday = (birthDate: string) => {
  const date = new Date(birthDate)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

const getAnniversaryYearsFromDate = (marriageDate: string) => {
  const date = new Date(marriageDate)
  const years = new Date().getFullYear() - date.getFullYear()
  return years
}

// Set initial day based on current day of week
const setInitialDay = () => {
  const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
  const dayMap: { [key: number]: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' } = {
    1: 'monday',
    2: 'tuesday', 
    3: 'wednesday',
    4: 'thursday',
    5: 'friday'
  }
  
  // If it's weekend, default to Monday
  selectedDay.value = dayMap[today] || 'monday'
}

// Lifecycle
onMounted(() => {
  setInitialDay()
  loadDailyData()
  loadCompletedEvents()
})

// Watch for member store changes
watch(() => memberStore.members, () => {
  loadDailyData()
}, { deep: true })
</script>

<style scoped>
.daily-dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2rem;
}

.day-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.day-selector label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.day-dropdown {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  color: #2c3e50;
  cursor: pointer;
  min-width: 150px;
}

.day-dropdown:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.section h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  background: #f8f9fa;
  border-radius: 8px;
}

/* Birthday Styles */
.birthday-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.birthday-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #e67e22;
  transition: all 0.2s;
}

.birthday-item.completed {
  opacity: 0.6;
  background: #d4edda;
  border-left-color: #28a745;
}

.birthday-icon {
  font-size: 1.5rem;
}

.birthday-info {
  flex: 1;
}

.birthday-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.birthday-details {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.birthday-age {
  color: #e67e22;
  font-weight: 500;
}

.birthday-household {
  color: #9b59b6;
}

/* Anniversary Styles */
.anniversary-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.anniversary-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #e74c3c;
  transition: all 0.2s;
}

.anniversary-item.completed {
  opacity: 0.6;
  background: #d4edda;
  border-left-color: #28a745;
}

.anniversary-icon {
  font-size: 1.5rem;
}

.anniversary-info {
  flex: 1;
}

.anniversary-names {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.member-name {
  font-weight: 600;
  color: #2c3e50;
  padding: 0.25rem 0.5rem;
  background: #e3f2fd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.anniversary-details {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.anniversary-years {
  color: #e74c3c;
  font-weight: 500;
}

.anniversary-household {
  color: #9b59b6;
}

/* Family Styles */
.families-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 2rem;
}

.family-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  transition: all 0.2s;
}

.family-card:hover {
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.family-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f8f9fa;
}

.family-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.review-day {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.review-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 500;
}

.review-day-value {
  font-size: 0.9rem;
  color: #3498db;
  font-weight: 600;
}

.family-name {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
}

.family-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #3498db;
}

.family-members {
  margin-bottom: 1.5rem;
}

.family-members h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.member-name {
  font-weight: 600;
  color: #2c3e50;
}

.member-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.member-age {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 500;
}

.member-birthday {
  font-size: 0.9rem;
  color: #e67e22;
  font-weight: 500;
}

.todo-section {
  border-top: 2px solid #f8f9fa;
  padding-top: 1.5rem;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.todo-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.empty-todos {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  background: #f8f9fa;
  border-radius: 8px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #ddd;
  transition: all 0.2s;
}

.todo-item.priority-high {
  border-left-color: #dc3545;
}

.todo-item.priority-medium {
  border-left-color: #ffc107;
}

.todo-item.priority-low {
  border-left-color: #6c757d;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.todo-description {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.todo-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
}

.todo-priority {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-high {
  background: #f8d7da;
  color: #721c24;
}

.priority-medium {
  background: #fff3cd;
  color: #856404;
}

.priority-low {
  background: #d1ecf1;
  color: #0c5460;
}

.todo-category {
  color: #6c757d;
  font-style: italic;
}

.todo-checkbox,
.birthday-checkbox,
.anniversary-checkbox {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.todo-checkbox input,
.birthday-checkbox input,
.anniversary-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.todo-checkbox .checkmark,
.birthday-checkbox .checkmark,
.anniversary-checkbox .checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #fff;
  border: 2px solid #ddd;
  border-radius: 4px;
  transition: all 0.2s;
}

.todo-checkbox:hover input ~ .checkmark,
.birthday-checkbox:hover input ~ .checkmark,
.anniversary-checkbox:hover input ~ .checkmark {
  border-color: #3498db;
}

.todo-checkbox input:checked ~ .checkmark,
.birthday-checkbox input:checked ~ .checkmark,
.anniversary-checkbox input:checked ~ .checkmark {
  background-color: #28a745;
  border-color: #28a745;
}

.todo-checkbox input:checked ~ .checkmark:after,
.birthday-checkbox input:checked ~ .checkmark:after,
.anniversary-checkbox input:checked ~ .checkmark:after {
  display: block;
}

.todo-checkbox .checkmark:after,
.birthday-checkbox .checkmark:after,
.anniversary-checkbox .checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.todo-item.completed {
  opacity: 0.6;
  background: #d4edda;
  border-left-color: #28a745;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
  padding: 0.5rem;
  font-size: 0.8rem;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

/* Mobile and Tablet Responsive Design */
@media (max-width: 1024px) {
  .daily-dashboard {
    padding: 1.5rem;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .day-selector {
    gap: 0.75rem;
  }
  
  .day-btn {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
  }
  
  .section {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .section h2 {
    font-size: 1.6rem;
  }
  
  .family-card {
    padding: 1.5rem;
  }
  
  .family-header h3 {
    font-size: 1.2rem;
  }
  
  .modal {
    margin: 2rem;
    padding: 2rem;
  }
}

@media (max-width: 768px) {
  .daily-dashboard {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .header h1 {
    font-size: 1.8rem;
    text-align: center;
  }
  
  .day-selector {
    justify-content: center;
    gap: 0.5rem;
  }
  
  .day-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
  
  .section {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .section h2 {
    font-size: 1.4rem;
    margin-bottom: 1rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .section-controls {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .checkbox-label {
    font-size: 0.85rem;
  }
  
  .family-card {
    padding: 1rem;
  }
  
  .family-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }
  
  .family-header h3 {
    font-size: 1.1rem;
  }
  
  .family-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .btn {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
  
  .btn-small {
    padding: 0.4rem 0.75rem;
    font-size: 0.75rem;
  }
  
  .members-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .member-item {
    padding: 0.5rem;
    font-size: 0.9rem;
  }
  
  .birthday-details,
  .anniversary-details {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .birthday-name,
  .anniversary-names {
    font-size: 0.9rem;
  }
  
  .birthday-age,
  .anniversary-years {
    font-size: 0.8rem;
  }
  
  .todo-section {
    margin-top: 1rem;
  }
  
  .todo-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }
  
  .todo-controls {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .todo-item {
    padding: 0.75rem;
  }
  
  .todo-content {
    gap: 0.5rem;
  }
  
  .todo-title {
    font-size: 0.9rem;
  }
  
  .todo-meta {
    font-size: 0.8rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .form-group label {
    font-size: 0.9rem;
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select {
    font-size: 0.9rem;
    padding: 0.6rem;
  }
  
  .modal {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .modal-header h2 {
    font-size: 1.3rem;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .modal-actions .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .daily-dashboard {
    padding: 0.75rem;
  }
  
  .header h1 {
    font-size: 1.5rem;
  }
  
  .day-selector {
    gap: 0.25rem;
  }
  
  .day-btn {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }
  
  .section {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .section h2 {
    font-size: 1.3rem;
    margin-bottom: 0.75rem;
  }
  
  .section-controls {
    gap: 0.4rem;
  }
  
  .checkbox-label {
    font-size: 0.8rem;
  }
  
  .family-card {
    padding: 0.75rem;
  }
  
  .family-header h3 {
    font-size: 1rem;
  }
  
  .btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
  
  .btn-small {
    padding: 0.3rem 0.5rem;
    font-size: 0.7rem;
  }
  
  .member-item {
    padding: 0.4rem;
    font-size: 0.85rem;
  }
  
  .birthday-name,
  .anniversary-names {
    font-size: 0.85rem;
  }
  
  .birthday-age,
  .anniversary-years {
    font-size: 0.75rem;
  }
  
  .todo-item {
    padding: 0.6rem;
  }
  
  .todo-title {
    font-size: 0.85rem;
  }
  
  .todo-meta {
    font-size: 0.75rem;
  }
  
  .form-group label {
    font-size: 0.85rem;
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select {
    font-size: 0.85rem;
    padding: 0.5rem;
  }
  
  .modal {
    margin: 0.5rem;
    padding: 1rem;
  }
  
  .modal-header h2 {
    font-size: 1.2rem;
  }
}
</style> 