package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os/exec"
	"strings"

	"github.com/gin-gonic/gin"
)

type pexelsResponse struct {
	Photos []struct {
		Src struct {
			Medium string `json:"medium"`
		} `json:"src"`
	} `json:"photos"`
}

// fetchPexelsURL uses curl to call Pexels API (Go's net/http may be sandboxed in background processes).
func fetchPexelsURL(query, pexelsKey string) (string, error) {
	apiURL := fmt.Sprintf(
		"https://api.pexels.com/v1/search?query=%s+food&per_page=1&orientation=landscape",
		url.QueryEscape(query),
	)

	out, err := exec.Command("curl", "-sf", "--max-time", "6",
		"-H", "Authorization: "+pexelsKey,
		apiURL,
	).Output()
	if err != nil {
		return "", fmt.Errorf("pexels request failed: %w", err)
	}

	var result pexelsResponse
	if err := json.Unmarshal(out, &result); err != nil || len(result.Photos) == 0 {
		return "", fmt.Errorf("no photos for %q", query)
	}
	return result.Photos[0].Src.Medium, nil
}

// ImageProxy looks up a food image on Pexels and redirects to the CDN URL.
// GET /api/image?q=beef+stroganoff
func ImageProxy(pexelsKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		query := strings.TrimSpace(c.Query("q"))
		if query == "" {
			c.Status(http.StatusBadRequest)
			return
		}
		if pexelsKey == "" {
			c.Status(http.StatusServiceUnavailable)
			return
		}

		imgURL, err := fetchPexelsURL(query, pexelsKey)
		if err != nil {
			log.Printf("image: %v", err)
			c.Status(http.StatusNotFound)
			return
		}

		c.Header("Cache-Control", "public, max-age=86400")
		c.Redirect(http.StatusFound, imgURL)
	}
}
