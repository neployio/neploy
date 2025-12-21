package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/service"
)

type TechStack struct {
	service service.TechStack
}

func NewTechStack(service service.TechStack) *TechStack {
	return &TechStack{
		service: service,
	}
}

func (h *TechStack) RegisterRoutes(r *echo.Group) {
	r.GET("", h.List)
	r.POST("", h.Create)
	r.PATCH("/:id", h.Update)
	r.DELETE("/:id", h.Delete)
}

// List godoc
// @Summary List all tech stacks
// @Description List all tech stacks
// @Tags TechStack
// @Accept json
// @Produce json
// @Success 200 {object} []model.TechStack
// @Failure 500 {object} map[string]interface{}
// @Router /tech-stacks [get]
func (h *TechStack) List(c echo.Context) error {
	techStacks, err := h.service.GetAll(c.Request().Context())
	if err != nil {
		logger.Error("error getting tech stacks: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, techStacks)
}

// Create godoc
// @Summary Create a new tech stack
// @Description Create a new tech stack
// @Tags TechStack
// @Accept json
// @Produce json
// @Param request body model.CreateTechStackRequest true "Tech stack details"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /tech-stacks [post]
func (h *TechStack) Create(c echo.Context) error {
	var req model.CreateTechStackRequest
	if err := c.Bind(&req); err != nil {
		logger.Error("error binding request: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	if err := h.service.Create(c.Request().Context(), req); err != nil {
		logger.Error("error creating tech stack: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	return c.JSON(http.StatusCreated, echo.Map{
		"message": "Tech stack created successfully",
	})
}

// Update godoc
// @Summary Update a tech stack
// @Description Update a tech stack by ID
// @Tags TechStack
// @Accept json
// @Produce json
// @Param id path string true "Tech stack ID"
// @Param request body model.CreateTechStackRequest true "Tech stack details"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /tech-stacks/{id} [patch]
func (h *TechStack) Update(c echo.Context) error {
	id := c.Param("id")
	var req model.CreateTechStackRequest
	if err := c.Bind(&req); err != nil {
		logger.Error("error binding request: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	if err := h.service.Update(c.Request().Context(), id, req); err != nil {
		logger.Error("error updating tech stack: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "Tech stack updated successfully",
	})
}

// Delete godoc
// @Summary Delete a tech stack
// @Description Delete a tech stack by ID
// @Tags TechStack
// @Accept json
// @Produce json
// @Param id path string true "Tech stack ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /tech-stacks/{id} [delete]
func (h *TechStack) Delete(c echo.Context) error {
	id := c.Param("id")
	if err := h.service.Delete(c.Request().Context(), id); err != nil {
		logger.Error("error deleting tech stack: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "Tech stack deleted successfully",
	})
}
