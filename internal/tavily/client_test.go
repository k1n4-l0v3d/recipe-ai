package tavily_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"recipe-ai/internal/tavily"
)

func TestSearch(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"results": []map[string]any{
				{"url": "https://eda.ru/recipe/1", "content": "Рецепт борща...", "title": "Борщ"},
				{"url": "https://cooking.ru/recipe/2", "content": "Украинский борщ...", "title": "Борщ украинский"},
			},
		})
	}))
	defer srv.Close()

	client := tavily.NewClient("test-key", srv.URL)
	result, err := client.Search(context.Background(), "рецепт борща")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.URLs) != 2 {
		t.Errorf("expected 2 URLs, got %d", len(result.URLs))
	}
	if result.URLs[0] != "https://eda.ru/recipe/1" {
		t.Errorf("unexpected URL: %s", result.URLs[0])
	}
	if !strings.Contains(result.Content, "Борщ") {
		t.Errorf("expected content to contain title 'Борщ', got: %s", result.Content)
	}
	if !strings.Contains(result.Content, "---") {
		t.Error("expected content to contain '---' separator between results")
	}
}

func TestSearchNon200(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer srv.Close()

	client := tavily.NewClient("test-key", srv.URL)
	_, err := client.Search(context.Background(), "query")
	if err == nil {
		t.Error("expected error on non-200 response")
	}
}
