package db

import (
	"context"
	"fmt"
)

// CreateSession inserts a new session for the user and returns the session UUID string.
func (db *DB) CreateSession(ctx context.Context, userID string) (string, error) {
	var id string
	err := db.pool.QueryRow(ctx, `
		INSERT INTO sessions(user_id) VALUES($1) RETURNING id::text
	`, userID).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("db: create session: %w", err)
	}
	return id, nil
}

// DeleteSession removes a session by ID (used on logout).
func (db *DB) DeleteSession(ctx context.Context, sessionID string) error {
	_, err := db.pool.Exec(ctx, "DELETE FROM sessions WHERE id = $1", sessionID)
	if err != nil {
		return fmt.Errorf("db: delete session: %w", err)
	}
	return nil
}
