package gateway

import (
	"net/http/httptest"
	"testing"
)

func TestRouteKeyGeneration(t *testing.T) {
	tests := []struct {
		name         string
		route        Route
		expectedKey  string
	}{
		{
			name: "Path-based route",
			route: Route{
				AppID:        "app1",
				Port:         "3000",
				Domain:       "localhost",
				Path:         "/myapp",
				EndpointType: "path",
			},
			expectedKey: "/myapp",
		},
		{
			name: "Subdomain route",
			route: Route{
				AppID:        "app2",
				Port:         "3000",
				Domain:       "example.com",
				Subdomain:    "myapp",
				EndpointType: "subdomain",
			},
			expectedKey: "myapp.example.com",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var routeKey string
			if tt.route.EndpointType == "subdomain" {
				routeKey = tt.route.Subdomain + "." + tt.route.Domain
			} else {
				routeKey = tt.route.Path
			}

			if routeKey != tt.expectedKey {
				t.Errorf("Expected route key %s, got %s", tt.expectedKey, routeKey)
			}
		})
	}
}

func TestSubdomainMatching(t *testing.T) {
	tests := []struct {
		name          string
		route         Route
		requestHost   string
		requestPath   string
		shouldMatch   bool
	}{
		{
			name: "Subdomain match",
			route: Route{
				AppID:        "app1",
				Domain:       "example.com",
				Subdomain:    "myapp",
				EndpointType: "subdomain",
			},
			requestHost: "myapp.example.com",
			requestPath: "/",
			shouldMatch: true,
		},
		{
			name: "Subdomain no match",
			route: Route{
				AppID:        "app1",
				Domain:       "example.com",
				Subdomain:    "myapp",
				EndpointType: "subdomain",
			},
			requestHost: "otherapp.example.com",
			requestPath: "/",
			shouldMatch: false,
		},
		{
			name: "Path match",
			route: Route{
				AppID:        "app1",
				Domain:       "example.com",
				Path:         "/myapp",
				EndpointType: "path",
			},
			requestHost: "example.com",
			requestPath: "/myapp/test",
			shouldMatch: true,
		},
		{
			name: "Path no match",
			route: Route{
				AppID:        "app1",
				Domain:       "example.com",
				Path:         "/myapp",
				EndpointType: "path",
			},
			requestHost: "example.com",
			requestPath: "/otherapp/test",
			shouldMatch: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a mock request
			req := httptest.NewRequest("GET", "http://"+tt.requestHost+tt.requestPath, nil)
			req.Host = tt.requestHost

			// Simulate the matching logic
			var matches bool
			if tt.route.EndpointType == "subdomain" {
				expectedHost := tt.route.Subdomain + "." + tt.route.Domain
				matches = req.Host == expectedHost
			} else {
				matches = false
				if tt.route.Path != "" {
					path := req.URL.Path
					matches = len(path) >= len(tt.route.Path) && path[:len(tt.route.Path)] == tt.route.Path
				}
			}

			if matches != tt.shouldMatch {
				t.Errorf("Expected match %v, got %v for route %+v and request host %s, path %s", 
					tt.shouldMatch, matches, tt.route, tt.requestHost, tt.requestPath)
			}
		})
	}
}

func TestValidateRoute(t *testing.T) {
	tests := []struct {
		name        string
		route       Route
		expectError bool
	}{
		{
			name: "Valid subdomain route",
			route: Route{
				AppID:        "app1",
				Port:         "3000",
				Domain:       "example.com",
				Subdomain:    "myapp",
				EndpointType: "subdomain",
			},
			expectError: false,
		},
		{
			name: "Valid path route",
			route: Route{
				AppID:        "app1",
				Port:         "3000",
				Domain:       "example.com",
				Path:         "/myapp",
				EndpointType: "path",
			},
			expectError: false,
		},
		{
			name: "Missing AppID",
			route: Route{
				Port:         "3000",
				Domain:       "example.com",
				Subdomain:    "myapp",
				EndpointType: "subdomain",
			},
			expectError: true,
		},
		{
			name: "Missing Port",
			route: Route{
				AppID:        "app1",
				Domain:       "example.com",
				Subdomain:    "myapp",
				EndpointType: "subdomain",
			},
			expectError: true,
		},
		{
			name: "Missing Domain",
			route: Route{
				AppID:        "app1",
				Port:         "3000",
				Subdomain:    "myapp",
				EndpointType: "subdomain",
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateRoute(tt.route)
			if tt.expectError && err == nil {
				t.Errorf("Expected error for invalid route %+v", tt.route)
			}
			if !tt.expectError && err != nil {
				t.Errorf("Expected no error for valid route %+v, got %v", tt.route, err)
			}
		})
	}
}