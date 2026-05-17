package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
)

var imageHTTPClient = &http.Client{Timeout: 8 * time.Second}

type mealDBResponse struct {
	Meals []struct {
		Thumb string `json:"strMealThumb"`
	} `json:"meals"`
}

// ImageProxy searches TheMealDB for a food image and redirects to it.
// GET /api/image?q=pasta+carbonara
func ImageProxy() gin.HandlerFunc {
	return func(c *gin.Context) {
		query := c.Query("q")
		if query == "" {
			c.Status(http.StatusBadRequest)
			return
		}

		apiURL := fmt.Sprintf(
			"https://www.themealdb.com/api/json/v1/1/search.php?s=%s",
			url.QueryEscape(query),
		)

		resp, err := imageHTTPClient.Get(apiURL)
		if err != nil || resp.StatusCode != http.StatusOK {
			c.Status(http.StatusNotFound)
			return
		}
		defer resp.Body.Close()

		var result mealDBResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil || len(result.Meals) == 0 {
			// Fallback: search with first word only
			if idx := len(query); idx > 0 {
				for i, ch := range query {
					if ch == ' ' {
						idx = i
						break
					}
				}
				fallbackURL := fmt.Sprintf(
					"https://www.themealdb.com/api/json/v1/1/search.php?s=%s",
					url.QueryEscape(query[:idx]),
				)
				resp2, err2 := imageHTTPClient.Get(fallbackURL)
				if err2 == nil && resp2.StatusCode == http.StatusOK {
					defer resp2.Body.Close()
					var result2 mealDBResponse
					if json.NewDecoder(resp2.Body).Decode(&result2) == nil && len(result2.Meals) > 0 {
						c.Header("Cache-Control", "public, max-age=86400")
						c.Redirect(http.StatusFound, result2.Meals[0].Thumb)
						return
					}
				}
			}
			c.Status(http.StatusNotFound)
			return
		}

		c.Header("Cache-Control", "public, max-age=86400")
		c.Redirect(http.StatusFound, result.Meals[0].Thumb)
	}
}
