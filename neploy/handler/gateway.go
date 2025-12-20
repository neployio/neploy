package handler

import (
	"net/http"
	"slices"

	"neploy.dev/pkg/logger"

	"github.com/labstack/echo/v4"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/service"
)

type Gateway struct {
	gatewayService service.Gateway
	healthChecker  service.HealthChecker
}

func NewGateway(gatewayService service.Gateway, healthChecker service.HealthChecker) *Gateway {
	return &Gateway{
		gatewayService: gatewayService,
		healthChecker:  healthChecker,
	}
}

func (h *Gateway) RegisterRoutes(r *echo.Group) {
	r.POST("", h.Create)
	r.PUT("/:id", h.Update)
	r.DELETE("/:id", h.Delete)
	r.GET("/:id", h.Get)
	r.GET("/app/:appId", h.ListByApp)
	r.GET("/:id/health", h.CheckHealth)
	r.POST("/config", h.SaveConfig)
	r.GET("/config", h.GetConfig)
}

// Create godoc
// @Summary Create a new gateway
// @Description Create a new gateway
// @Tags Gateway
// @Accept json
// @Produce json
// @Param request body model.Gateway true "Gateway details"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /gateways [post]
func (h *Gateway) Create(c echo.Context) error {
	var gateway model.Gateway
	if err := c.Bind(&gateway); err != nil {
		return echo.NewHTTPError(echo.ErrBadRequest.Code, err.Error())
	}

	if err := h.gatewayService.Create(c.Request().Context(), gateway); err != nil {
		return echo.NewHTTPError(echo.ErrInternalServerError.Code, err.Error())
	}

	return c.Redirect(http.StatusSeeOther, "/dashboard/gateways")
}

// Update godoc
// @Summary Update a gateway
// @Description Update a gateway
// @Tags Gateway
// @Accept json
// @Produce json
// @Param id path string true "Gateway ID"
// @Param request body model.Gateway true "Gateway details"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /gateways/{id} [put]
func (h *Gateway) Update(c echo.Context) error {
	id := c.Param("id")
	var gateway model.Gateway
	if err := c.Bind(&gateway); err != nil {
		return echo.NewHTTPError(echo.ErrBadRequest.Code, err.Error())
	}

	gateway.ID = id
	if err := h.gatewayService.Update(c.Request().Context(), gateway); err != nil {
		return echo.NewHTTPError(echo.ErrInternalServerError.Code, err.Error())
	}

	return c.Redirect(http.StatusSeeOther, "/dashboard/gateways")
}

// Delete godoc
// @Summary Delete a gateway
// @Description Delete a gateway
// @Tags Gateway
// @Accept json
// @Produce json
// @Param id path string true "Gateway ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /gateways/{id} [delete]
func (h *Gateway) Delete(c echo.Context) error {
	id := c.Param("id")
	if err := h.gatewayService.Delete(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(echo.ErrInternalServerError.Code, err.Error())
	}

	return c.Redirect(http.StatusSeeOther, "/dashboard/gateways")
}

// Get godoc
// @Summary Get a gateway by ID
// @Description Get a gateway by ID
// @Tags Gateway
// @Accept json
// @Produce json
// @Param id path string true "Gateway ID"
// @Success 200 {object} model.Gateway
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /gateways/{id} [get]
func (h *Gateway) Get(c echo.Context) error {
	id := c.Param("id")
	gateway, err := h.gatewayService.Get(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(echo.ErrInternalServerError.Code, err.Error())
	}

	return c.JSON(http.StatusOK, gateway)
}

// ListByApp godoc
// @Summary List gateways by app ID
// @Description List gateways by app ID
// @Tags Gateway
// @Accept json
// @Produce json
// @Param appId path string true "App ID"
// @Success 200 {object} []model.Gateway
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /gateways/app/{appId} [get]
func (h *Gateway) ListByApp(c echo.Context) error {
	appID := c.Param("appId")
	gateways, err := h.gatewayService.ListByApp(c.Request().Context(), appID)
	if err != nil {
		return echo.NewHTTPError(echo.ErrInternalServerError.Code, err.Error())
	}

	return c.JSON(http.StatusOK, gateways)
}

// CheckHealth godoc
// @Summary Check the health of a gateway
// @Description Check the health of a gateway
// @Tags Gateway
// @Accept json
// @Produce json
// @Param id path string true "Gateway ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /gateways/{id}/health [get]
func (h *Gateway) CheckHealth(c echo.Context) error {
	id := c.Param("id")
	gateway, err := h.gatewayService.Get(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(echo.ErrInternalServerError.Code, err.Error())
	}

	if err := h.healthChecker.CheckGatewayHealth(c.Request().Context(), gateway); err != nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, map[string]string{
			"status":  "unhealthy",
			"message": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"status":  "healthy",
		"message": "Gateway is healthy",
	})
}

// SaveConfig godoc
// @Summary Saves config
// @Description Saves API Gateway Configurations like default versioning
// @Tags Gateway
// @Accept json
// @Produce json
// @Success 200 {object} model.GatewayConfig
// @Failure 400 {string} string
// @Failure 500 {string} string
// @Router /gateways/config [post]
func (h *Gateway) SaveConfig(c echo.Context) error {
	// Check user roles - only administrators and settings users can save gateway config
	claims, ok := c.Get("claims").(model.JWTClaims)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "Unauthorized")
	}

	if !slices.Contains(claims.RolesLower, "administrator") {
		return echo.NewHTTPError(http.StatusForbidden, "Access denied: insufficient privileges to modify gateway configuration")
	}

	var req model.GatewayConfigRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(echo.ErrBadRequest.Code, err.Error())
	}

	if err := c.Validate(req); err != nil {
		logger.Debug("invalid: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	conf, err := h.gatewayService.SaveConfig(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(echo.ErrInternalServerError.Code, err.Error())
	}

	return c.JSON(http.StatusOK, conf)
}

// GetConfig godoc
// @Summary Get API Gateway Config
// @Description Gets the configuration of the API Gateway
// @Tags Gateway
// @Produce json
// @Success 200 {object} model.GatewayConfig
// @Failure 500 {object} map[string]interface{}
// @Router /gateways/config [get]
func (h *Gateway) GetConfig(c echo.Context) error {
	conf, err := h.gatewayService.GetConfig(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
			"message": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, conf)
}
