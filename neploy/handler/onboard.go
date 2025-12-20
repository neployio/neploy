package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/service"
)

type Onboard struct {
	service service.Onboard
}

func NewOnboard(service service.Onboard) *Onboard {
	return &Onboard{
		service: service,
	}
}

func (o *Onboard) RegisterRoutes(r *echo.Group) {
	r.POST("", o.Initiate)
}

// Initiate godoc
// @Summary Initiate onboarding
// @Description Initiate onboarding
// @Tags Onboard
// @Accept json
// @Produce json
// @Param request body model.OnboardRequest true "Onboard Request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /onboard [post]
func (o *Onboard) Initiate(c echo.Context) error {
	var req model.OnboardRequest
	if err := c.Bind(&req); err != nil {
		logger.Error("error parsing request: %v", err)
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": "Invalid request",
		})
	}

	if err := o.service.Initiate(c.Request().Context(), req); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Onboarding initiated",
	})
}
