package service

import (
	"context"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"golang.org/x/sync/semaphore"
	"neploy.dev/config"
	neploker "neploy.dev/pkg/docker"
	"neploy.dev/pkg/filesystem"
	neployway "neploy.dev/pkg/gateway"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/repository"
	"neploy.dev/pkg/repository/filters"
	"neploy.dev/pkg/websocket"
)

var globalSemaphore = semaphore.NewWeighted(4)

type Application interface {
	Create(ctx context.Context, app model.Application) (string, error)
	Get(ctx context.Context, id string) (model.ApplicationDockered, error)
	GetAll(ctx context.Context, userId string) ([]model.FullApplication, error)
	Update(ctx context.Context, app model.Application) error
	GetStat(ctx context.Context, id string) (model.ApplicationStat, error)
	CreateStat(ctx context.Context, stat model.ApplicationStat) error
	UpdateStat(ctx context.Context, stat model.ApplicationStat) error
	Delete(ctx context.Context, id string) error
	StartContainer(ctx context.Context, id, versionID string) error
	StopContainer(ctx context.Context, id, versionID string) error
	GetRepoBranches(ctx context.Context, repoURL string) ([]string, error)
	Deploy(ctx context.Context, id string, repoURL string, branch string, endpointType string, domain string) error
	Upload(ctx context.Context, id string, file *multipart.FileHeader) (string, error)
	DeleteVersion(ctx context.Context, appID string, versionID string) error
	GetHealthy(ctx context.Context) (uint, uint, error)
	GetHourlyRequests(ctx context.Context) ([]model.RequestStat, error)
	GetStats(ctx context.Context) ([]model.ApplicationStat, error)
	EnsureDefaultGateways(ctx context.Context) error
	GetVersionLogs(ctx context.Context, appID, versionID string) ([]string, error)
}

type application struct {
	repos             repository.Repositories
	hub               *websocket.Hub
	docker            *neploker.Docker
	router            *neployway.Router
	versioningService Versioning
	dockerService     Docker
}

func NewApplication(repos repository.Repositories, router *neployway.Router) Application {
	hub := websocket.GetHub()
	dockerClient := neploker.NewDocker()
	return &application{
		repos:             repos,
		hub:               hub,
		docker:            dockerClient,
		router:            router,
		versioningService: NewVersioning(repos, hub, dockerClient),
		dockerService:     NewDocker(repos, hub, dockerClient, router),
	}
}

func (a *application) Create(ctx context.Context, app model.Application) (string, error) {
	return a.repos.Application.Insert(ctx, app)
}

func (a *application) Update(ctx context.Context, app model.Application) error {
	return a.repos.Application.Update(ctx, app)
}

func (a *application) GetStat(ctx context.Context, id string) (model.ApplicationStat, error) {
	return a.repos.ApplicationStat.GetByID(ctx, id)
}

func (a *application) CreateStat(ctx context.Context, stat model.ApplicationStat) error {
	return a.repos.ApplicationStat.Insert(ctx, stat)
}

func (a *application) UpdateStat(ctx context.Context, stat model.ApplicationStat) error {
	return a.repos.ApplicationStat.Update(ctx, stat)
}

func (a *application) StartContainer(ctx context.Context, id, versionId string) error {
	return a.dockerService.StartContainer(ctx, id, versionId)
}

func (a *application) StopContainer(ctx context.Context, id, versionId string) error {
	return a.dockerService.StopContainer(ctx, id, versionId)
}

func (a *application) GetRepoBranches(ctx context.Context, repoURL string) ([]string, error) {
	repo := filesystem.NewGitRepo(repoURL)
	return repo.GetBranches()
}

func (a *application) Deploy(ctx context.Context, id string, repoURL string, branch string, endpointType string, domain string) error {
	return a.versioningService.Deploy(ctx, id, repoURL, branch, endpointType, domain)
}

func (a *application) Upload(ctx context.Context, id string, file *multipart.FileHeader) (string, error) {
	return a.versioningService.Upload(ctx, id, file)
}

func (a *application) ensureContainerRunning(ctx context.Context, app model.Application, version model.ApplicationVersion) error {
	if version.Status == "paused" {
		return nil
	}

	if err := globalSemaphore.Acquire(ctx, 1); err != nil {
		logger.Error("semaphore timeout for version %s: %v", version.VersionTag, err)
		return err
	}
	defer globalSemaphore.Release(1)

	containerName := getContainerName(app.AppName, version.VersionTag)
	status, err := a.docker.GetContainerStatus(ctx, containerName)
	if err != nil {
		logger.Error("error getting container status: %v", err)
		return err
	}
	if status == "Not created" {
		dockerfilePath := filepath.Join(version.StorageLocation, "Dockerfile")
		port, err := a.dockerService.ConfigurePort(dockerfilePath, false)
		if err != nil {
			logger.Error("error configuring port: %v", err)
			return err
		}
		if err := a.dockerService.CreateAndStartContainer(ctx, app, version, port); err != nil {
			logger.Error("error creating and starting container: %v", err)
			return err
		}
	} else {
		if err := a.dockerService.StartContainer(ctx, app.ID, version.ID); err != nil {
			logger.Error("error starting container: %v", err)
			return err
		}
	}

	return nil
}

func (a *application) Get(ctx context.Context, id string) (model.ApplicationDockered, error) {
	app, err := a.repos.Application.GetByID(ctx, id)
	if err != nil {
		logger.Error("error getting app %v", err)
		return model.ApplicationDockered{}, err
	}

	stats, err := a.repos.ApplicationStat.GetByApplicationID(ctx, app.ID)
	if err != nil {
		logger.Error("error getting app stats: %v", err)
		return model.ApplicationDockered{}, err
	}

	versions, err := a.repos.ApplicationVersion.GetAll(ctx, filters.IsSelectFilter("application_id", app.ID))
	if err != nil {
		logger.Error("error getting application versions: %v", err)
		return model.ApplicationDockered{}, err
	}

	if len(versions) == 0 {
		return model.ApplicationDockered{
			Application:    app,
			CpuUsage:       0,
			MemoryUsage:    0,
			Uptime:         "0s",
			RequestsPerMin: 0,
			Logs:           []string{},
			Versions:       versions,
		}, nil
	}

	globalCpu, globalRam := 0.0, 0.0
	latestContainerID := ""
	for _, version := range versions {
		go func() {
			if err := a.ensureContainerRunning(ctx, app, version); err != nil {
				logger.Error("error ensuring container for version %s: %v", version.VersionTag, err)
			}
		}()

		containerID, err := a.docker.GetContainerID(ctx, getContainerName(app.AppName, version.VersionTag))
		if err != nil {
			logger.Error("error getting container ID: %v", err)
			return model.ApplicationDockered{}, err
		}

		cpu, ram, err := a.docker.GetUsage(ctx, containerID)
		if err != nil {
			logger.Error("error getting container usage: %v", err)
			cpu = 0
			ram = 0
		}

		globalCpu += cpu
		globalRam += ram
		latestContainerID = containerID
	}

	uptime, err := a.docker.GetUptime(ctx, latestContainerID)
	if err != nil {
		logger.Error("error getting container uptime: %v", err)
		uptime = time.Duration(0)
	}

	logs, err := a.docker.GetLogs(ctx, latestContainerID, false)
	if err != nil {
		logger.Error("error getting container logs: %v", err)
		logs = []string{}
	}

	var requestsPerMin int
	for _, stat := range stats {
		requestsPerMin += stat.Requests
	}

	return model.ApplicationDockered{
		Application:    app,
		CpuUsage:       globalCpu,
		MemoryUsage:    globalRam,
		Uptime:         uptime.String(),
		RequestsPerMin: requestsPerMin,
		Logs:           logs,
		Versions:       versions,
	}, nil
}

func (a *application) GetAll(ctx context.Context, userId string) ([]model.FullApplication, error) {
	// Get all applications
	apps, err := a.repos.Application.GetAll(ctx)
	if err != nil {
		logger.Error("error getting applications: %v", err)
		return nil, err
	}

	if len(apps) == 0 {
		return []model.FullApplication{}, nil
	}

	// Get user permissions
	techStacks, err := a.repos.UserTechStack.GetByUserID(ctx, userId)
	if err != nil {
		logger.Error("error getting user tech stacks %v", err)
		return nil, err
	}

	roles, err := a.repos.UserRole.GetByUserID(ctx, userId)
	if err != nil {
		logger.Error("error getting user %v", err)
		return nil, err
	}

	// Check if user is admin
	isAdmin := false
	for _, r := range roles {
		if r.Role != nil && r.Role.Name == "Administrator" {
			isAdmin = true
			break
		}
	}

	// Create maps for user's tech stacks for O(1) lookup
	userTechStackMap := make(map[string]bool)
	for _, ut := range techStacks {
		userTechStackMap[ut.TechStackID] = true
	}

	// Filter applications based on tech stack permissions
	var filteredApps []model.Application
	var appIDs []string
	var techStackIDs []string
	techStackIDSet := make(map[string]bool)

	for _, app := range apps {
		if app.TechStackID == nil {
			continue
		}

		// Check if user has access to this tech stack
		if !isAdmin && !userTechStackMap[*app.TechStackID] {
			continue
		}

		filteredApps = append(filteredApps, app)
		appIDs = append(appIDs, app.ID)
		if !techStackIDSet[*app.TechStackID] {
			techStackIDs = append(techStackIDs, *app.TechStackID)
			techStackIDSet[*app.TechStackID] = true
		}
	}

	if len(filteredApps) == 0 {
		return []model.FullApplication{}, nil
	}

	// Build final results
	var fullApps []model.FullApplication

	for _, app := range filteredApps {
		if app.TechStackID == nil {
			continue
		}

		// Get application stats
		stats, err := a.repos.ApplicationStat.GetByApplicationID(ctx, app.ID)
		if err != nil {
			logger.Error("error getting application stat: %v", err)
			return nil, err
		}

		// Get tech stack
		techStack, err := a.repos.TechStack.GetByID(ctx, *app.TechStackID)
		if err != nil {
			logger.Error("error getting tech stack: %v", err)
			return nil, err
		}

		// Get versions
		versions, err := a.repos.ApplicationVersion.GetAll(ctx, filters.IsSelectFilter("application_id", app.ID))
		if err != nil {
			logger.Error("error getting application versions: %v", err)
			return nil, err
		}

		// Start container ensuring in background (truly async, don't wait)
		for _, version := range versions {
			v := version
			go func() {
				if err := a.ensureContainerRunning(context.Background(), app, v); err != nil {
					logger.Error("error ensuring container for version %s: %v", v.VersionTag, err)
				}
			}()
		}

		// Get status from first active version (limit Docker API calls)
		appStatus := "unknown"
		for _, v := range versions {
			if v.Status != "paused" && v.Status != "inactive" {
				containerName := getContainerName(app.AppName, v.VersionTag)
				// Use a timeout context for Docker calls to prevent hanging
				statusCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
				status, err := a.docker.GetContainerStatus(statusCtx, containerName)
				cancel()
				if err == nil {
					appStatus = status
					break
				}
			}
		}

		fullApps = append(fullApps, model.FullApplication{
			Application: app,
			TechStack:   techStack,
			Stats:       stats,
			Status:      appStatus,
		})
	}

	return fullApps, nil
}

func (a *application) Delete(ctx context.Context, id string) error {
	// Delete associated gateways first
	gateways, err := a.repos.Gateway.GetByApplicationID(ctx, id)
	if err != nil {
		logger.Error("error getting gateways: %v", err)
		return err
	}

	for _, gateway := range gateways {
		if err := a.repos.Gateway.Delete(ctx, gateway.ID); err != nil {
			logger.Error("error deleting gateway: %v", err)
			// Continue with other gateways
		}
	}

	// Get application details
	app, err := a.repos.Application.GetByID(ctx, id)
	if err != nil {
		logger.Error("error getting application: %v", err)
		return err
	}

	// Delete container if it exists
	appNameWithoutSpace := strings.ReplaceAll(app.AppName, " ", "-")
	appNameWithoutSpecialChars := regexp.MustCompile(`[^a-zA-Z0-9-]`).ReplaceAllString(appNameWithoutSpace, "")
	appName := strings.ToLower(appNameWithoutSpecialChars)
	containerName := fmt.Sprintf("neploy-%s", appName)

	if err := a.docker.RemoveContainer(ctx, containerName); err != nil && !strings.Contains(err.Error(), "No such container") {
		logger.Error("error removing container: %v", err)
		// Continue with deletion even if container removal fails
	}

	// Delete application files
	if app.StorageLocation != "" {
		if err := os.RemoveAll(app.StorageLocation); err != nil {
			logger.Error("error removing application files: %v", err)
			// Continue with deletion even if file removal fails
		}
	}

	a.router.RemoveRoute("/" + containerName)

	return a.repos.Application.Delete(ctx, id)
}

func (a *application) DeleteVersion(ctx context.Context, appID string, versionID string) error {
	return a.versioningService.DeleteVersion(ctx, appID, versionID)
}

func (a *application) GetHealthy(ctx context.Context) (uint, uint, error) {
	// Filtro para versiones activas
	fltrs := filters.IsSelectFilter("status", "active")

	// Obtener todas las versiones activas
	versions, err := a.repos.ApplicationVersion.GetAll(ctx, fltrs)
	if err != nil {
		return 0, 0, err
	}

	var healthy uint

	for _, version := range versions {
		// Buscar la app correspondiente
		app, err := a.repos.Application.GetOneById(ctx, version.ApplicationID)
		if err != nil {
			continue // o manejar error según tu lógica
		}

		// Construir nombre del contenedor
		containerName := getContainerName(app.AppName, version.VersionTag)

		// Consultar estado del contenedor
		status, err := a.docker.GetContainerStatus(ctx, containerName)
		if err != nil {
			continue
		}
		if status == "Running" {
			healthy++
		}
	}

	return healthy, uint(len(versions)), nil
}

func (a *application) GetHourlyRequests(ctx context.Context) ([]model.RequestStat, error) {
	return a.repos.ApplicationStat.GetHourlyRequests(ctx)
}

func (a *application) GetStats(ctx context.Context) ([]model.ApplicationStat, error) {
	stats, err := a.repos.ApplicationStat.GetAll(ctx)
	if err != nil {
		logger.Error("error getting application stats: %v", err)
		return nil, err
	}

	for i, stat := range stats {
		app, err := a.repos.Application.GetByID(ctx, stat.ApplicationID)
		if err != nil {
			logger.Error("error getting application for stat %s: %v", stat.ID, err)
			continue
		}
		stats[i].AppName = app.AppName
	}

	return stats, nil
}

func (a *application) EnsureDefaultGateways(ctx context.Context) error {
	apps, err := a.repos.Application.GetAll(ctx)
	if err != nil {
		return err
	}
	gateways, err := a.repos.Gateway.GetAll(ctx)
	if err != nil {
		return err
	}
	if len(gateways) > 0 {
		return nil
	}

	for _, app := range apps {
		appName := sanitizeAppName(app.AppName)
		port := "80"

		// Find first version folder and Dockerfile for port detection
		appPath := filepath.Join(config.Env.UploadPath, appName)
		entries, err := os.ReadDir(appPath)
		if err == nil {
			for _, entry := range entries {
				if entry.IsDir() {
					dockerfilePath := filepath.Join(appPath, entry.Name(), "Dockerfile")
					if data, err := os.ReadFile(dockerfilePath); err == nil {
						re := regexp.MustCompile(`(?i)^EXPOSE\s+(\d+)`)
						lines := strings.Split(string(data), "\n")
						for _, line := range lines {
							matches := re.FindStringSubmatch(strings.TrimSpace(line))
							if len(matches) == 2 {
								port = matches[1]
								break
							}
						}
					}
					break
				}
			}
		}

		defaultGateway := model.Gateway{
			Domain:        "localhost",
			Path:          "/" + appName,
			Port:          port,
			ApplicationID: app.ID,
			Status:        "active",
		}
		if err := a.repos.Gateway.Insert(ctx, defaultGateway); err != nil {
			logger.Error("Failed to create default gateway for app %s: %v", app.AppName, err)
		} else {
			logger.Info("Created default gateway for app %s", app.AppName)
		}
	}
	return nil
}

func (a *application) GetVersionLogs(ctx context.Context, appID, versionID string) ([]string, error) {
	return a.versioningService.GetVersionLogs(ctx, appID, versionID)
}
