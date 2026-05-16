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
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SSEEvent {
  type: 'token' | 'searching' | 'sources' | 'done' | 'error'
  content?: string
  sources?: string[]
}
