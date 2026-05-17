package db

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"recipe-ai/internal/domain"
)

// ErrNotFound is returned when a record does not exist.
var ErrNotFound = errors.New("db: not found")

// ErrEmailTaken is returned when registering with an already-used email.
var ErrEmailTaken = errors.New("db: email already taken")

// CreateUser inserts a new user and returns the created record.
func (db *DB) CreateUser(ctx context.Context, name, email, passwordHash string) (*domain.User, error) {
	var u domain.User
	err := db.pool.QueryRow(ctx, `
		INSERT INTO users(name, email, password_hash)
		VALUES($1, $2, $3)
		RETURNING id::text, name, email, role, created_at::text
	`, name, email, passwordHash).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			return nil, ErrEmailTaken
		}
		return nil, fmt.Errorf("db: create user: %w", err)
	}
	return &u, nil
}

// GetUserByEmail returns the user with the given email plus their password hash.
func (db *DB) GetUserByEmail(ctx context.Context, email string) (*domain.User, string, error) {
	var u domain.User
	var hash string
	err := db.pool.QueryRow(ctx, `
		SELECT id::text, name, email, role, created_at::text, password_hash
		FROM users WHERE email = $1
	`, email).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt, &hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, "", ErrNotFound
	}
	if err != nil {
		return nil, "", fmt.Errorf("db: get user by email: %w", err)
	}
	return &u, hash, nil
}

// GetUserBySession returns the user associated with a valid, non-expired session.
func (db *DB) GetUserBySession(ctx context.Context, sessionID string) (*domain.User, error) {
	var u domain.User
	err := db.pool.QueryRow(ctx, `
		SELECT u.id::text, u.name, u.email, u.role, u.created_at::text
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.id = $1 AND s.expires_at > now()
	`, sessionID).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("db: get user by session: %w", err)
	}
	return &u, nil
}

// GetUserByID returns the user by UUID.
func (db *DB) GetUserByID(ctx context.Context, userID string) (*domain.User, error) {
	var u domain.User
	err := db.pool.QueryRow(ctx, `
		SELECT id::text, name, email, role, created_at::text
		FROM users WHERE id = $1
	`, userID).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("db: get user by id: %w", err)
	}
	return &u, nil
}
