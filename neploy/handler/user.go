package handler

import (
	"context"
	"net/http"

	"github.com/labstack/echo/v4"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/service"
)

type User struct {
	user     service.User
	metadata service.Metadata
}

func NewUser(user service.User, metadata service.Metadata) *User {
	return &User{user: user, metadata: metadata}
}

func (u *User) RegisterRoutes(r *echo.Group) {
	r.GET("", u.GetUsers)
	r.POST("/invite", u.InviteUser)
	r.GET("/invite/:token", u.AcceptInvite)
	r.POST("/complete-invite", u.CompleteInvite)
	r.GET("/profile", u.Profile)
	r.PUT("/profile/update", u.UpdateProfile)
	r.PUT("/profile/update-password", u.UpdatePassword)
	r.PUT("/update-techstacks", u.SelectTechStacks)
}

// InviteUser godoc
// @Summary Invite a user
// @Description Invite a user
// @Tags User
// @Accept json
// @Produce json
// @Param request body model.InviteUserRequest true "Invite User Request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /user/invite [post]
func (h *User) InviteUser(c echo.Context) error {
	var req model.InviteUserRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	// Check if user already exists
	_, err := h.user.GetByEmail(c.Request().Context(), req.Email)
	if err == nil {
		return echo.NewHTTPError(http.StatusConflict, "User already exists in the system")
	}

	// Validate request
	if req.Email == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Email is required")
	}
	if req.Role == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Role is required")
	}

	// Send invitation
	if err := h.user.InviteUser(c.Request().Context(), req); err != nil {
		logger.Error("error inviting user: %v", err)
		if err.Error() == "user already exists" {
			return echo.NewHTTPError(http.StatusConflict, "User already exists in the system")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to send invitation")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Invitation sent successfully",
	})
}

// CompleteInvite godoc
// @Summary Complete user invitation
// @Description Complete user invitation
// @Tags User
// @Accept json
// @Produce json
// @Param request body model.CompleteInviteRequest true "Complete Invite Request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /user/complete-invite [post]
func (u *User) CompleteInvite(c echo.Context) error {
	var req model.CompleteInviteRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	// Accept the invitation
	invitation, err := u.user.AcceptInvitation(c.Request().Context(), req.Token)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Create user
	userReq := model.CreateUserRequest{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		DOB:       model.Date{Time: req.DOB},
		Phone:     req.Phone,
		Address:   req.Address,
		Email:     req.Email,
		Username:  req.Username,
		Password:  req.Password,
	}

	if err := u.user.Create(c.Request().Context(), userReq); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Add user to role
	if err := u.user.AddUserRole(c.Request().Context(), req.Email, invitation.Role); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusOK)
}

func (u *User) AcceptInvite(c echo.Context) error {
	token := c.Param("token")
	username := c.QueryParam("username")
	email := c.QueryParam("email")
	provider := c.QueryParam("provider")

	// Get the invitation
	invitation, err := u.user.GetInvitationByToken(context.Background(), token)
	if err != nil {
		logger.Error("failed to get invitation: token=%s, error=%v", token, err)
		return nil /* u.i.Render(c.Response(), c.Request(), "Auth/CompleteInvite", inertia.Props{
			"token":  token,
			"error":  "Invalid or expired invitation",
			"status": "invalid",
		}) */
	}

	props := echo.Map{
		"token":  token,
		"email":  invitation.Email,
		"status": "valid",
	}

	// Add OAuth data if present
	if username != "" {
		props["username"] = username
	}
	if email != "" {
		props["email"] = email
	}
	if provider != "" {
		props["provider"] = provider
	}

	return nil /* u.i.Render(c.Response(), c.Request(), "Auth/CompleteInvite", props) */
}

// Profile godoc
// @Summary Get user profile
// @Description Get user profile
// @Tags User
// @Accept json
// @Produce json
// @Success 200 {object} model.User
// @Failure 500 {object} map[string]interface{}
// @Router /users/profile [get]
func (u *User) Profile(c echo.Context) error {
	claims, ok := c.Get("claims").(model.JWTClaims)
	if !ok {
		logger.Error("error getting claims")
		return c.Redirect(http.StatusSeeOther, "/")
	}

	user, err := u.user.Get(c.Request().Context(), claims.ID)
	if err != nil {
		logger.Error("error getting user: %v", err)
		return c.Redirect(http.StatusSeeOther, "/dashboard")
	}

	provider, err := u.user.GetProvider(context.Background(), claims.ID)
	if err != nil {
		logger.Error("error getting provider: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Internal Server Error")
	}

	// userSidebar := model.UserResponse{
	// 	Email:    claims.Email,
	// 	Username: claims.Username,
	// 	Name:     claims.Name,
	// 	Provider: provider,
	// 	Roles:    claims.RolesLower,
	// }

	// metadata, err := u.metadata.Get(c.Request().Context())
	// if err != nil {
	// 	logger.Error("error getting metadata: %v", err)
	// 	return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	// }

	user.Provider = model.Provider(provider) // Convert string to Provider type

	return nil /* u.i.Render(c.Response(), c.Request(), "Auth/Profile", inertia.Props{"userData": user, "user": userSidebar, "teamName": metadata.TeamName, "logoUrl": metadata.LogoURL}) */
}

// UpdateProfile godoc
// @Summary Update user profile
// @Description Update user profile
// @Tags User
// @Accept json
// @Produce json
// @Success 200 {object} model.User
// @Failure 500 {object} map[string]interface{}
// @Router /users/profile/update [put]
func (u *User) UpdateProfile(c echo.Context) error {
	claims, ok := c.Get("claims").(model.JWTClaims)
	if !ok {
		logger.Error("error getting claims")
		return c.Redirect(http.StatusSeeOther, "/")
	}

	req := model.ProfileRequest{}
	if err := c.Bind(&req); err != nil {
		logger.Error("error binding request: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := u.user.UpdateProfile(c.Request().Context(), req, claims.ID); err != nil {
		logger.Error("error updating profile: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, req)
}

// UpdatePassword godoc
// @Summary Update user password
// @Description Update user password
// @Tags User
// @Accept json
// @Produce json
// @Success 200 {object} model.PasswordRequest
// @Failure 500 {object} map[string]interface{}
// @Router /users/profile/update-password [put]
func (u *User) UpdatePassword(c echo.Context) error {
	claims, ok := c.Get("claims").(model.JWTClaims)
	if !ok {
		logger.Error("error getting claims")
		return c.Redirect(http.StatusSeeOther, "/")
	}

	req := model.PasswordRequest{}
	if err := c.Bind(&req); err != nil {
		logger.Error("error binding request: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := u.user.UpdatePassword(c.Request().Context(), req, claims.ID); err != nil {
		logger.Error("error updating password: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, req)
}

// SelectTechStacks godoc
// @Summary Select user tech stacks
// @Description Select user tech stacks
// @Tags User
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /users/update-techstacks [put]
func (u *User) SelectTechStacks(c echo.Context) error {
	_, ok := c.Get("claims").(model.JWTClaims)
	if !ok {
		logger.Error("error getting claims")
		return c.Redirect(http.StatusSeeOther, "/dashboard/team")
	}

	req := model.SelectUserTechStacksRequest{}
	if err := c.Bind(&req); err != nil {
		logger.Error("error binding request: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err := c.Validate(req); err != nil {
		logger.Error("error validating request: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := u.user.UpdateTechStacks(c.Request().Context(), req); err != nil {
		logger.Error("error updating user tech stacks %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"success": true})
}

// GetUsers godoc
// @Summary Get all users
// @Description Get all users
// @Tags User
// @Accept json
// @Produce json
// @Success 200 {object} []model.User
// @Failure 500 {object} map[string]interface{}
// @Router /users [get]
func (u *User) GetUsers(c echo.Context) error {
	_, ok := c.Get("claims").(model.JWTClaims)
	if !ok {
		logger.Error("error getting claims")
		return c.Redirect(http.StatusSeeOther, "/")
	}

	users, err := u.user.GetAll(c.Request().Context())
	if err != nil {
		logger.Error("error getting users: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, users)
}
