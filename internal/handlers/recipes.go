package handlers

import (
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetRecipe decodes the base64 recipe ID, generates the full recipe via Groq, and returns it.
func GetRecipe(gen RecipeGenerator) gin.HandlerFunc {
	return func(c *gin.Context) {
		encodedID := c.Param("id")

		nameBytes, err := base64.URLEncoding.DecodeString(encodedID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid recipe id"})
			return
		}

		recipe, err := gen.GenerateRecipe(c.Request.Context(), string(nameBytes))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		recipe.ID = encodedID
		c.JSON(http.StatusOK, recipe)
	}
}
