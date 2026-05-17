package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"recipe-ai/internal/db"
)

// RequireAuth is a Gin middleware that validates the session cookie.
// On success it stores the user as "user" in the Gin context.
func RequireAuth(database *db.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID, err := c.Cookie("session_id")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "не авторизован"})
			return
		}

		user, err := database.GetUserBySession(c.Request.Context(), sessionID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "сессия истекла"})
			return
		}

		c.Set("user", user)
		c.Next()
	}
}
