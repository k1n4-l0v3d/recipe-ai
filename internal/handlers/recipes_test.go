package handlers_test

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"recipe-ai/internal/domain"
	"recipe-ai/internal/handlers"
)

type mockRecipeDetailGenerator struct {
	recipe *domain.Recipe
	err    error
}

func (m *mockRecipeDetailGenerator) GenerateRecipeList(_ context.Context, _ string) ([]domain.RecipeSummary, error) {
	return nil, nil
}

func (m *mockRecipeDetailGenerator) GenerateRecipeListExcluding(_ context.Context, _ string, _ []string) ([]domain.RecipeSummary, error) {
	return nil, nil
}

func (m *mockRecipeDetailGenerator) GenerateRecipe(_ context.Context, _ string) (*domain.Recipe, error) {
	return m.recipe, m.err
}

func TestGetRecipe(t *testing.T) {
	gin.SetMode(gin.TestMode)

	expected := &domain.Recipe{
		Name:        "Борщ",
		Cuisine:     "Украинская",
		Time:        "1 час",
		Difficulty:  "Средне",
		Tags:        []string{"суп"},
		Ingredients: []domain.Ingredient{{Name: "Свекла", Amount: "300г"}},
		Steps:       []string{"Нарезать свеклу"},
		Description: "Классический борщ",
	}
	mock := &mockRecipeDetailGenerator{recipe: expected}

	router := gin.New()
	router.GET("/api/recipes/:id", handlers.GetRecipe(mock))

	id := base64.RawURLEncoding.EncodeToString([]byte("Борщ"))
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/recipes/"+id, nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var recipe domain.Recipe
	json.NewDecoder(w.Body).Decode(&recipe)
	if recipe.Name != "Борщ" {
		t.Errorf("unexpected name: %s", recipe.Name)
	}
}
