package handlers_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"recipe-ai/internal/domain"
	"recipe-ai/internal/handlers"
)

type mockRecipeGenerator struct {
	list []domain.RecipeSummary
	err  error
}

func (m *mockRecipeGenerator) GenerateRecipeList(_ context.Context, _ string) ([]domain.RecipeSummary, error) {
	return m.list, m.err
}

func (m *mockRecipeGenerator) GenerateRecipeListExcluding(_ context.Context, _ string, _ []string) ([]domain.RecipeSummary, error) {
	return m.list, m.err
}

func (m *mockRecipeGenerator) GenerateRecipe(_ context.Context, _ string) (*domain.Recipe, error) {
	return nil, nil
}

func TestGetCategories(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mock := &mockRecipeGenerator{}
	router := gin.New()
	router.GET("/api/categories", handlers.GetCategories())

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/categories", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var categories []domain.Category
	json.NewDecoder(w.Body).Decode(&categories)
	if len(categories) != 8 {
		t.Errorf("expected 8 categories, got %d", len(categories))
	}
	_ = mock
}

func TestGetCategoryRecipes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mock := &mockRecipeGenerator{
		list: []domain.RecipeSummary{
			{ID: "abc", Name: "Борщ", Description: "Суп", Time: "1ч", Difficulty: "Средне", Tags: []string{"суп"}},
		},
	}

	router := gin.New()
	router.GET("/api/categories/:id", handlers.GetCategoryRecipes(mock))

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/categories/soups", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	var recipes []domain.RecipeSummary
	json.NewDecoder(w.Body).Decode(&recipes)
	if len(recipes) != 1 {
		t.Errorf("expected 1 recipe, got %d", len(recipes))
	}
}
