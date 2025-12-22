package model

import "time"

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=64"`
}

type CreateUserRequest struct {
	Email     string   `json:"email" validate:"required,email"`
	Password  string   `json:"password" validate:"required,min=8,max=64"`
	FirstName string   `json:"firstName" validate:"required,min=2,max=64"`
	LastName  string   `json:"lastName" validate:"required,min=2,max=64"`
	Username  string   `json:"username" validate:"required,min=2,max=64"`
	DOB       Date     `json:"dob" validate:"required"`
	Address   string   `json:"address" validate:"required,min=2,max=128"`
	Phone     string   `json:"phone" validate:"required,min=10,max=10"`
	Provider  string   `json:"provider" validate:"required,min=2,max=64"`
	Roles     []string `json:"roles,omitempty"`
}

type CreateRoleRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=64"`
	Description string `json:"description" validate:"required,min=2,max=128"`
	Icon        string `json:"icon" validate:"required,min=2,max=64"`
	Color       string `json:"color" validate:"required,min=2,max=64"`
}

type OnboardRequest struct {
	AdminUser CreateUserRequest   `json:"adminUser" validate:"required"`
	Roles     []CreateRoleRequest `json:"roles" validate:"required"`
	Metadata  MetadataRequest     `json:"metadata" validate:"required"`
}

type MetadataRequest struct {
	Name     string `json:"teamName" db:"team_name"`
	LogoURL  string `json:"logoUrl" db:"logo_url"`
	Language string `json:"language" db:"language"`
}

type InviteUserRequest struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

type CompleteInviteRequest struct {
	Token     string    `json:"token" validate:"required"`
	FirstName string    `json:"firstName" validate:"required"`
	LastName  string    `json:"lastName" validate:"required"`
	DOB       time.Time `json:"dob" validate:"required"`
	Phone     string    `json:"phone" validate:"required,min=10,max=10"`
	Address   string    `json:"address" validate:"required,min=2,max=128"`
	Email     string    `json:"email" validate:"required,email"`
	Username  string    `json:"username" validate:"required"`
	Password  string    `json:"password" validate:"required,min=8,max=64"`
}

type CreateApplicationRequest struct {
	AppName     string `json:"appName"`
	Description string `json:"description"`
}

type DeployApplicationRequest struct {
	RepoURL      string `json:"repoUrl"`
	Branch       string `json:"branch"`
	EndpointType string `json:"endpointType,omitempty"` // "subdomain" or "path"
	Domain       string `json:"domain,omitempty"`       // domain for subdomain routing
}

type GetBranchesRequest struct {
	RepoURL string `json:"repoUrl"`
}

type CreateTechStackRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=64"`
	Description string `json:"description" validate:"required,min=2,max=128"`
}

type GatewayConfigRequest struct {
	DefaultVersioning VersioningType `json:"defaultVersioning" validate:"required,oneof=header uri"`
}

type CreateGatewayRequest struct {
	Domain        string `json:"domain" validate:"required"`
	Subdomain     string `json:"subdomain"`
	Path          string `json:"path"`
	Port          string `json:"port" validate:"required"`
	ApplicationID string `json:"applicationId" validate:"required"`
	EndpointType  string `json:"endpointType" validate:"required,oneof=subdomain path"`
}

type ProfileRequest struct {
	Email         string `json:"email" validate:"required,email"`
	FirstName     string `json:"firstName" validate:"required,min=2"`
	LastName      string `json:"lastName" validate:"required,min=2"`
	Dob           Date   `json:"dob" validate:"required"`
	Address       string `json:"address" validate:"required,min=5"`
	Phone         string `json:"phone" validate:"required,min=5"`
	Notifications bool   `json:"notifications"`
}

type PasswordRequest struct {
	CurrentPassword string `json:"currentPassword" validate:"omitempty"`
	NewPassword     string `json:"newPassword" validate:"required,min=8"`
	ConfirmPassword string `json:"confirmPassword" validate:"required,min=8"`
	Reset           bool   `json:"reset,omitempty"`
}

type SelectUserTechStacksRequest struct {
	TechStackIDs []string `json:"techIds" validate:"required"`
	UserId       string   `json:"userId" validate:"required"`
}

type UserRoleRequest struct {
	UserIds []string `json:"userIds" validate:"required"`
}
