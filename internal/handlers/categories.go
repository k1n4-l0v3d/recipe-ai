package handlers

import (
	"context"
	"encoding/base64"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"recipe-ai/internal/domain"
)

// RecipeGenerator is the interface handlers use — decouples them from the Groq client.
type RecipeGenerator interface {
	GenerateRecipeList(ctx context.Context, categoryName string) ([]domain.RecipeSummary, error)
	GenerateRecipeListExcluding(ctx context.Context, categoryName string, exclude []string) ([]domain.RecipeSummary, error)
	GenerateRecipe(ctx context.Context, dishName string) (*domain.Recipe, error)
}

// GetCategories returns the static list of recipe categories.
func GetCategories() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, domain.StaticCategories)
	}
}

// GetCategoryRecipes generates recipes for the given category via Groq.
// Accepts optional ?exclude=Name1,Name2 to avoid repeating shown recipes.
func GetCategoryRecipes(gen RecipeGenerator) gin.HandlerFunc {
	return func(c *gin.Context) {
		categoryID := c.Param("id")

		// Find category name from ID — return 404 for unknown categories.
		categoryName := ""
		for _, cat := range domain.StaticCategories {
			if cat.ID == categoryID {
				categoryName = cat.Name
				break
			}
		}
		if categoryName == "" {
			c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
			return
		}

		// Parse optional exclude list.
		var exclude []string
		if raw := c.Query("exclude"); raw != "" {
			for _, name := range strings.Split(raw, ",") {
				if name = strings.TrimSpace(name); name != "" {
					exclude = append(exclude, name)
				}
			}
		}

		recipes, err := gen.GenerateRecipeListExcluding(c.Request.Context(), categoryName, exclude)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Assign URL-safe IDs (raw base64, no padding — matches frontend encodeRecipeId).
		for i := range recipes {
			recipes[i].ID = base64.RawURLEncoding.EncodeToString([]byte(recipes[i].Name))
		}

		c.JSON(http.StatusOK, recipes)
	}
}
