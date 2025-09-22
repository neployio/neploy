# Subdomain Support Implementation

This implementation adds subdomain support to the Neploy application deployment platform, allowing applications to be accessed via subdomains instead of only path-based routing.

## Features Added

### 1. Backend Changes

- **Enhanced Gateway Model**: Added `Subdomain` and `EndpointType` fields to support both routing types
- **Flexible Deployment**: Modified application deployment to accept endpoint type and domain configuration
- **Smart Router**: Updated gateway router to handle both subdomain and path-based routing
- **Service Layer**: Enhanced gateway service with subdomain creation and management

### 2. Frontend Changes

- **Configuration UI**: Added endpoint type selection to application deployment form
- **Domain Configuration**: Added domain input field for subdomain routing
- **Enhanced Gateway Table**: Updated to show endpoint type and appropriate URL format
- **Type Safety**: Added proper TypeScript types for subdomain configuration

## Usage

### Path-based Routing (Default)
- **URL Pattern**: `domain.com/appname`
- **Configuration**: Select "Path-based" in deployment form
- **Example**: `localhost/myapp` or `company.com/api`

### Subdomain Routing (New)
- **URL Pattern**: `appname.domain.com`
- **Configuration**: Select "Subdomain" in deployment form and specify domain
- **Example**: `myapp.localhost` or `api.company.com`

## Technical Implementation

### Gateway Model
```go
type Gateway struct {
    Domain        string `json:"domain"`
    Subdomain     string `json:"subdomain"`
    Path          string `json:"path"`
    EndpointType  string `json:"endpointType"` // "subdomain" or "path"
    // ... other fields
}
```

### Route Matching Logic
- **Subdomain**: Matches `Host` header against `subdomain.domain`
- **Path**: Matches URL path prefix against configured path

### Database Schema
The existing database already supported subdomains with:
- `subdomain` column for subdomain value
- `endpoint_type` column with constraint `('subdomain', 'path')`
- Unique constraints for both subdomain and path routing

## Benefits

1. **Flexibility**: Companies can choose their preferred routing method
2. **Clean URLs**: Subdomain routing provides cleaner, more professional URLs
3. **Separation**: Better logical separation of applications
4. **Backward Compatibility**: Existing path-based deployments continue to work

## Example Deployment Flow

1. User deploys an application called "blog"
2. Selects "Subdomain" endpoint type
3. Specifies domain as "company.com"
4. Application becomes accessible at `blog.company.com`
5. Gateway table shows endpoint type and full URL

## Testing

Basic tests have been added to verify:
- Route key generation for both types
- Subdomain and path matching logic
- Route validation

Run tests with: `go test ./pkg/gateway -v`