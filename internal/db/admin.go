package db

import (
	"context"
	"fmt"

	"recipe-ai/internal/domain"
)

// GetAllUsers returns all users ordered by registration date (newest first).
func (db *DB) GetAllUsers(ctx context.Context) ([]domain.User, error) {
	rows, err := db.pool.Query(ctx, `
		SELECT id::text, name, email, role, is_banned, created_at::text
		FROM users ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("db: get all users: %w", err)
	}
	defer rows.Close()

	var result []domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.IsBanned, &u.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, u)
	}
	return result, nil
}

// SetUserRole updates the role of a user.
func (db *DB) SetUserRole(ctx context.Context, userID, role string) error {
	_, err := db.pool.Exec(ctx, "UPDATE users SET role=$1 WHERE id=$2", role, userID)
	return err
}

// SetUserBanned sets or clears the is_banned flag for a user.
func (db *DB) SetUserBanned(ctx context.Context, userID string, isBanned bool) error {
	_, err := db.pool.Exec(ctx, "UPDATE users SET is_banned=$1 WHERE id=$2", isBanned, userID)
	return err
}

// GetAdminStats returns aggregate statistics for the admin dashboard.
func (db *DB) GetAdminStats(ctx context.Context) (*domain.AdminStats, error) {
	var s domain.AdminStats

	if err := db.pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&s.TotalUsers); err != nil {
		return nil, fmt.Errorf("db: stats total_users: %w", err)
	}
	if err := db.pool.QueryRow(ctx, "SELECT COUNT(*) FROM sessions WHERE expires_at > now()").Scan(&s.ActiveSessions); err != nil {
		return nil, fmt.Errorf("db: stats active_sessions: %w", err)
	}
	if err := db.pool.QueryRow(ctx, "SELECT COUNT(*) FROM favorites").Scan(&s.TotalFavorites); err != nil {
		return nil, fmt.Errorf("db: stats total_favorites: %w", err)
	}
	if err := db.pool.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE created_at > now() - INTERVAL '7 days'").Scan(&s.NewUsersWeek); err != nil {
		return nil, fmt.Errorf("db: stats new_users_week: %w", err)
	}

	return &s, nil
}

// GetAllSessions returns all active sessions with user details.
func (db *DB) GetAllSessions(ctx context.Context) ([]domain.SessionInfo, error) {
	rows, err := db.pool.Query(ctx, `
		SELECT s.id::text, s.user_id::text, u.name, u.email,
		       s.created_at::text, s.expires_at::text
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.expires_at > now()
		ORDER BY s.created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("db: get all sessions: %w", err)
	}
	defer rows.Close()

	var result []domain.SessionInfo
	for rows.Next() {
		var si domain.SessionInfo
		if err := rows.Scan(&si.ID, &si.UserID, &si.UserName, &si.UserEmail, &si.CreatedAt, &si.ExpiresAt); err != nil {
			return nil, err
		}
		result = append(result, si)
	}
	return result, nil
}

// DeleteSessionByID force-terminates any session by ID (admin action).
func (db *DB) DeleteSessionByID(ctx context.Context, sessionID string) error {
	tag, err := db.pool.Exec(ctx, "DELETE FROM sessions WHERE id=$1", sessionID)
	if err != nil {
		return fmt.Errorf("db: delete session by id: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
