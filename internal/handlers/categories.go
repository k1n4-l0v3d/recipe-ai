package handlers

import (
	"context"
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"
	"recipe-ai/internal/domain"
)

// RecipeGenerator is the interface handlers use — decouples them from the Groq client.
type RecipeGenerator interface {
	GenerateRecipeList(ctx context.Context, categoryName string) ([]domain.RecipeSummary, error)
	GenerateRecipe(ctx context.Context, dishName string) (*domain.Recipe, error)
}

// GetCategories returns the static list of recipe categories.
func GetCategories() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, domain.StaticCategories)
	}
}

// GetCategoryRecipes generates recipes for the given category via Groq.
func GetCategoryRecipes(gen RecipeGenerator) gin.HandlerFunc {
	return func(c *gin.Context) {
		categoryID := c.Param("id")

		// Find category name from ID
		categoryName := categoryID
		for _, cat := range domain.StaticCategories {
			if cat.ID == categoryID {
				categoryName = cat.Name
				break
			}
		}

		recipes, err := gen.GenerateRecipeList(c.Request.Context(), categoryName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Assign URL-safe IDs (base64 of the recipe name)
		for i := range recipes {
			recipes[i].ID = base64.URLEncoding.EncodeToString([]byte(recipes[i].Name))
		}

		c.JSON(http.StatusOK, recipes)
	}
}
