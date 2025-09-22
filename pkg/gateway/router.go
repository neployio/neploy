package gateway

import (
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"sync"

	"neploy.dev/pkg/repository"
)

type Route struct {
	AppID        string
	Port         string
	Domain       string
	Subdomain    string
	Path         string
	EndpointType string // "subdomain" or "path"
}

type Router struct {
	routes            map[string]*httputil.ReverseProxy
	routeInfo         map[string]Route
	mu                sync.RWMutex
	metrics           map[string]*MetricsCollector
	metricsAggregator *MetricsAggregator
	version           *repository.ApplicationVersion
	conf              *repository.GatewayConfig
	vtrace            *repository.VisitorTrace
	// Track user sessions to app context for asset requests
	userAppContext    map[string]string // maps IP -> current app
	contextMu         sync.RWMutex
}

func NewRouter(appStatRepo *repository.ApplicationStat, version *repository.ApplicationVersion, conf *repository.GatewayConfig, vtrace *repository.VisitorTrace) *Router {
	router := &Router{
		routes:         make(map[string]*httputil.ReverseProxy),
		routeInfo:      make(map[string]Route),
		metrics:        make(map[string]*MetricsCollector),
		mu:             sync.RWMutex{},
		version:        version,
		conf:           conf,
		vtrace:         vtrace,
		userAppContext: make(map[string]string),
		contextMu:      sync.RWMutex{},
	}

	// Create metrics aggregator without a specific collector
	router.metricsAggregator = NewMetricsAggregator(nil, appStatRepo)
	router.metricsAggregator.Start()

	return router
}

func (r *Router) Close() {
	if r.metricsAggregator != nil {
		r.metricsAggregator.Stop()
	}
}

func (r *Router) AddRoute(route Route) error {
	if err := ValidateRoute(route); err != nil {
		return err
	}

	target, err := url.Parse(fmt.Sprintf("http://localhost:%s", route.Port))
	if err != nil {
		return fmt.Errorf("invalid target URL: %v", err)
	}

	r.mu.Lock()
	if _, exists := r.metrics[route.AppID]; !exists {
		metrics, err := NewMetricsCollector("./data/metrics", route.AppID)
		if err != nil {
			log.Printf("ERROR: Failed to create metrics collector for app %s: %v", route.AppID, err)
		} else {
			r.metrics[route.AppID] = metrics
			if r.metricsAggregator != nil {
				r.metricsAggregator.AddCollector(metrics)
				r.metricsAggregator.aggregateAndSaveMetrics()

			}
		}
	}
	r.mu.Unlock()

	proxy := httputil.NewSingleHostReverseProxy(target)
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		// Save the original path before any modifications
		originalPath := req.URL.Path

		originalDirector(req)
		req.Host = req.URL.Host

		// Store the original path in header
		if req.Header == nil {
			req.Header = make(http.Header)
		}
		req.Header.Set("X-Original-Path", originalPath)

		// Check if this is a static asset request
		isStaticAsset := strings.Contains(originalPath, "/assets/") ||
			strings.HasSuffix(originalPath, ".css") ||
			strings.HasSuffix(originalPath, ".js") ||
			strings.HasSuffix(originalPath, ".png") ||
			strings.HasSuffix(originalPath, ".jpg") ||
			strings.HasSuffix(originalPath, ".jpeg") ||
			strings.HasSuffix(originalPath, ".svg") ||
			strings.HasSuffix(originalPath, ".ico")

		if route.Path != "" {
			versionPrefix := req.Header.Get("Resolved-Version")
			basePath := "/" + versionPrefix + route.Path

			if isStaticAsset && strings.HasPrefix(originalPath, "/v") {
				parts := strings.Split(originalPath, "/")
				if len(parts) >= 3 {
					assetPath := "/" + strings.Join(parts[3:], "/")
					req.URL.Path = assetPath
					return
				}
			}

			// Standard path handling for non-static assets
			trimmed := strings.TrimPrefix(req.URL.Path, basePath)

			// Fallback si no coincide completamente
			if trimmed == req.URL.Path {
				trimmed = strings.TrimPrefix(req.URL.Path, route.Path)
			}

			if trimmed == "" {
				trimmed = "/" // fallback para evitar path vacío
			}

			// Asegurar que comienza con /
			if !strings.HasPrefix(trimmed, "/") {
				trimmed = "/" + trimmed
			}

			req.URL.Path = trimmed
		}
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("ERROR: Proxy error for route %s to %s: %v", route.Path, target.String(), err)
		w.WriteHeader(http.StatusBadGateway)
		fmt.Fprintf(w, "Error: %v", err)
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	var routeKey string
	if route.EndpointType == "subdomain" {
		routeKey = route.Subdomain + "." + route.Domain
	} else {
		routeKey = route.Path
	}
	
	r.routes[routeKey] = proxy
	r.routeInfo[routeKey] = route

	return nil
}

func (r *Router) RemoveRoute(routeKey string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.routes, routeKey)
	delete(r.routeInfo, routeKey)
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	config, err := r.conf.Get(req.Context())
	if err != nil {
		log.Printf("ERROR: Failed to get gateway config: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error: %v", err)
		return
	}

	resolver := VersionRoutingMiddleware(config, r.version)
	resolver(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		r.mu.RLock()
		defer r.mu.RUnlock()

		for routeKey, proxy := range r.routes {
			route := r.routeInfo[routeKey]
			if r.matchesRoute(req, route) {
				var handler http.Handler = proxy

				if r.metrics != nil {
					handler = LoggingMiddleware(handler, r.metrics[route.AppID])
				} else {
					log.Printf("WARN: Metrics collector not available")
				}

				handler = CacheMiddleware(handler)
				handler = VisitorTraceMiddleware(r.vtrace)(handler)

				handler.ServeHTTP(w, req)
				return
			}
		}

		if strings.Contains(req.URL.Path, ".well-known") {
			w.WriteHeader(http.StatusContinue)
			return
		}

		log.Printf("WARN: No matching route found for path: %s, host: %s", req.URL.Path, req.Host)

		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintf(w, "404 Not Found")
	})).ServeHTTP(w, req)
}

func (r *Router) matchesRoute(req *http.Request, route Route) bool {
	// Use the original path stored in the header if available
	path := req.URL.Path
	if originalPath := req.Header.Get("X-Original-Path"); originalPath != "" {
		path = originalPath
	}

	// Extract user IP for context tracking
	userIP := req.RemoteAddr
	if forwarded := req.Header.Get("X-Forwarded-For"); forwarded != "" {
		userIP = strings.Split(forwarded, ",")[0]
	}

	// Handle asset requests without version prefix
	if isAssetRequest(path) && !strings.HasPrefix(path, "/v") {
		log.Printf("DEBUG: Asset request detected - path: %s, route.Path: %s, route.AppID: %s", path, route.Path, route.AppID)
		
		// Try to get app context from user's previous requests
		contextApp := r.getUserAppContext(userIP)
		log.Printf("DEBUG: User %s context app: %s", userIP, contextApp)
		
		if contextApp != "" {
			// Check if this route belongs to the user's current app context
			appName := ExtractAppName(route.Path)
			log.Printf("DEBUG: Extracted app name from route.Path '%s': '%s'", route.Path, appName)
			
			if appName == "" {
				// If we can't extract from path, try using a mapping or default logic
				// For now, let's assume the contextApp matches any route if it's the only one
				log.Printf("DEBUG: No app name extracted, allowing asset request")
				return true
			}
			if appName == contextApp {
				log.Printf("DEBUG: App name matches context, allowing asset request")
				return true
			}
		}
		
		// Fallback: check referrer header
		if referrer := req.Header.Get("Referer"); referrer != "" {
			log.Printf("DEBUG: Checking referrer: %s", referrer)
			if referrerURL, err := url.Parse(referrer); err == nil {
				referrerApp := ExtractAppName(referrerURL.Path)
				appName := ExtractAppName(route.Path)
				log.Printf("DEBUG: Referrer app: %s, Route app: %s", referrerApp, appName)
				
				if referrerApp != "" && (appName == referrerApp || appName == "") {
					// Update user context with the referrer app
					if referrerApp != "" {
						r.setUserAppContext(userIP, referrerApp)
					}
					log.Printf("DEBUG: Referrer matches, allowing asset request")
					return true
				}
			}
		}
		
		// Last resort: if this is the only route or first route, allow it
		// This helps with initial asset loading
		if len(r.routes) == 1 {
			log.Printf("DEBUG: Only one route available, allowing asset request")
			return true
		}
		
		log.Printf("DEBUG: Asset request denied for path: %s", path)
	}

	// Check for subdomain or path matching
	var matches bool
	var appName string

	if route.EndpointType == "subdomain" {
		// Subdomain matching
		host := req.Host
		expectedHost := route.Subdomain + "." + route.Domain
		matches = strings.HasPrefix(host, expectedHost)
		appName = route.Subdomain
	} else {
		// Path matching
		if route.Path != "" {
			matches = strings.HasPrefix(path, route.Path)
			appName = ExtractAppName(route.Path)
		}
	}
	
	// Track user app context for non-asset requests
	if matches && !isAssetRequest(path) && appName != "" {
		r.setUserAppContext(userIP, appName)
	}
	
	return matches
}

func ValidateRoute(route Route) error {
	if route.AppID == "" {
		return fmt.Errorf("appID is required")
	}
	if route.Port == "" {
		return fmt.Errorf("port is required")
	}
	if route.Domain == "" {
		return fmt.Errorf("domain is required")
	}
	return nil
}

// setUserAppContext tracks which app a user is currently viewing
func (r *Router) setUserAppContext(userIP, appName string) {
	r.contextMu.Lock()
	defer r.contextMu.Unlock()
	r.userAppContext[userIP] = appName
}

// getUserAppContext retrieves the current app for a user
func (r *Router) getUserAppContext(userIP string) string {
	r.contextMu.RLock()
	defer r.contextMu.RUnlock()
	return r.userAppContext[userIP]
}

// isAssetRequest checks if the request is for a static asset
func isAssetRequest(path string) bool {
	return strings.Contains(path, "/assets/") ||
		strings.HasSuffix(path, ".css") ||
		strings.HasSuffix(path, ".js") ||
		strings.HasSuffix(path, ".png") ||
		strings.HasSuffix(path, ".jpg") ||
		strings.HasSuffix(path, ".jpeg") ||
		strings.HasSuffix(path, ".svg") ||
		strings.HasSuffix(path, ".ico") ||
		strings.HasSuffix(path, ".webp") ||
		strings.HasSuffix(path, ".gif")
}
