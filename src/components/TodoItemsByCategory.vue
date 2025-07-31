<template>
  <div class="todo-items-by-category">
    <div class="section-header">
      <h3>📋 To-Do Items by Category</h3>
      <div class="controls">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            v-model="showCompleted"
            @change="loadTodoItems"
          />
          Show completed items
        </label>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading to-do items...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else-if="categories.length === 0" class="empty-state">
      <p>No to-do items found. Add some to-do items to families to see them here.</p>
    </div>
    
    <div v-else class="categories-grid">
      <div 
        v-for="category in categories" 
        :key="category.category"
        class="category-card"
      >
        <div class="category-header">
          <h4>{{ category.category }}</h4>
          <span class="item-count">{{ category.items.length }} items</span>
        </div>
        
        <div class="todo-list">
          <div 
            v-for="item in category.items" 
            :key="item.id"
            class="todo-item"
            :class="{ 
              'completed': item.completed,
              'priority-high': item.priority === 'high',
              'priority-medium': item.priority === 'medium',
              'priority-low': item.priority === 'low'
            }"
          >
            <div class="todo-content">
              <div class="todo-header">
                <span class="todo-title">{{ item.title }}</span>
                <div class="todo-meta">
                  <span class="priority-badge" :class="`priority-${item.priority}`">
                    {{ item.priority }}
                  </span>
                  <span class="family-name">{{ item.familyName }}</span>
                </div>
              </div>
            </div>
            
            <div class="todo-actions">
              <button 
                @click="toggleTodoItem(item.familyId, item.id)"
                class="action-btn toggle-btn"
                :title="item.completed ? 'Mark as incomplete' : 'Mark as complete'"
              >
                {{ item.completed ? '✓' : '○' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { familyService } from '../services/familyService'
import { MemberService } from '../services/memberService'

const categories = ref<Array<{
  category: string
  items: Array<{
    id: string
    title: string
    priority: 'low' | 'medium' | 'high'
    completed: boolean
    familyName: string
    familyId: string
  }>
}>>([])

const loading = ref(false)
const error = ref<string | null>(null)
const showCompleted = ref(false)

const loadTodoItems = async () => {
  try {
    loading.value = true
    error.value = null
    
    const allMembers = await MemberService.getAllMembers()
    let todoData = await familyService.getTodoItemsByCategory(allMembers)
    
    // Filter out completed items if not showing them
    if (!showCompleted.value) {
      todoData = todoData.map(category => ({
        ...category,
        items: category.items.filter(item => !item.completed)
      })).filter(category => category.items.length > 0)
    }
    
    categories.value = todoData
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load to-do items'
    console.error('Error loading to-do items:', err)
  } finally {
    loading.value = false
  }
}

const toggleTodoItem = async (familyId: string, todoId: string) => {
  try {
    await familyService.toggleTodoItem(familyId, todoId)
    // Reload the data to reflect the change
    await loadTodoItems()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update to-do item'
    console.error('Error toggling to-do item:', err)
  }
}

onMounted(() => {
  loadTodoItems()
})
</script>

<style scoped>
.todo-items-by-category {
  margin: 2rem 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  margin: 0;
  color: #2c3e50;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #6c757d;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.category-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.category-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.item-count {
  background: #e9ecef;
  color: #6c757d;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #f8f9fa;
  transition: all 0.2s;
}

.todo-item:hover {
  border-color: #3498db;
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.1);
}

.todo-item.completed {
  opacity: 0.6;
  background: #e8f5e8;
  border-color: #4caf50;
}

.todo-item.priority-high {
  border-left: 4px solid #e74c3c;
}

.todo-item.priority-medium {
  border-left: 4px solid #f39c12;
}

.todo-item.priority-low {
  border-left: 4px solid #27ae60;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.todo-title {
  font-weight: 600;
  color: #2c3e50;
  word-break: break-word;
}

.todo-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.priority-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge.priority-high {
  background: #fdeaea;
  color: #e74c3c;
}

.priority-badge.priority-medium {
  background: #fef5e7;
  color: #f39c12;
}

.priority-badge.priority-low {
  background: #e8f5e8;
  color: #27ae60;
}

.family-name {
  font-size: 0.8rem;
  color: #6c757d;
  font-style: italic;
}

.todo-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 1rem;
}

.toggle-btn {
  color: #6c757d;
  font-weight: bold;
}

.toggle-btn:hover {
  background: #e9ecef;
  color: #2c3e50;
}

@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .todo-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style> 