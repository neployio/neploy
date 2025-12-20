package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/service"
)

type Metadata struct {
	service service.Metadata
}

func NewMetadata(service service.Metadata) *Metadata {
	return &Metadata{service}
}

func (h *Metadata) RegisterRoutes(r *echo.Group) {
	r.GET("", h.Get)
	r.PATCH("", h.Update)
}

// Get godoc
// @Summary Get metadata
// @Description Get metadata
// @Tags Metadata
// @Produce json
// @Success 200 {object} model.Metadata
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /metadata [get]
func (h *Metadata) Get(c echo.Context) error {
	metadata, err := h.service.Get(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, metadata)
}

// Update godoc
// @Summary Update metadata
// @Description Update metadata
// @Tags Metadata
// @Accept json
// @Produce json
// @Param metadata body model.MetadataRequest true "Metadata"
// @Success 200 {object} model.Metadata
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /metadata [patch]
func (h *Metadata) Update(c echo.Context) error {
	var metadata model.MetadataRequest
	if err := c.Bind(&metadata); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.Validate(metadata); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	err := h.service.Update(c.Request().Context(), metadata)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, metadata)
}
