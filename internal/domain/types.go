package domain

// Category is a recipe category shown on the home page.
type Category struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Emoji string `json:"emoji"`
}

// RecipeSummary is a brief recipe entry in a category list.
type RecipeSummary struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Time         string   `json:"time"`
	Difficulty   string   `json:"difficulty"`
	Tags         []string `json:"tags"`
	ImageKeyword string   `json:"image_keyword,omitempty"`
}

// Ingredient is a single ingredient with amount.
type Ingredient struct {
	Name   string `json:"name"`
	Amount string `json:"amount"`
}

// Recipe is a full recipe with all details.
type Recipe struct {
	ID           string       `json:"id"`
	Name         string       `json:"name"`
	Cuisine      string       `json:"cuisine"`
	Time         string       `json:"time"`
	Difficulty   string       `json:"difficulty"`
	Tags         []string     `json:"tags"`
	Ingredients  []Ingredient `json:"ingredients"`
	Steps        []string     `json:"steps"`
	Description  string       `json:"description"`
	Sources      []string     `json:"sources"`
	ImageKeyword string       `json:"image_keyword,omitempty"`
}

// ChatMessage is one message in a conversation.
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatRequest is the body sent to POST /api/chat.
type ChatRequest struct {
	Messages      []ChatMessage `json:"messages"`
	RecipeContext string        `json:"recipe_context"`
}

// SSEEvent is a single server-sent event payload.
type SSEEvent struct {
	Type    string   `json:"type"`
	Content string   `json:"content,omitempty"`
	Sources []string `json:"sources,omitempty"`
}

// StaticCategories are the fixed categories shown on the home page.
var StaticCategories = []Category{
	{ID: "soups", Name: "Супы", Emoji: "🍲"},
	{ID: "pasta", Name: "Паста", Emoji: "🍝"},
	{ID: "salads", Name: "Салаты", Emoji: "🥗"},
	{ID: "meat", Name: "Мясо", Emoji: "🥩"},
	{ID: "fish", Name: "Рыба", Emoji: "🐟"},
	{ID: "desserts", Name: "Десерты", Emoji: "🍰"},
	{ID: "baking", Name: "Выпечка", Emoji: "🥐"},
	{ID: "breakfast", Name: "Завтраки", Emoji: "🍳"},
}
