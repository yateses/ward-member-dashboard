<template>
  <div class="todo-item-editor">
    <div class="editor-header">
      <h4>{{ isEditing ? 'Edit' : 'Add' }} To-Do Item</h4>
      <button @click="$emit('close')" class="close-btn">×</button>
    </div>
    
    <form @submit.prevent="saveTodoItem" class="editor-form">
      <div class="form-group">
        <label for="title">Title *</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          placeholder="Enter to-do item title"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label for="category">Category *</label>
        <input
          id="category"
          v-model="form.category"
          type="text"
          required
          placeholder="Enter category (e.g., Visit, Call, Follow-up)"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label for="priority">Priority *</label>
        <select
          id="priority"
          v-model="form.priority"
          required
          class="form-select"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      
      <div class="form-actions">
        <button type="button" @click="$emit('close')" class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="!isValid">
          {{ isEditing ? 'Update' : 'Add' }} Item
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { TodoItem } from '../types/family'

interface Props {
  todoItem?: TodoItem
  familyId: string
}

interface Emits {
  (e: 'save', data: { title: string; category: string; priority: 'low' | 'medium' | 'high' }): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref({
  title: '',
  category: '',
  priority: 'medium' as 'low' | 'medium' | 'high'
})

const isEditing = computed(() => !!props.todoItem)

const isValid = computed(() => {
  return form.value.title.trim() && form.value.category.trim()
})

onMounted(() => {
  if (props.todoItem) {
    // Editing existing item
    form.value.title = props.todoItem.title
    form.value.category = props.todoItem.category
    form.value.priority = props.todoItem.priority
  }
})

const saveTodoItem = () => {
  if (!isValid.value) return
  
  emit('save', {
    title: form.value.title.trim(),
    category: form.value.category.trim(),
    priority: form.value.priority
  })
}
</script>

<style scoped>
.todo-item-editor {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.editor-header h4 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #2c3e50;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.form-input,
.form-select {
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3498db;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.btn:disabled {
  opacity: 0.5;
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
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}
</style> 