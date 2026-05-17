package auth_test

import (
	"testing"

	"recipe-ai/internal/auth"
)

func TestHashAndCheck(t *testing.T) {
	hash, err := auth.HashPassword("mypassword123")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}
	if hash == "" {
		t.Fatal("expected non-empty hash")
	}
	if !auth.CheckPassword(hash, "mypassword123") {
		t.Error("CheckPassword should return true for correct password")
	}
	if auth.CheckPassword(hash, "wrongpassword") {
		t.Error("CheckPassword should return false for wrong password")
	}
}
