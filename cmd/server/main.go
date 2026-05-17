package main

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	openai "github.com/sashabaranov/go-openai"
	"recipe-ai/internal/config"
	"recipe-ai/internal/domain"
	"recipe-ai/internal/groq"
	"recipe-ai/internal/handlers"
	"recipe-ai/internal/tavily"
)

// recipeGenAdapter bridges groq.Client to handlers.RecipeGenerator.
type recipeGenAdapter struct{ c *groq.Client }

func (a *recipeGenAdapter) GenerateRecipeList(ctx context.Context, name string) ([]domain.RecipeSummary, error) {
	return a.c.GenerateRecipeList(ctx, name)
}
func (a *recipeGenAdapter) GenerateRecipe(ctx context.Context, name string) (*domain.Recipe, error) {
	return a.c.GenerateRecipe(ctx, name)
}

// chatGroqAdapter bridges groq.Client to handlers.GroqChatter + handlers.GroqStreamer.
type chatGroqAdapter struct{ c *groq.Client }

func (a *chatGroqAdapter) Chat(ctx context.Context, msgs []domain.ChatMessage, recipeCtx string) (*handlers.GroqChatResponse, error) {
	resp, err := a.c.Chat(ctx, msgs, recipeCtx)
	if err != nil {
		return nil, err
	}
	return &handlers.GroqChatResponse{
		Content:    resp.Content,
		ToolCallID: resp.ToolCallID,
		ToolQuery:  resp.ToolQuery,
	}, nil
}

func (a *chatGroqAdapter) BuildMessagesForStream(msgs []domain.ChatMessage, recipeCtx, toolCallID, assistantContent, toolResult string) []openai.ChatCompletionMessage {
	return a.c.BuildMessagesForStream(msgs, recipeCtx, toolCallID, assistantContent, toolResult)
}

func (a *chatGroqAdapter) StreamChatWithContext(ctx context.Context, msgs []openai.ChatCompletionMessage) (*openai.ChatCompletionStream, error) {
	return a.c.StreamChatWithContext(ctx, msgs)
}

// tavilyAdapter bridges tavily.Client to handlers.TavilySearcher.
type tavilyAdapter struct{ c *tavily.Client }

func (a *tavilyAdapter) Search(ctx context.Context, query string) (*handlers.TavilySearchResult, error) {
	r, err := a.c.Search(ctx, query)
	if err != nil {
		return nil, err
	}
	return &handlers.TavilySearchResult{URLs: r.URLs, Content: r.Content}, nil
}

func main() {
	cfg := config.Load()
	if cfg.GroqAPIKey == "" {
		log.Fatal("GROQ_API_KEY is required")
	}
	if cfg.TavilyAPIKey == "" {
		log.Fatal("TAVILY_API_KEY is required")
	}

	groqClient := groq.NewClient(cfg.GroqAPIKey, "")
	tavilyClient := tavily.NewClient(cfg.TavilyAPIKey, "")

	router := gin.Default()

	api := router.Group("/api")
	{
		api.GET("/categories", handlers.GetCategories())
		api.GET("/categories/:id", handlers.GetCategoryRecipes(&recipeGenAdapter{groqClient}))
		api.GET("/recipes/:id", handlers.GetRecipe(&recipeGenAdapter{groqClient}))
		api.POST("/chat", handlers.ChatSSE(&chatGroqAdapter{groqClient}, &tavilyAdapter{tavilyClient}))
		api.GET("/image", handlers.ImageProxy())
	}

	// Serve static assets from the React build.
	router.Static("/assets", "./web/dist/assets")
	router.StaticFile("/favicon.ico", "./web/dist/favicon.ico")

	// SPA fallback: serve index.html for all non-API routes.
	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api") {
			c.Status(http.StatusNotFound)
			return
		}
		c.File("./web/dist/index.html")
	})

	log.Printf("Server starting on :%s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
