package main

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	openai "github.com/sashabaranov/go-openai"
	"recipe-ai/internal/auth"
	"recipe-ai/internal/config"
	"recipe-ai/internal/db"
	"recipe-ai/internal/domain"
	"recipe-ai/internal/groq"
	"recipe-ai/internal/handlers"
	"recipe-ai/internal/tavily"
)

// --- Adapters ---

type recipeGenAdapter struct{ c *groq.Client }

func (a *recipeGenAdapter) GenerateRecipeList(ctx context.Context, name string) ([]domain.RecipeSummary, error) {
	return a.c.GenerateRecipeList(ctx, name)
}
func (a *recipeGenAdapter) GenerateRecipeListExcluding(ctx context.Context, name string, exclude []string) ([]domain.RecipeSummary, error) {
	return a.c.GenerateRecipeListExcluding(ctx, name, exclude)
}
func (a *recipeGenAdapter) GenerateRecipe(ctx context.Context, name string) (*domain.Recipe, error) {
	return a.c.GenerateRecipe(ctx, name)
}

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

type tavilyAdapter struct{ c *tavily.Client }

func (a *tavilyAdapter) Search(ctx context.Context, query string) (*handlers.TavilySearchResult, error) {
	r, err := a.c.Search(ctx, query)
	if err != nil {
		return nil, err
	}
	return &handlers.TavilySearchResult{URLs: r.URLs, Content: r.Content}, nil
}

// --- Main ---

func main() {
	cfg := config.Load()
	if cfg.GroqAPIKey == "" {
		log.Fatal("GROQ_API_KEY is required")
	}
	if cfg.TavilyAPIKey == "" {
		log.Fatal("TAVILY_API_KEY is required")
	}

	// Database (optional — graceful degradation if DATABASE_URL not set)
	var database *db.DB
	if cfg.DatabaseURL != "" {
		var err error
		database, err = db.New(context.Background(), cfg.DatabaseURL)
		if err != nil {
			log.Fatalf("failed to connect to database: %v", err)
		}
		defer database.Close()

		if err := database.Migrate(context.Background(), "./migrations"); err != nil {
			log.Fatalf("failed to run migrations: %v", err)
		}
		log.Println("Database connected and migrations applied")
	} else {
		log.Println("DATABASE_URL not set — auth features disabled")
	}

	groqClient := groq.NewClient(cfg.GroqAPIKey, "")
	tavilyClient := tavily.NewClient(cfg.TavilyAPIKey, "")

	router := gin.Default()

	apiGroup := router.Group("/api")
	{
		// Auth routes (only when DB is available)
		if database != nil {
			authHandler := handlers.NewAuthHandler(database)
			authGroup := apiGroup.Group("/auth")
			{
				authGroup.POST("/register", authHandler.Register)
				authGroup.POST("/login", authHandler.Login)
				authGroup.POST("/logout", authHandler.Logout)
				authGroup.GET("/me", authHandler.Me)
			}

			// Cabinet routes (all require auth)
			cabinetHandler := handlers.NewCabinetHandler(database)
			cabinetAuth := apiGroup.Group("")
			cabinetAuth.Use(auth.RequireAuth(database))
			{
				cabinetAuth.PUT("/profile/name", cabinetHandler.UpdateName)
				cabinetAuth.PUT("/profile/password", cabinetHandler.UpdatePassword)

				cabinetAuth.GET("/favorites", cabinetHandler.GetFavorites)
				cabinetAuth.POST("/favorites", cabinetHandler.AddFavorite)
				cabinetAuth.DELETE("/favorites/:id", cabinetHandler.RemoveFavorite)
				cabinetAuth.GET("/favorites/:id/check", cabinetHandler.CheckFavorite)

				cabinetAuth.GET("/history", cabinetHandler.GetHistory)
				cabinetAuth.POST("/history", cabinetHandler.AddHistory)
				cabinetAuth.DELETE("/history", cabinetHandler.ClearHistory)

				cabinetAuth.GET("/notes", cabinetHandler.GetAllNotes)
				cabinetAuth.GET("/notes/:recipe_id", cabinetHandler.GetNote)
				cabinetAuth.PUT("/notes/:recipe_id", cabinetHandler.UpsertNote)
				cabinetAuth.DELETE("/notes/:recipe_id", cabinetHandler.DeleteNote)
			}

			// Admin routes (require admin role)
			adminHandler := handlers.NewAdminHandler(database)
			adminGroup := apiGroup.Group("/admin")
			adminGroup.Use(auth.RequireAdmin(database))
			{
				adminGroup.GET("/stats", adminHandler.GetStats)
				adminGroup.GET("/users", adminHandler.GetUsers)
				adminGroup.PUT("/users/:id/role", adminHandler.SetRole)
				adminGroup.PUT("/users/:id/ban", adminHandler.SetBan)
				adminGroup.GET("/sessions", adminHandler.GetSessions)
				adminGroup.DELETE("/sessions/:id", adminHandler.TerminateSession)
			}
		}

		// Recipe routes
		apiGroup.GET("/categories", handlers.GetCategories())
		apiGroup.GET("/categories/:id", handlers.GetCategoryRecipes(&recipeGenAdapter{groqClient}))
		apiGroup.GET("/recipes/combo", handlers.GetComboRecipes(&recipeGenAdapter{groqClient}))
		apiGroup.GET("/recipes/:id", handlers.GetRecipe(&recipeGenAdapter{groqClient}))
		apiGroup.POST("/chat", handlers.ChatSSE(&chatGroqAdapter{groqClient}, &tavilyAdapter{tavilyClient}))
		apiGroup.GET("/image", handlers.ImageProxy(cfg.PexelsAPIKey))
	}

	router.Static("/assets", "./web/dist/assets")
	router.StaticFile("/favicon.ico", "./web/dist/favicon.ico")

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
