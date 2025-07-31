export interface TodoItem {
  id: string
  title: string
  category: string
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  createdAt: Date
  completedAt?: Date
}

export interface Family {
  id: string
  headOfHousehold: string
  members: string[] // Member IDs
  todoItems: TodoItem[]
  reviewDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
  notes?: string
  lastUpdated: Date
}

export interface FamilyWithMembers {
  id: string
  headOfHousehold: string
  members: Array<{
    id: string
    preferredName: string
    birthDate: string
    age: number
    addressStreet1?: string
    individualPhone?: string
    individualEmail?: string
  }>
  todoItems: TodoItem[]
  reviewDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
  notes?: string
  lastUpdated: Date
  address?: string // Computed address from members
} 