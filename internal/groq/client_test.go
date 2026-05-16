package groq_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"recipe-ai/internal/domain"
	"recipe-ai/internal/groq"
)

func makeGroqServer(response map[string]any) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
}

func TestGenerateRecipeList(t *testing.T) {
	recipes := []map[string]any{
		{"name": "Борщ", "description": "Классический суп", "time": "1 час", "difficulty": "Средне", "tags": []string{"суп"}},
	}
	recipeJSON, _ := json.Marshal(recipes)

	srv := makeGroqServer(map[string]any{
		"choices": []map[string]any{
			{"message": map[string]any{"role": "assistant", "content": string(recipeJSON)}},
		},
	})
	defer srv.Close()

	client := groq.NewClient("test-key", srv.URL)
	list, err := client.GenerateRecipeList(context.Background(), "Супы")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(list) != 1 {
		t.Errorf("expected 1 recipe, got %d", len(list))
	}
	if list[0].Name != "Борщ" {
		t.Errorf("unexpected name: %s", list[0].Name)
	}
}

func TestGenerateRecipe(t *testing.T) {
	recipe := map[string]any{
		"name":        "Борщ",
		"cuisine":     "Украинская",
		"time":        "1 час",
		"difficulty":  "Средне",
		"description": "Классический борщ",
		"tags":        []string{"суп"},
		"ingredients": []map[string]any{{"name": "Свекла", "amount": "300г"}},
		"steps":       []string{"Шаг 1: Нарезать свеклу"},
	}
	recipeJSON, _ := json.Marshal(recipe)

	srv := makeGroqServer(map[string]any{
		"choices": []map[string]any{
			{"message": map[string]any{"role": "assistant", "content": string(recipeJSON)}},
		},
	})
	defer srv.Close()

	client := groq.NewClient("test-key", srv.URL)
	r, err := client.GenerateRecipe(context.Background(), "Борщ")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if r.Name != "Борщ" {
		t.Errorf("unexpected name: %s", r.Name)
	}
	if len(r.Ingredients) != 1 {
		t.Errorf("expected 1 ingredient, got %d", len(r.Ingredients))
	}
}

func TestChatNoToolUse(t *testing.T) {
	srv := makeGroqServer(map[string]any{
		"choices": []map[string]any{
			{"message": map[string]any{"role": "assistant", "content": "Можно заменить шафран куркумой"}},
		},
	})
	defer srv.Close()

	client := groq.NewClient("test-key", srv.URL)
	msgs := []domain.ChatMessage{{Role: "user", Content: "Чем заменить шафран?"}}
	resp, err := client.Chat(context.Background(), msgs, "")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.ToolCallID != "" {
		t.Error("expected no tool call")
	}
	if resp.Content == "" {
		t.Error("expected non-empty content")
	}
}
