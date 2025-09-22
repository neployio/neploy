package model

type BaseEntity struct {
	ID        string `json:"id" db:"id" goqu:"skipinsert,skipupdate"`
	CreatedAt Date   `json:"createdAt" db:"created_at" goqu:"skipinsert,skipupdate"`
	UpdatedAt Date   `json:"updatedAt" db:"updated_at" goqu:"skipinsert,skipupdate,omitzero"`
	DeletedAt *Date  `json:"deletedAt" db:"deleted_at" goqu:"skipinsert,skipupdate,omitnil"`
}

type BaseRelation struct {
	CreatedAt Date `json:"createdAt" db:"created_at"`
	UpdatedAt Date `json:"updatedAt" db:"updated_at"`
	DeletedAt Date `json:"deletedAt" db:"deleted_at"`
}

type User struct {
	BaseEntity
	Username  string `json:"username" db:"username" goqu:"skipupdate"`
	Password  string `json:"password" db:"password" goqu:"omitempty"`
	Email     string `json:"email" db:"email"`
	FirstName string `json:"firstName" db:"first_name"`
	LastName  string `json:"lastName" db:"last_name"`
	DOB       Date   `json:"dob" db:"dob"`
	Address   string `json:"address" db:"address"`
	Phone     string `json:"phone" db:"phone"`
	Provider  Provider `json:"provider" db:"provider"`
}

type Role struct {
	BaseEntity
	Name        string `json:"name" db:"name"`
	Description string `json:"description" db:"description"`
	Icon        string `json:"icon" db:"icon"`
	Color       string `json:"color" db:"color"`
}

type Application struct {
	BaseEntity
	AppName         string  `json:"appName" db:"app_name"`
	Description     string  `json:"description" db:"description"`
	StorageLocation string  `json:"storageLocation" db:"storage_location"`
	TechStackID     *string `json:"techStackId" db:"tech_stack_id" goqu:"omitempty,omitnil,skipinsert"`
}

type TechStack struct {
	BaseEntity
	Name        string `json:"name" db:"name"`
	Description string `json:"description" db:"description"`
}

type UserRoles struct {
	BaseRelation
	UserID string `json:"userId" db:"user_id"`
	RoleID string `json:"roleId" db:"role_id"`
	User   *User  `json:"user" db:"user"`
	Role   *Role  `json:"role" db:"role"`
}

type UserTechStack struct {
	BaseRelation
	UserID      string     `json:"userId" db:"user_id"`
	TechStackID string     `json:"techStackId" db:"tech_stack_id"`
	User        *User      `json:"user" db:"user"`
	TechStack   *TechStack `json:"techStack" db:"tech_stack"`
}

type Trace struct {
	BaseEntity
	UserID          string `json:"userId" db:"user_id"`
	Type            string `json:"type" db:"type"`
	Action          string `json:"action" db:"action"`
	ActionTimestamp Date   `json:"actionTimestamp" db:"action_timestamp"`
	SqlStatement    string `json:"sqlStatement" db:"sql_statement"`
	Email           string `json:"email" db:"-"`
}

type Gateway struct {
	BaseEntity
	Domain        string `json:"domain" db:"domain"`
	Subdomain     string `json:"subdomain" db:"subdomain"`
	Path          string `json:"path" db:"path"`
	Port          string `json:"port" db:"port"`
	ApplicationID string `json:"applicationId" db:"application_id"`
	Status        string `json:"status" db:"status"` // "active", "inactive", "error"
	EndpointType  string `json:"endpointType" db:"endpoint_type"` // "subdomain", "path"
}

type ApplicationStat struct {
	BaseEntity
	ApplicationID string `json:"application_id" db:"application_id"`
	Date          Date   `json:"date" db:"date"`
	Requests      int    `json:"requests" db:"requests"`
	Errors        int    `json:"errors" db:"errors"`
	AppName       string `json:"name,omitempty" db:"-"`
}

type VisitorTrace struct {
	BaseEntity
	ApplicationID    string `json:"application_id" db:"application_id"`
	IpAddress        string `json:"ip_address" db:"ip_address"`
	Device           string `json:"device" db:"device"`
	Browser          string `json:"browser" db:"browser"`
	Os               string `json:"os" db:"os"`
	PageVisited      string `json:"page_visited" db:"page_visited"`
	VisitDuration    int    `json:"visit_duration" db:"visit_duration"`
	VisitedTimestamp Date   `json:"visit_timestamp" db:"visit_timestamp"`
}

// UserOAuth struct has been removed as part of OAuth refactoring

type Metadata struct {
	BaseEntity
	TeamName string `json:"team_name" db:"team_name"`
	LogoURL  string `json:"logo_url" db:"logo_url"`
	Language string `json:"language" db:"language"`
}

type Invitation struct {
	BaseEntity
	Email      string `json:"email" db:"email"`
	Role       string `json:"role" db:"role"`
	Token      string `json:"token" db:"token"`
	ExpiresAt  Date   `json:"expires_at" db:"expires_at"`
	AcceptedAt *Date  `json:"accepted_at,omitempty" db:"accepted_at"`
}

type GatewayConfig struct {
	BaseEntity
	DefaultVersioningType VersioningType `json:"defaultVersioningType,omitempty" db:"default_versioning_type"`
}

type ApplicationVersion struct {
	BaseEntity
	VersionTag      string `json:"versionTag" db:"version_tag"`
	Description     string `json:"description" db:"description"`
	Status          string `json:"status" db:"status"`                    // Running, Stopped, etc.
	StorageLocation string `json:"StorageLocation" db:"storage_location"` // Aquí va la ruta final al binario/despliegue
	ApplicationID   string `json:"applicationId" db:"application_id"`
}
