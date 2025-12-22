package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/service"
)

type Role struct {
	service service.Role
}

func NewRole(service service.Role) *Role {
	return &Role{
		service: service,
	}
}

func (h *Role) RegisterRoutes(r *echo.Group) {
	r.GET("", h.List)
	r.POST("", h.Create)
	r.PATCH("/:id", h.Update)
	r.DELETE("/:id", h.Delete)
	r.GET("/users/:id", h.GetUserRoles)
	r.POST("/:id/users", h.AddUserRole)
	r.DELETE("/:id/users", h.RemoveUserRole)
}

// List godoc
// @Summary List all roles
// @Description List all roles
// @Tags Role
// @Accept json
// @Produce json
// @Success 200 {object} []model.Role
// @Failure 500 {object} map[string]interface{}
// @Router /roles [get]
func (h *Role) List(c echo.Context) error {
	roles, err := h.service.Get(c.Request().Context())
	if err != nil {
		logger.Error("error getting roles: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, roles)
}

// Create godoc
// @Summary Create a new role
// @Description Create a new role
// @Tags Role
// @Accept json
// @Produce json
// @Param request body model.CreateRoleRequest true "Role details"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /roles [post]
func (h *Role) Create(c echo.Context) error {
	var req model.CreateRoleRequest
	if err := c.Bind(&req); err != nil {
		logger.Error("error binding request: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	if err := h.service.Create(c.Request().Context(), req); err != nil {
		logger.Error("error creating role: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	return c.JSON(http.StatusCreated, echo.Map{
		"message": "Role created successfully",
	})
}

// Update godoc
// @Summary Update a role
// @Description Update a role by ID
// @Tags Role
// @Accept json
// @Produce json
// @Param id path string true "Role ID"
// @Param request body model.CreateRoleRequest true "Role details"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /roles/{id} [patch]
func (h *Role) Update(c echo.Context) error {
	id := c.Param("id")
	var req model.CreateRoleRequest
	if err := c.Bind(&req); err != nil {
		logger.Error("error binding request: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	if err := h.service.Update(c.Request().Context(), id, req); err != nil {
		logger.Error("error updating role: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "Role updated successfully",
	})
}

// Delete godoc
// @Summary Delete a role
// @Description Delete a role by ID
// @Tags Role
// @Accept json
// @Produce json
// @Param id path string true "Role ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /roles/{id} [delete]
func (h *Role) Delete(c echo.Context) error {
	id := c.Param("id")
	if err := h.service.Delete(c.Request().Context(), id); err != nil {
		logger.Error("error deleting role: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "Role deleted successfully",
	})
}

// GetUserRoles godoc
// @Summary Get user roles
// @Description Get roles for a specific user
// @Tags Role
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} []model.UserRoles
// @Failure 500 {object} map[string]interface{}
// @Router /roles/users/{id} [get]
func (h *Role) GetUserRoles(c echo.Context) error {
	userID := c.Param("id")
	roles, err := h.service.GetUserRoles(c.Request().Context(), userID)
	if err != nil {
		logger.Error("error getting user roles: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"roles": roles,
	})
}

// AddUserRole godoc
// @Summary Add a role to users
// @Description Add a role to users by ID
// @Tags Role
// @Accept json
// @Produce json
// @Param id path string true "Role ID"
// @Param request body model.UserRoleRequest true "User IDs"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /roles/{id}/users [post]
func (h *Role) AddUserRole(c echo.Context) error {
	id := c.Param("id")
	var req model.UserRoleRequest
	if err := c.Bind(&req); err != nil {
		logger.Error("error binding request: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	if err := h.service.AddUserRole(c.Request().Context(), id, req); err != nil {
		logger.Error("error adding user role: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "User role added successfully",
	})
}

// RemoveUserRole godoc
// @Summary Remove a role from users
// @Description Remove a role from users by ID
// @Tags Role
// @Accept json
// @Produce json
// @Param id path string true "Role ID"
// @Param request body model.UserRoleRequest true "User IDs"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /roles/{id}/users [delete]
func (h *Role) RemoveUserRole(c echo.Context) error {
	id := c.Param("id")
	var req model.UserRoleRequest
	if err := c.Bind(&req); err != nil {
		logger.Error("error binding request: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	if err := h.service.RemoveUserRole(c.Request().Context(), id, req); err != nil {
		logger.Error("error removing user role: %v", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "bad request"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "User role removed successfully",
	})
}
