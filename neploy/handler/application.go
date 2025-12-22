package handler

import (
	"net/http"
	"path/filepath"

	"github.com/labstack/echo/v4"
	inertia "github.com/romsar/gonertia"
	"neploy.dev/config"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/service"
)

type Application struct {
	service service.Application
	i       *inertia.Inertia
}

func NewApplication(service service.Application, i *inertia.Inertia) *Application {
	return &Application{
		service: service,
		i:       i,
	}
}

func (a *Application) RegisterRoutes(r *echo.Group) {
	r.POST("", a.Create)
	r.GET("/:id", a.Get)
	r.GET("", a.List)
	r.POST("/:id/deploy", a.Deploy)
	r.POST("/:id/upload", a.Upload)
	r.DELETE("/:id", a.Delete)
	r.POST("/:id/start/:versionID", a.Start)
	r.POST("/:id/stop/:versionID", a.Stop)
	r.DELETE("/:id/versions/:versionID", a.DeleteVersion)
	r.POST("/branches", a.GetRepoBranches)
	r.GET("/:id/versions/:versionID/logs", a.GetVersionLogs)
}

// Create godoc
// @Summary Create a new application
// @Description Create a new application
// @Tags Application
// @Accept json
// @Produce json
// @Param request body model.CreateApplicationRequest true "Application details"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /applications [post]
func (a *Application) Create(c echo.Context) error {
	var req model.CreateApplicationRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if req.AppName == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Application name is required")
	}

	app := model.Application{
		AppName:     req.AppName,
		Description: req.Description,
	}

	appId, err := a.service.Create(c.Request().Context(), app)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create application")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id": appId,
	})
}

// Get godoc
// @Summary Get an application by ID
// @Description Get an application by ID
// @Tags Application
// @Accept json
// @Produce json
// @Param id path string true "Application ID"
// @Success 200 {object} model.Application
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /applications/{id} [get]
func (a *Application) Get(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Application ID is required")
	}

	app, err := a.service.Get(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Application not found")
	}

	return c.JSON(http.StatusOK, app)
}

// Deploy godoc
// @Summary Deploy an application
// @Description Deploy an application
// @Tags Application
// @Accept json
// @Produce json
// @Param id path string true "Application ID"
// @Param request body model.DeployApplicationRequest true "Deployment details"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /applications/{id}/deploy [post]
func (a *Application) Deploy(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Application ID is required")
	}

	var req model.DeployApplicationRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := a.service.Deploy(c.Request().Context(), id, req.RepoURL, req.Branch, req.EndpointType, req.Domain); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "Building",
	})
}

// Start godoc
// @Summary Start an application
// @Description Start an application
// @Tags Application
// @Accept json
// @Produce json
// @Param id path string true "Application ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /applications/{id}/start [post]
func (a *Application) Start(c echo.Context) error {
	id := c.Param("id")
	versionID := c.Param("versionID")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Application ID is required")
	}
	if versionID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Version ID is required")
	}

	err := a.service.StartContainer(c.Request().Context(), id, versionID)
	if err != nil {
		logger.Error("error starting application: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to start application")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "Running",
	})
}

// Stop godoc
// @Summary Stop an application
// @Description Stop an application
// @Tags Application
// @Accept json
// @Produce json
// @Param id path string true "Application ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /applications/{id}/stop [post]
func (a *Application) Stop(c echo.Context) error {
	id := c.Param("id")
	versionID := c.Param("versionID")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Application ID is required")
	}
	if versionID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Version ID is required")
	}

	if err := a.service.StopContainer(c.Request().Context(), id, versionID); err != nil {
		logger.Error("error stopping application: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to stop application")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "Stopped",
	})
}

// Delete godoc
// @Summary Delete an application
// @Description Delete an application
// @Tags Application
// @Accept json
// @Produce json
// @Param id path string true "Application ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /applications/{id} [delete]
func (a *Application) Delete(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Application ID is required")
	}

	if err := a.service.Delete(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to delete application")
	}

	return c.NoContent(http.StatusOK)
}

func (a *Application) Upload(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Application ID is required")
	}

	file, err := c.FormFile("file")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "File is required")
	}

	path, err := a.service.Upload(c.Request().Context(), id, file)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to upload file")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"storageLocation": filepath.Join(config.Env.UploadPath, path),
	})
}

// List godoc
// @Summary List all applications
// @Description List all applications
// @Tags Application
// @Accept json
// @Produce json
// @Success 200 {object} []model.Application
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /applications [get]
func (a *Application) List(c echo.Context) error {
	claims, ok := c.Get("claims").(model.JWTClaims)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "Unauthorized")
	}

	apps, err := a.service.GetAll(c.Request().Context(), claims.ID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to fetch applications")
	}

	// If it's a page load (Inertia request), render the full page
	if c.Request().Header.Get("X-Inertia") != "" {
		return a.i.Render(c.Response(), c.Request(), "Dashboard/Applications", inertia.Props{
			"applications": apps,
		})
	}

	// For API calls, return JSON
	return c.JSON(http.StatusOK, apps)
}

// GetRepoBranches godoc
// @Summary Get repository branches
// @Description Get list of branches from a Git repository
// @Tags Application
// @Accept json
// @Produce json
// @Param request body model.GetBranchesRequest true "Repository URL"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /applications/branches [post]
func (a *Application) GetRepoBranches(c echo.Context) error {
	var req model.GetBranchesRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if req.RepoURL == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Repository URL is required")
	}

	branches, err := a.service.GetRepoBranches(c.Request().Context(), req.RepoURL)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"branches": branches,
	})
}

// DeleteVersion godoc
// @Summary Delete an application version
// @Description Delete an version of a explicit app
// @Tags Application
// @Accept json
// @Produce json
// @Param id path string true "Application ID"
// @Param versionID path string true "Version ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /applications/:id/versions/:versionID [delete]
func (a *Application) DeleteVersion(c echo.Context) error {
	var req struct {
		AppID     string `query:"id"`
		VersionID string `query:"versionID"`
	}

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := a.service.DeleteVersion(c.Request().Context(), req.AppID, req.VersionID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusOK)
}

// GetVersionLogs godoc
// @Summary Get logs for a specific application version
// @Description Get logs for a specific application version (from Docker)
// @Tags Application
// @Accept json
// @Produce json
// @Param id path string true "Application ID"
// @Param versionID path string true "Version ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /applications/{id}/versions/{versionID}/logs [get]
func (a *Application) GetVersionLogs(c echo.Context) error {
	appID := c.Param("id")
	versionID := c.Param("versionID")
	logs, err := a.service.GetVersionLogs(c.Request().Context(), appID, versionID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"logs": logs})
}
