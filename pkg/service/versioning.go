package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"neploy.dev/pkg/repository/filters"

	"gopkg.in/src-d/go-git.v4"
	gitconfig "gopkg.in/src-d/go-git.v4/config"

	"neploy.dev/config"
	neploker "neploy.dev/pkg/docker"
	"neploy.dev/pkg/filesystem"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/repository"
	"neploy.dev/pkg/websocket"
)

type Versioning interface {
	Deploy(ctx context.Context, id string, repoURL string, branch string, endpointType string, domain string) error
	Upload(ctx context.Context, id string, file *multipart.FileHeader) (string, error)
	DeleteVersion(ctx context.Context, appID string, versionID string) error
	GetVersionLogs(ctx context.Context, appID, versionID string) ([]string, error)
}

type versioning struct {
	repos  repository.Repositories
	hub    *websocket.Hub
	docker *neploker.Docker
}

func NewVersioning(repos repository.Repositories, hub *websocket.Hub, docker *neploker.Docker) Versioning {
	return &versioning{repos, hub, docker}
}

func (v *versioning) Deploy(ctx context.Context, id string, repoURL string, branch string, endpointType string, domain string) error {
	app, err := v.repos.Application.GetByID(ctx, id)
	if err != nil {
		logger.Error("error getting application: %v", err)
		return err
	}

	appName := sanitizeAppName(app.AppName)
	basePath := filepath.Join(config.Env.UploadPath, appName)

	tag, err := getLatestGitTag(repoURL)
	if err != nil {
		logger.Error("error fetching tags for app %s, using default tag: v1.0.0", err)
		tag = "v1.0.0"
	}

	versionTag, err := v.resolveVersionTag(ctx, app, tag)
	if err != nil {
		logger.Error("could not resolve version tag: %v", err)
		return err
	}

	versionPath := filepath.Join(basePath, versionTag)
	if err := os.MkdirAll(versionPath, os.ModePerm); err != nil {
		logger.Error("error creating version directory: %v", err)
		return err
	}

	repo := filesystem.NewGitRepo(repoURL)
	if err := repo.Clone(versionPath, branch); err != nil {
		logger.Error("error cloning repository: %v", err)
		return err
	}

	techStack, err := filesystem.DetectStack(versionPath)
	if err != nil {
		logger.Error("error detecting tech stack: %v", err)
		return err
	}

	tech, err := v.repos.TechStack.FindOrCreate(ctx, techStack)
	if err != nil {
		logger.Error("error finding or creating tech stack: %v", err)
		return err
	}

	if v.hub != nil {
		v.hub.BroadcastProgress(0, "Checking for Dockerfile...")
	}

	var wsClient *websocket.Client
	if v.hub != nil {
		wsClient = v.hub.GetNotificationClient()
	}

	dockerStatus := filesystem.HasDockerfile(versionPath, wsClient)
	if !dockerStatus.Exists {
		if v.hub != nil {
			v.hub.BroadcastProgress(50, "Creating Dockerfile...")
		}

		tmpl, ok := neploker.GetDefaultTemplate(techStack)
		if !ok {
			logger.Error("no default template for tech stack: %s", techStack)
			return fmt.Errorf("no template for tech stack")
		}

		dockerfilePath := filepath.Join(versionPath, "Dockerfile")
		if err := neploker.WriteDockerfile(dockerfilePath, tmpl); err != nil {
			logger.Error("error writing dockerfile: %v", err)
			return err
		}
	}

	app.TechStackID = &tech.ID
	if err := v.repos.Application.Update(ctx, app); err != nil {
		logger.Error("error updating application: %v", err)
		return err
	}

	version, err := v.repos.ApplicationVersion.GetOne(ctx, filters.IsSelectFilter("application_id", app.ID), filters.IsSelectFilter("version_tag", versionTag))
	if err != nil {
		logger.Error("error getting application version: %v", err)
		return err
	}

	version.StorageLocation = versionPath
	if err := v.repos.ApplicationVersion.Update(ctx, version); err != nil {
		logger.Error("error updating application version: %v", err)
		return err
	}

	logger.Info("application deployed: %s - version %s", app.AppName, versionTag)
	if v.hub != nil {
		v.hub.BroadcastProgress(100, "Deployment complete!")
	}

	// --- Create Gateway if not exists ---
	existingGateways, err := v.repos.Gateway.GetByApplicationID(ctx, app.ID)
	if err != nil {
		logger.Error("error checking existing gateways: %v", err)
		return err
	}
	if len(existingGateways) == 0 {
		// Set default values if not provided
		if endpointType == "" {
			endpointType = "path" // default to path-based routing
		}
		if domain == "" {
			domain = "localhost" // default domain
		}

		gateway := model.Gateway{
			Domain:        domain,
			Port:          "80",
			ApplicationID: app.ID,
			Status:        "active",
			EndpointType:  endpointType,
		}

		// Configure routing based on endpoint type
		if endpointType == "subdomain" {
			gateway.Subdomain = appName
		} else {
			gateway.Path = "/" + appName
		}

		if err := v.repos.Gateway.Insert(ctx, gateway); err != nil {
			logger.Error("error creating gateway: %v", err)
			return err
		}
		logger.Info("Gateway created for application: %s with endpoint type: %s", app.AppName, endpointType)
	}
	return nil
}

func (v *versioning) Upload(ctx context.Context, id string, file *multipart.FileHeader) (string, error) {
	app, err := v.repos.Application.GetByID(ctx, id)
	if err != nil {
		logger.Error("error getting application: %v", err)
		return "", err
	}

	zipPath, err := filesystem.UploadFile(file, app.AppName)
	if err != nil {
		logger.Error("error uploading file: %v", err)
		return "", err
	}

	unzippedPath, err := filesystem.UnzipFile(zipPath, app.AppName)
	if err != nil {
		logger.Error("error unzipping file: %v", err)
		return "", err
	}

	versionTag := "v1.0.0"
	versionTag, err = v.resolveVersionTag(ctx, app, versionTag)
	if err != nil {
		logger.Error("could not resolve version tag: %v", err)
		return "", err
	}

	// Create final directory path
	versionPath := filepath.Join(config.Env.UploadPath, sanitizeAppName(app.AppName), versionTag)
	if err := os.MkdirAll(filepath.Dir(versionPath), os.ModePerm); err != nil {
		logger.Error("error creating version directory: %v", err)
		return "", err
	}

	// Copy files from unzipped directory to final destination
	if err := filesystem.CopyDir(unzippedPath, versionPath); err != nil {
		logger.Error("error copying files to version directory: %v", err)
		return "", err
	}

	// Clean up the temporary unzipped directory
	if err := os.RemoveAll(unzippedPath); err != nil {
		logger.Error("error cleaning up temporary directory: %v", err)
		// Non-fatal error, continue
	}

	techStack, err := filesystem.DetectStack(versionPath)
	if err != nil {
		logger.Error("error detecting tech stack: %v", err)
		return "", err
	}

	tech, err := v.repos.TechStack.FindOrCreate(ctx, techStack)
	if err != nil {
		logger.Error("error finding or creating tech stack: %v", err)
		return "", err
	}

	if err := os.Remove(zipPath); err != nil {
		logger.Error("error deleting zip file: %v", err)
	}

	if v.hub != nil {
		v.hub.BroadcastProgress(0, "Checking for Dockerfile...")
	}

	dockerStatus := filesystem.HasDockerfile(versionPath, v.hub.GetNotificationClient())
	if !dockerStatus.Exists {
		if techStack == "React" {
			techStack = "Node"
		}
		tmpl, ok := neploker.GetDefaultTemplate(techStack)
		if !ok {
			logger.Error("no default template for tech stack: %s", techStack)
			return "", fmt.Errorf("no template for tech stack")
		}
		dockerfilePath := filepath.Join(versionPath, "Dockerfile")
		if err := neploker.WriteDockerfile(dockerfilePath, tmpl); err != nil {
			logger.Error("error writing dockerfile: %v", err)
			return "", err
		}
	}

	app.TechStackID = &tech.ID
	app.StorageLocation = versionPath
	if err := v.repos.Application.Update(ctx, app); err != nil {
		logger.Error("error updating application: %v", err)
		return "", err
	}

	version, err := v.repos.ApplicationVersion.GetOne(ctx, filters.IsSelectFilter("application_id", app.ID), filters.IsSelectFilter("version_tag", versionTag))
	if err != nil {
		logger.Error("error getting application version: %v", err)
		return "", err
	}

	version.StorageLocation = versionPath
	if err := v.repos.ApplicationVersion.Update(ctx, version); err != nil {
		logger.Error("error updating application version: %v", err)
		return "", err
	}

	if v.hub != nil {
		v.hub.BroadcastProgress(100, "Deployment complete!")
	}

	return versionPath, nil
}

func (v *versioning) DeleteVersion(ctx context.Context, appID string, versionID string) error {
	version, err := v.repos.ApplicationVersion.GetOneById(ctx, versionID)
	if err != nil {
		return fmt.Errorf("version not found: %w", err)
	}
	if version.ApplicationID != appID {
		return fmt.Errorf("version does not belong to the application")
	}
	if version.StorageLocation != "" {
		if err := os.RemoveAll(version.StorageLocation); err != nil {
			logger.Error("failed to delete storage folder: %v", err)
			// not fatal, continue
		}
	}
	return v.repos.ApplicationVersion.Delete(ctx, versionID)
}

// GetVersionLogs returns logs for a given app/version
func (v *versioning) GetVersionLogs(ctx context.Context, appID, versionID string) ([]string, error) {
	app, err := v.repos.Application.GetByID(ctx, appID)
	if err != nil {
		logger.Error("error getting app: %v", err)
		return nil, err
	}

	version, err := v.repos.ApplicationVersion.GetOneById(ctx, versionID)
	if err != nil {
		logger.Error("error getting version: %v", err)
		return nil, err
	}

	containerID, err := v.docker.GetContainerID(ctx, getContainerName(app.AppName, version.VersionTag))
	if err != nil || containerID == "" {
		logger.Error("error getting container id: %v", err)
		return nil, fmt.Errorf("container not found")
	}

	return v.docker.GetLogs(ctx, containerID, false)
}

func (v *versioning) resolveVersionTag(ctx context.Context, app model.Application, suggestedTag string) (string, error) {
	// First, try to get the existing version atomically
	existingVersion, err := v.repos.ApplicationVersion.GetOne(ctx,
		filters.IsSelectFilter("application_id", app.ID),
		filters.IsSelectFilter("version_tag", suggestedTag))

	// If version exists, return it
	if err == nil {
		return existingVersion.VersionTag, nil
	}

	// If it's not a "not found" error, return the error
	if !errors.Is(err, sql.ErrNoRows) {
		return "", err
	}

	// Version doesn't exist, try to create it
	version := model.ApplicationVersion{
		ApplicationID: app.ID,
		VersionTag:    suggestedTag,
		Description:   app.Description,
		Status:        "Created",
	}

	// Try to insert the new version
	insertedVersion, insertErr := v.repos.ApplicationVersion.UpsertOneDoNothing(ctx, version, "application_id", "version_tag")

	// If insertion succeeded, return the inserted version
	if insertErr == nil && insertedVersion.ID != "" {
		return insertedVersion.VersionTag, nil
	}

	// If we get sql.ErrNoRows, it means the upsert did nothing due to conflict
	// Try to get the existing version that was created by another concurrent request
	if insertErr == sql.ErrNoRows || insertedVersion.ID == "" {
		existingVersion, getErr := v.repos.ApplicationVersion.GetOne(ctx,
			filters.IsSelectFilter("application_id", app.ID),
			filters.IsSelectFilter("version_tag", suggestedTag))
		if getErr == nil {
			return existingVersion.VersionTag, nil
		}
	}

	// If we still can't find/create the version, prompt for a new tag
	if v.hub != nil {
		v.hub.BroadcastProgress(0, "Version conflict detected. Please enter a new version tag.")
		return v.promptForNewVersionTag(ctx, app, suggestedTag)
	}

	// If no websocket hub available, return an error
	return "", fmt.Errorf("version conflict: version %s already exists for application %s", suggestedTag, app.ID)
}

// promptForNewVersionTag interactively asks the user for a new version tag via websocket and retries the insert
func (v *versioning) promptForNewVersionTag(ctx context.Context, app model.Application, lastTag string) (string, error) {
	if v.hub == nil {
		return "", errors.New("websocket hub not available for interactive version conflict resolution")
	}
	for {
		msg := websocket.NewActionMessage(
			"request",
			"Version already exists",
			fmt.Sprintf("A version with tag %s already exists. Please enter a new version.", lastTag),
			[]websocket.Input{
				websocket.NewTextInput("versionTag", "e.g. v2.0.0"),
			},
		)
		msg.Action = "version_conflict"
		msg.Inputs[0].Value = lastTag
		resp := v.hub.BroadcastInteractive(msg)
		if resp == nil || resp.Data["versionTag"] == "" {
			return "", fmt.Errorf("no response for version conflict")
		}
		newTag := resp.Data["versionTag"].(string)

		// Use the same atomic logic as resolveVersionTag
		version := model.ApplicationVersion{
			ApplicationID: app.ID,
			VersionTag:    newTag,
			Description:   app.Description,
			Status:        "Created",
		}

		// Try to insert the new version
		insertedVersion, insertErr := v.repos.ApplicationVersion.UpsertOneDoNothing(ctx, version, "application_id", "version_tag")

		// If insertion succeeded, return the inserted version
		if insertErr == nil && insertedVersion.ID != "" {
			return insertedVersion.VersionTag, nil
		}

		// If we get sql.ErrNoRows or empty ID, it means conflict - try again with another tag
		if insertErr == sql.ErrNoRows || insertedVersion.ID == "" {
			lastTag = newTag // loop again if still duplicate
			continue
		}

		// If there's a different error, return it
		if insertErr != nil {
			return "", insertErr
		}

		// Shouldn't reach here, but just in case
		return insertedVersion.VersionTag, nil
	}
}

func getLatestGitTag(repoURL string) (string, error) {
	repo := git.NewRemote(nil, &gitconfig.RemoteConfig{
		Name: "origin",
		URLs: []string{repoURL},
	})

	refs, err := repo.List(&git.ListOptions{})
	if err != nil {
		return "", err
	}

	var tags []string
	for _, ref := range refs {
		if ref.Name().IsTag() {
			tags = append(tags, ref.Name().Short())
		}
	}

	if len(tags) == 0 {
		return "", fmt.Errorf("no valid tags found")
	}

	return tags[len(tags)-1], nil // último tag asumido más reciente
}

func sanitizeAppName(name string) string {
	safe := strings.ReplaceAll(name, " ", "-")
	safe = regexp.MustCompile(`[^a-zA-Z0-9-]`).ReplaceAllString(safe, "")
	return strings.ToLower(safe)
}
