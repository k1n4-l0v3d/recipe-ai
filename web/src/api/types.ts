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
  is_banned: boolean
  created_at: string
}

export interface AdminStats {
  total_users: number
  active_sessions: number
  total_favorites: number
  new_users_week: number
}

export interface SessionInfo {
  id: string
  user_id: string
  user_name: string
  user_email: string
  created_at: string
  expires_at: string
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
