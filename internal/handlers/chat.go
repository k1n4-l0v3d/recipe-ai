package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	openai "github.com/sashabaranov/go-openai"
	"recipe-ai/internal/domain"
)

// GroqChatResponse is the result returned by the Groq chat interface.
type GroqChatResponse struct {
	Content    string
	ToolCallID string
	ToolQuery  string
}

// TavilySearchResult is the result returned by the Tavily search interface.
type TavilySearchResult struct {
	URLs    []string
	Content string
}

// GroqChatter is the chat interface used by the handler.
type GroqChatter interface {
	Chat(ctx context.Context, msgs []domain.ChatMessage, recipeCtx string) (*GroqChatResponse, error)
	BuildMessagesForStream(msgs []domain.ChatMessage, recipeCtx, toolCallID, assistantContent, toolResult string) []openai.ChatCompletionMessage
}

// GroqStreamer creates a streaming chat completion.
type GroqStreamer interface {
	StreamChatWithContext(ctx context.Context, messages []openai.ChatCompletionMessage) (*openai.ChatCompletionStream, error)
}

// TavilySearcher executes a web search.
type TavilySearcher interface {
	Search(ctx context.Context, query string) (*TavilySearchResult, error)
}

// ChatSSE handles POST /api/chat and streams the response as SSE.
func ChatSSE(groq interface {
	GroqChatter
	GroqStreamer
}, tavily TavilySearcher) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req domain.ChatRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Limit history to last 10 messages to control context size
		if len(req.Messages) > 10 {
			req.Messages = req.Messages[len(req.Messages)-10:]
		}

		c.Header("Content-Type", "text/event-stream")
		c.Header("Cache-Control", "no-cache")
		c.Header("Connection", "keep-alive")
		c.Header("X-Accel-Buffering", "no")

		w := c.Writer

		sendSSE := func(event domain.SSEEvent) {
			data, _ := json.Marshal(event)
			fmt.Fprintf(w, "data: %s\n\n", data)
			w.(http.Flusher).Flush()
		}

		// Phase 1: check for tool use (non-streaming)
		resp, err := groq.Chat(c.Request.Context(), req.Messages, req.RecipeContext)
		if err != nil {
			sendSSE(domain.SSEEvent{Type: "error", Content: "Ошибка соединения с AI"})
			return
		}

		var sources []string

		if resp.ToolCallID != "" {
			// Groq wants to search
			sendSSE(domain.SSEEvent{Type: "searching", Content: "🔍 Ищу рецепты в интернете..."})

			searchResult, searchErr := tavily.Search(c.Request.Context(), resp.ToolQuery)
			var streamMessages []openai.ChatCompletionMessage
			if searchErr != nil {
				// Fall back: build messages without tool result
				streamMessages = groq.BuildMessagesForStream(req.Messages, req.RecipeContext, "", "", "")
			} else {
				sources = searchResult.URLs
				streamMessages = groq.BuildMessagesForStream(
					req.Messages, req.RecipeContext,
					resp.ToolCallID, "", searchResult.Content,
				)
			}

			// Phase 2: stream final response
			stream, streamErr := groq.StreamChatWithContext(c.Request.Context(), streamMessages)
			if streamErr != nil {
				sendSSE(domain.SSEEvent{Type: "error", Content: "Ошибка генерации ответа"})
				return
			}
			defer stream.Close()

			for {
				chunk, recvErr := stream.Recv()
				if errors.Is(recvErr, io.EOF) {
					break
				}
				if recvErr != nil {
					break
				}
				if len(chunk.Choices) > 0 {
					content := chunk.Choices[0].Delta.Content
					if content != "" {
						sendSSE(domain.SSEEvent{Type: "token", Content: content})
					}
				}
			}
		} else {
			// No tool use — send the direct response word-by-word for streaming effect
			words := strings.Fields(resp.Content)
			for i, word := range words {
				suffix := " "
				if i == len(words)-1 {
					suffix = ""
				}
				sendSSE(domain.SSEEvent{Type: "token", Content: word + suffix})
				time.Sleep(18 * time.Millisecond)
			}
		}

		if len(sources) > 0 {
			sendSSE(domain.SSEEvent{Type: "sources", Sources: sources})
		}
		sendSSE(domain.SSEEvent{Type: "done"})
	}
}
