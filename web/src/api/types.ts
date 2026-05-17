export interface Category {
  id: string
  name: string
  emoji: string
}

export interface RecipeSummary {
  id: string
  name: string
  description: string
  time: string
  difficulty: string
  tags: string[]
  image_keyword?: string
}

export interface Ingredient {
  name: string
  amount: string
}

export interface Recipe {
  id: string
  name: string
  cuisine: string
  time: string
  difficulty: string
  tags: string[]
  ingredients: Ingredient[]
  steps: string[]
  description: string
  sources: string[]
  image_keyword?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  created_at: string
}

export interface RecipePreview {
  recipe_id: string
  recipe_name: string
  image_keyword: string
  added_at?: string
  viewed_at?: string
}

export interface Note {
  recipe_id: string
  recipe_name: string
  content: string
  updated_at: string
}

export interface SSEEvent {
  type: 'token' | 'searching' | 'sources' | 'done' | 'error'
  content?: string
  sources?: string[]
}
