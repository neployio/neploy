package service

import (
	"context"
	"fmt"
	"neploy.dev/pkg/logger"

	"github.com/google/uuid"
	"github.com/pkg/errors"
	neployway "neploy.dev/pkg/gateway"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/repository"
)

type Gateway interface {
	Create(ctx context.Context, gateway model.Gateway) error
	Update(ctx context.Context, gateway model.Gateway) error
	Delete(ctx context.Context, id string) error
	Get(ctx context.Context, id string) (model.Gateway, error)
	ListByApp(ctx context.Context, appID string) ([]model.Gateway, error)
	AddRoute(ctx context.Context, gateway model.Gateway) error
	RemoveRoute(ctx context.Context, gateway model.Gateway) error
	GetAll(ctx context.Context) ([]model.FullGateway, error)
	GetConfig(ctx context.Context) (model.GatewayConfig, error)
	SaveConfig(ctx context.Context, req model.GatewayConfigRequest) (model.GatewayConfig, error)
}

type gateway struct {
	router *neployway.Router
	repos  repository.Repositories
}

func NewGateway(repos repository.Repositories) Gateway {
	return &gateway{
		router: neployway.NewRouter(
			repos.ApplicationStat,
			repos.ApplicationVersion,
			repos.GatewayConfig,
			repos.VisitorTrace,
		),
		repos: repos,
	}
}

func (s *gateway) validateGateway(ctx context.Context, gateway model.Gateway) error {
	// Validate required fields
	if gateway.ApplicationID == "" {
		return errors.New("application ID is required")
	}
	if gateway.Domain == "" {
		return errors.New("domain is required")
	}

	// Check if application exists
	_, err := s.repos.Application.GetByID(ctx, gateway.ApplicationID)
	if err != nil {
		return errors.Wrap(err, "application not found")
	}

	return nil
}

func (s *gateway) Create(ctx context.Context, gateway model.Gateway) error {
	if err := s.validateGateway(ctx, gateway); err != nil {
		return err
	}

	gateway.ID = uuid.New().String()
	gateway.Status = "active"

	if err := s.repos.Gateway.Insert(ctx, gateway); err != nil {
		return err
	}

	return s.AddRoute(ctx, gateway)
}

func (s *gateway) Update(ctx context.Context, gateway model.Gateway) error {
	if err := s.validateGateway(ctx, gateway); err != nil {
		return err
	}

	oldGateway, err := s.Get(ctx, gateway.ID)
	if err != nil {
		return err
	}

	// Remove old route
	if err := s.RemoveRoute(ctx, oldGateway); err != nil {
		return err
	}

	// Add new route
	if err := s.AddRoute(ctx, gateway); err != nil {
		return err
	}

	return s.repos.Gateway.Update(ctx, gateway)
}

func (s *gateway) Delete(ctx context.Context, id string) error {
	gateway, err := s.Get(ctx, id)
	if err != nil {
		return err
	}

	if err := s.RemoveRoute(ctx, gateway); err != nil {
		return err
	}

	return s.repos.Gateway.Delete(ctx, id)
}

func (s *gateway) Get(ctx context.Context, id string) (model.Gateway, error) {
	gateway, err := s.repos.Gateway.GetByID(ctx, id)
	if err != nil {
		return model.Gateway{}, errors.Wrap(err, "failed to get gateway")
	}
	return gateway, nil
}

func (s *gateway) ListByApp(ctx context.Context, appID string) ([]model.Gateway, error) {
	gateways, err := s.repos.Gateway.GetByApplicationID(ctx, appID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to list gateways")
	}
	return gateways, nil
}

func (s *gateway) AddRoute(ctx context.Context, gateway model.Gateway) error {
	route := neployway.Route{
		AppID:        gateway.ApplicationID,
		Port:         gateway.Port,
		Domain:       gateway.Domain,
		Subdomain:    gateway.Subdomain,
		Path:         gateway.Path,
		EndpointType: gateway.EndpointType,
	}

	if err := s.router.AddRoute(route); err != nil {
		gateway.Status = "error"
		s.repos.Gateway.Update(ctx, gateway)
		return fmt.Errorf("failed to add route: %v", err)
	}

	gateway.Status = "active"
	return s.repos.Gateway.Update(ctx, gateway)
}

func (s *gateway) RemoveRoute(ctx context.Context, gateway model.Gateway) error {
	var routeKey string
	if gateway.EndpointType == "subdomain" {
		routeKey = gateway.Subdomain + "." + gateway.Domain
	} else {
		routeKey = gateway.Path
	}

	s.router.RemoveRoute(routeKey)
	return nil
}

func (s *gateway) GetAll(ctx context.Context) ([]model.FullGateway, error) {
	gateways, err := s.repos.Gateway.GetAll(ctx)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get gateways")
	}

	var fullGateways []model.FullGateway
	for _, gateway := range gateways {
		application, err := s.repos.Application.GetByID(ctx, gateway.ApplicationID)
		if err != nil {
			return nil, errors.Wrap(err, "failed to get application")
		}

		fullGateway := model.FullGateway{
			Gateway:     gateway,
			Application: application,
		}
		fullGateways = append(fullGateways, fullGateway)
	}

	return fullGateways, nil
}

func (s *gateway) GetConfig(ctx context.Context) (model.GatewayConfig, error) {
	config, err := s.repos.GatewayConfig.Get(ctx)
	if err != nil {
		logger.Error("error getting gateway config: %v", err)
		return model.GatewayConfig{}, err
	}

	return config, err
}

func (s *gateway) SaveConfig(ctx context.Context, req model.GatewayConfigRequest) (model.GatewayConfig, error) {
	config := model.GatewayConfig{
		DefaultVersioningType: req.DefaultVersioning,
	}

	config, err := s.repos.GatewayConfig.Upsert(ctx, config)
	if err != nil {
		logger.Error("error saving gateway config: %v", err)
		return model.GatewayConfig{}, err
	}

	return config, nil
}
