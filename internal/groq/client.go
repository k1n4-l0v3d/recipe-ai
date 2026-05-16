package groq

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"recipe-ai/internal/domain"

	openai "github.com/sashabaranov/go-openai"
)

const model = "llama-3.3-70b-versatile"
const defaultBaseURL = "https://api.groq.com/openai/v1"

// ChatResponse is the result of a Chat call.
type ChatResponse struct {
	Content    string // set when Groq responds directly
	ToolCallID string // set when Groq wants to call search_recipes
	ToolQuery  string // the query argument from the tool call
}

// Client wraps go-openai configured to use the Groq API.
type Client struct {
	oai *openai.Client
}

// NewClient creates a Groq client. Pass baseURL="" to use the default Groq endpoint.
func NewClient(apiKey, baseURL string) *Client {
	cfg := openai.DefaultConfig(apiKey)
	if baseURL != "" {
		cfg.BaseURL = baseURL
	} else {
		cfg.BaseURL = defaultBaseURL
	}
	return &Client{oai: openai.NewClientWithConfig(cfg)}
}

// GenerateRecipeList asks Groq to produce a JSON list of recipes for a category.
func (c *Client) GenerateRecipeList(ctx context.Context, categoryName string) ([]domain.RecipeSummary, error) {
	content, err := c.jsonCompletion(ctx, categoryListPrompt(categoryName))
	if err != nil {
		return nil, err
	}

	var recipes []domain.RecipeSummary
	if err := json.Unmarshal([]byte(content), &recipes); err != nil {
		return nil, fmt.Errorf("groq: parse recipe list: %w (raw: %s)", err, content)
	}
	return recipes, nil
}

// GenerateRecipe asks Groq to produce a JSON recipe for a dish name.
func (c *Client) GenerateRecipe(ctx context.Context, dishName string) (*domain.Recipe, error) {
	content, err := c.jsonCompletion(ctx, recipeDetailPrompt(dishName))
	if err != nil {
		return nil, err
	}

	var recipe domain.Recipe
	if err := json.Unmarshal([]byte(content), &recipe); err != nil {
		return nil, fmt.Errorf("groq: parse recipe: %w (raw: %s)", err, content)
	}
	return &recipe, nil
}

// Chat sends a conversation to Groq with the search_recipes tool available.
// Returns either a direct text response or a tool call to execute.
func (c *Client) Chat(ctx context.Context, messages []domain.ChatMessage, recipeContext string) (*ChatResponse, error) {
	oaiMessages := []openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleSystem, Content: chatSystemWithContext(recipeContext)},
	}
	for _, m := range messages {
		oaiMessages = append(oaiMessages, openai.ChatCompletionMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}

	resp, err := c.oai.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:    model,
		Messages: oaiMessages,
		Tools:    []openai.Tool{searchRecipesTool},
	})
	if err != nil {
		return nil, fmt.Errorf("groq: chat: %w", err)
	}

	choice := resp.Choices[0].Message
	if len(choice.ToolCalls) > 0 {
		tc := choice.ToolCalls[0]
		query, err := ToolCallQuery(tc.Function.Arguments)
		if err != nil {
			return nil, fmt.Errorf("groq: parse tool args: %w", err)
		}
		return &ChatResponse{ToolCallID: tc.ID, ToolQuery: query}, nil
	}

	return &ChatResponse{Content: choice.Content}, nil
}

// StreamChatWithContext sends messages to Groq and returns a streaming response.
func (c *Client) StreamChatWithContext(ctx context.Context, messages []openai.ChatCompletionMessage) (*openai.ChatCompletionStream, error) {
	stream, err := c.oai.CreateChatCompletionStream(ctx, openai.ChatCompletionRequest{
		Model:    model,
		Messages: messages,
	})
	if err != nil {
		return nil, fmt.Errorf("groq: stream: %w", err)
	}
	return stream, nil
}

// BuildMessagesForStream builds the full openai message list for a streaming call,
// including the system prompt, conversation history, and optional tool result.
func (c *Client) BuildMessagesForStream(
	messages []domain.ChatMessage,
	recipeContext string,
	toolCallID, toolCallAssistantContent, toolResult string,
) []openai.ChatCompletionMessage {
	result := []openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleSystem, Content: chatSystemWithContext(recipeContext)},
	}
	for _, m := range messages {
		result = append(result, openai.ChatCompletionMessage{Role: m.Role, Content: m.Content})
	}
	if toolCallID != "" {
		result = append(result,
			openai.ChatCompletionMessage{Role: openai.ChatMessageRoleAssistant, Content: toolCallAssistantContent},
			openai.ChatCompletionMessage{Role: openai.ChatMessageRoleTool, Content: toolResult, ToolCallID: toolCallID},
		)
	}
	return result
}

// jsonCompletion sends a prompt and returns the text content, stripping any markdown fences.
func (c *Client) jsonCompletion(ctx context.Context, prompt string) (string, error) {
	resp, err := c.oai.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: model,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleUser, Content: prompt},
		},
	})
	if err != nil {
		return "", fmt.Errorf("groq: completion: %w", err)
	}

	content := resp.Choices[0].Message.Content
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSuffix(content, "```")
	return strings.TrimSpace(content), nil
}
