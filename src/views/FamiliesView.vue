<template>
  <div class="families-view">
    <div class="header">
      <h1>👨‍👩‍👧‍👦 Family Management</h1>
      <div class="header-actions">
        <button 
          @click="createFamiliesFromMembers" 
          class="btn btn-primary"
          :disabled="isCreatingFamilies"
        >
          {{ isCreatingFamilies ? 'Creating...' : 'Create Families from Members' }}
        </button>
        <button 
          @click="fixCorruptedFamilies" 
          class="btn btn-secondary"
          :disabled="isFixingFamilies"
        >
          {{ isFixingFamilies ? 'Fixing...' : 'Fix Corrupted Families' }}
        </button>
        <div class="view-controls">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="showCompletedItems"
            />
            <span class="checkmark"></span>
            Show completed items
          </label>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading families...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>⚠️ {{ error }}</p>
      <button @click="loadFamilies" class="btn btn-secondary">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="families.length === 0" class="empty-state">
      <div class="empty-icon">👨‍👩‍👧‍👦</div>
      <h3>No Families Found</h3>
      <p>Click "Create Families from Members" to automatically create family records from your member data.</p>
    </div>

    <!-- Families Grid -->
    <div v-else class="families-grid">
      <div 
        v-for="family in filteredFamilies" 
        :key="family.id"
        class="family-card"
      >
                 <!-- Family Header -->
         <div class="family-header">
           <div class="family-info">
             <h3 class="family-name">{{ family.headOfHousehold }}</h3>
             <div class="review-day">
               <span class="review-label">Review Day:</span>
               <select 
                 :value="family.reviewDay"
                 @change="updateReviewDay(family.id, $event.target.value)"
                 class="review-day-select"
               >
                 <option value="monday">Monday</option>
                 <option value="tuesday">Tuesday</option>
                 <option value="wednesday">Wednesday</option>
                 <option value="thursday">Thursday</option>
                 <option value="friday">Friday</option>
               </select>
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
              @click="openAddTodo(family)"
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
                  <span class="todo-category">
                    {{ todo.category }}
                  </span>
                  <span class="todo-date">
                    {{ formatDate(todo.createdAt) }}
                  </span>
                </div>
              </div>
              
              <div class="todo-actions">
                <button 
                  @click="openEditTodo(family, todo)"
                  class="btn btn-small btn-secondary"
                  title="Edit todo item"
                >
                  ✏️
                </button>
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

    <!-- Todo Item Editor Modal -->
    <div v-if="showTodoEditor" class="modal-overlay" @click="closeTodoEditor">
      <div class="modal" @click.stop>
        <TodoItemEditor
          :todo-item="editingTodoItem"
          :family-id="selectedFamily?.id || ''"
          @save="saveTodoItem"
          @close="closeTodoEditor"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMemberStore } from '../stores/memberStore'
import { familyService } from '../services/familyService'
import TodoItemEditor from '../components/TodoItemEditor.vue'
import type { FamilyWithMembers, TodoItem } from '../types/family'

const memberStore = useMemberStore()

// Reactive state
const families = ref<FamilyWithMembers[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const showCompletedItems = ref(false)
const isCreatingFamilies = ref(false)
const isFixingFamilies = ref(false)
const showTodoEditor = ref(false)
const selectedFamily = ref<FamilyWithMembers | null>(null)
const editingTodoItem = ref<TodoItem | undefined>(undefined)
const isAddingTodo = ref(false)

// Computed
const filteredFamilies = computed(() => {
  return families.value
})

// Methods
const loadFamilies = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    families.value = await familyService.getFamiliesWithMembers(memberStore.members)
  } catch (err) {
    error.value = 'Failed to load families'
    console.error('Error loading families:', err)
  } finally {
    isLoading.value = false
  }
}

const createFamiliesFromMembers = async () => {
  isCreatingFamilies.value = true
  
  try {
    await familyService.createFamiliesFromMembers(memberStore.members)
    await loadFamilies()
  } catch (err) {
    error.value = 'Failed to create families'
    console.error('Error creating families:', err)
  } finally {
    isCreatingFamilies.value = false
  }
}

const fixCorruptedFamilies = async () => {
  isFixingFamilies.value = true
  
  try {
    await familyService.fixCorruptedFamilies(memberStore.members)
    await loadFamilies()
  } catch (err) {
    error.value = 'Failed to fix corrupted families'
    console.error('Error fixing corrupted families:', err)
  } finally {
    isFixingFamilies.value = false
  }
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
    await loadFamilies() // Reload to get updated data
  } catch (err) {
    console.error('Error toggling todo item:', err)
  }
}

const openAddTodo = (family: FamilyWithMembers) => {
  selectedFamily.value = family
  editingTodoItem.value = undefined
  showTodoEditor.value = true
}

const openEditTodo = (family: FamilyWithMembers, todo: TodoItem) => {
  selectedFamily.value = family
  editingTodoItem.value = todo
  showTodoEditor.value = true
}

const closeTodoEditor = () => {
  showTodoEditor.value = false
  selectedFamily.value = null
  editingTodoItem.value = undefined
}

const saveTodoItem = async (data: { title: string; category: string; priority: 'low' | 'medium' | 'high' }) => {
  if (!selectedFamily.value) return
  
  isAddingTodo.value = true
  
  try {
    if (editingTodoItem.value) {
      // Update existing todo item
      await familyService.updateTodoItem(selectedFamily.value.id, editingTodoItem.value.id, {
        title: data.title,
        category: data.category,
        priority: data.priority
      })
    } else {
      // Add new todo item
      await familyService.addTodoItem(selectedFamily.value.id, {
        title: data.title,
        category: data.category,
        priority: data.priority
      })
    }
    
    closeTodoEditor()
    
    // Reload families
    await loadFamilies()
  } catch (err) {
    console.error('Error saving todo item:', err)
  } finally {
    isAddingTodo.value = false
  }
}

const deleteTodoItem = async (familyId: string, todoId: string) => {
  if (!confirm('Are you sure you want to delete this todo item?')) return
  
  try {
    await familyService.deleteTodoItem(familyId, todoId)
    await loadFamilies()
  } catch (err) {
    console.error('Error deleting todo item:', err)
  }
}

const updateReviewDay = async (familyId: string, newReviewDay: string) => {
  try {
    console.log(`🔄 Updating review day for family ${familyId} to ${newReviewDay}`)
    
    // Use the new service method that only updates the review day field
    await familyService.updateReviewDay(familyId, newReviewDay as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday')

    console.log('✅ Review day updated successfully')

    // Update the local state instead of reloading everything
    const familyIndex = families.value.findIndex(f => f.id === familyId)
    if (familyIndex !== -1) {
      families.value[familyIndex] = {
        ...families.value[familyIndex],
        reviewDay: newReviewDay as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
      }
    }
  } catch (err) {
    console.error('❌ Error updating review day:', err)
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

// Lifecycle
onMounted(() => {
  loadFamilies()
})
</script>

<style scoped>
.families-view {
  padding: 2rem;
  max-width: 1400px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #2c3e50;
}

.checkbox-label input {
  display: none;
}

.checkmark {
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-radius: 3px;
  position: relative;
  transition: all 0.2s;
}

.checkbox-label input:checked ~ .checkmark {
  background-color: #3498db;
  border-color: #3498db;
}

.checkbox-label input:checked ~ .checkmark:after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.loading-state,
.error-state,
.empty-state {
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

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

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

.review-day-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 0.85rem;
  color: #2c3e50;
  cursor: pointer;
}

.review-day-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
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

.todo-item.completed {
  opacity: 0.6;
  background: #d4edda;
  border-left-color: #28a745;
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

.todo-checkbox {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.todo-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.todo-checkbox .checkmark {
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

.todo-checkbox:hover input ~ .checkmark {
  border-color: #3498db;
}

.todo-checkbox input:checked ~ .checkmark {
  background-color: #28a745;
  border-color: #28a745;
}

.todo-checkbox input:checked ~ .checkmark:after {
  display: block;
}

.todo-checkbox .checkmark:after {
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

.todo-date {
  color: #7f8c8d;
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
  .families-view {
    padding: 1.5rem;
  }
  
  .header h1 {
    font-size: 1.8rem;
  }
  
  .families-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1rem;
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
  .families-view {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .header h1 {
    font-size: 1.6rem;
    text-align: center;
  }
  
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .view-controls {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .families-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
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
  
  .members-list {
    gap: 0.5rem;
  }
  
  .member-item {
    padding: 0.5rem;
    font-size: 0.9rem;
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
  .form-group select,
  .form-group textarea {
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
  .families-view {
    padding: 0.75rem;
  }
  
  .header h1 {
    font-size: 1.4rem;
  }
  
  .header-actions {
    gap: 0.5rem;
  }
  
  .view-controls {
    gap: 0.5rem;
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
  .form-group select,
  .form-group textarea {
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