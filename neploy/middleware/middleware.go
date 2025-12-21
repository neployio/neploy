package middleware

import (
	"context"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"neploy.dev/config"
	"neploy.dev/pkg/common"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/service"
)

func OnboardingMiddleware(service service.Onboard) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Skip middleware for non-GET requests
			return next(c)
		}
	}
}

// JWTMiddleware is a middleware that checks if the user is authenticated
func JWTMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Get token from cookie
			cookie, err := c.Cookie("token")
			if err != nil {
				return c.Redirect(http.StatusSeeOther, "/")
			}

			// Check if token exists
			if cookie.Value == "" {
				return c.Redirect(http.StatusSeeOther, "/")
			}

			// Validate JWT token
			claims, valid, err := service.ValidateJWT(cookie.Value)
			if err != nil || !valid {
				return c.Redirect(http.StatusSeeOther, "/")
			}

			// Store claims in context
			c.Set("claims", claims)
			return next(c)
		}
	}
}

func TraceMiddleware(traceService service.Trace) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			claims, ok := c.Get("claims").(model.JWTClaims)
			if !ok {
				return next(c)
			}

			trace := &model.Trace{
				UserID:          claims.ID,
				Type:            "panel", // o dinámico según ruta
				Action:          c.Request().Method + " " + c.Path(),
				ActionTimestamp: model.NewDateNow(),
			}

			// Inyectar en contexto
			ctx := common.InjectTrace(context.Background(), trace)
			c.SetRequest(c.Request().WithContext(ctx))

			err := next(c)

			// Guardar al final
			go traceService.Create(context.Background(), *trace)
			return err
		}
	}
}

func ResetTokenMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Leer el token desde query param
			tokenStr := c.QueryParam("token")
			if tokenStr == "" {
				logger.Debug("Token no encontrado en query param")
				return c.Redirect(http.StatusSeeOther, "/")
			}

			// Validar el token
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				return []byte(config.Env.JWTSecret), nil
			})
			if err != nil || !token.Valid {
				logger.Debug("Token inválido: %v", err)
				// Token inválido → no se mete en contexto
				return c.Redirect(http.StatusSeeOther, "/")
			}

			// Meter en contexto
			cookie := new(http.Cookie)
			cookie.Name = "token"
			cookie.Value = tokenStr
			cookie.HttpOnly = true
			cookie.Path = "/"
			c.SetCookie(cookie)

			return next(c)
		}
	}
}
