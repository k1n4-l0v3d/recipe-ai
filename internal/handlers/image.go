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

type pexelsResponse struct {
	Photos []struct {
		Src struct {
			Medium string `json:"medium"`
			Large  string `json:"large"`
		} `json:"src"`
	} `json:"photos"`
}

// ImageProxy searches Pexels for a food image and redirects to it.
// GET /api/image?q=beef+stroganoff
func ImageProxy(pexelsKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		query := c.Query("q")
		if query == "" {
			c.Status(http.StatusBadRequest)
			return
		}

		if pexelsKey == "" {
			c.Status(http.StatusServiceUnavailable)
			return
		}

		apiURL := fmt.Sprintf(
			"https://api.pexels.com/v1/search?query=%s+food&per_page=1&orientation=landscape",
			url.QueryEscape(query),
		)

		req, err := http.NewRequest(http.MethodGet, apiURL, nil)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}
		req.Header.Set("Authorization", pexelsKey)

		resp, err := imageHTTPClient.Do(req)
		if err != nil || resp.StatusCode != http.StatusOK {
			c.Status(http.StatusNotFound)
			return
		}
		defer resp.Body.Close()

		var result pexelsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil || len(result.Photos) == 0 {
			c.Status(http.StatusNotFound)
			return
		}

		imgURL := result.Photos[0].Src.Medium
		c.Header("Cache-Control", "public, max-age=86400")
		c.Redirect(http.StatusFound, imgURL)
	}
}
