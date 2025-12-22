package common

import (
	"context"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/gitlab"
	"neploy.dev/config"
	"neploy.dev/pkg/model"
)

func FormatDateRange(startDate, endDate time.Time) model.DateRange {
	return model.DateRange{
		StartDate: startDate.Format("2006-01-02"),
		EndDate:   endDate.Format("2006-01-02"),
	}
}

func InjectTrace(ctx context.Context, trace *model.Trace) context.Context {
	return context.WithValue(ctx, "trace", trace)
}

func ExtractTrace(ctx context.Context) (*model.Trace, bool) {
	trace, ok := ctx.Value("trace").(*model.Trace)
	return trace, ok
}

func AttachSQLToTrace(ctx context.Context, sql string) {
	if trace, ok := ExtractTrace(ctx); ok {
		trace.SqlStatement = sql
	}
}

// checkRateLimit implements a simple rate limiting mechanism
func CheckRateLimit(ip string) bool {
	model.LoginAttemptsMutex.Lock()
	defer model.LoginAttemptsMutex.Unlock()

	now := time.Now()

	// Clean up old entries periodically
	if now.Second()%30 == 0 { // Clean every ~30 seconds
		for ip, attempt := range model.LoginAttempts {
			if now.Sub(attempt.LastTry) > 30*time.Minute {
				delete(model.LoginAttempts, ip)
			}
		}
	}

	attempt, exists := model.LoginAttempts[ip]
	if !exists {
		model.LoginAttempts[ip] = &model.LoginAttempt{Attempts: 1, LastTry: now}
		return true
	}

	// Check if IP is locked out
	if !attempt.LockUntil.IsZero() && now.Before(attempt.LockUntil) {
		return false
	}

	// Reset attempts if outside rate window
	if now.Sub(attempt.LastTry) > model.RateWindow {
		attempt.Attempts = 0
		attempt.LockUntil = time.Time{}
	}

	// Increment attempt counter
	attempt.Attempts++
	attempt.LastTry = now

	// Lock out IP if too many attempts
	if attempt.Attempts > model.MaxLoginAttempts {
		attempt.LockUntil = now.Add(model.LockoutDuration)
		return false
	}

	return true
}

func GetConfig(provider model.Provider) *oauth2.Config {
	switch provider {
	case model.Github:
		return &oauth2.Config{
			ClientID:     config.Env.GithubClientID,
			ClientSecret: config.Env.GithubClientSecret,
			RedirectURL:  "http://neploy.live:8081/auth/github/callback",
			Scopes:       []string{"user:email", "read:user"},
			Endpoint:     github.Endpoint,
		}
	case model.Gitlab:
		return &oauth2.Config{
			ClientID:     config.Env.GitlabApplicationID,
			ClientSecret: config.Env.GitlabSecret,
			RedirectURL:  "http://neploy.live:8081/auth/gitlab/callback",
			Scopes:       []string{"read_user"},
			Endpoint:     gitlab.Endpoint,
		}
	default:
		return nil
	}
}
