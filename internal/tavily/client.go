package tavily

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const defaultBaseURL = "https://api.tavily.com"

// SearchResult holds Tavily search output.
type SearchResult struct {
	URLs    []string
	Content string // concatenated content from all results for Groq context
}

// Client calls the Tavily Search API.
type Client struct {
	apiKey  string
	baseURL string
	http    *http.Client
}

// NewClient creates a Tavily client. Pass baseURL="" to use the default.
func NewClient(apiKey, baseURL string) *Client {
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	return &Client{
		apiKey:  apiKey,
		baseURL: baseURL,
		http:    &http.Client{Timeout: 15 * time.Second},
	}
}

type searchRequest struct {
	APIKey         string   `json:"api_key"`
	Query          string   `json:"query"`
	SearchDepth    string   `json:"search_depth"`
	MaxResults     int      `json:"max_results"`
	IncludeDomains []string `json:"include_domains,omitempty"`
}

type searchResponse struct {
	Results []struct {
		URL     string `json:"url"`
		Content string `json:"content"`
		Title   string `json:"title"`
	} `json:"results"`
}

// Search queries Tavily and returns aggregated results.
func (c *Client) Search(ctx context.Context, query string) (*SearchResult, error) {
	body, err := json.Marshal(searchRequest{
		APIKey:      c.apiKey,
		Query:       query,
		SearchDepth: "basic",
		MaxResults:  5,
	})
	if err != nil {
		return nil, fmt.Errorf("tavily: marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/search", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("tavily: create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("tavily: do request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tavily: unexpected status %d", resp.StatusCode)
	}

	var sr searchResponse
	if err := json.NewDecoder(resp.Body).Decode(&sr); err != nil {
		return nil, fmt.Errorf("tavily: decode response: %w", err)
	}

	result := &SearchResult{}
	var parts []string
	for _, r := range sr.Results {
		result.URLs = append(result.URLs, r.URL)
		parts = append(parts, fmt.Sprintf("Источник: %s\n%s", r.Title, r.Content))
	}
	result.Content = strings.Join(parts, "\n\n---\n\n")

	return result, nil
}
