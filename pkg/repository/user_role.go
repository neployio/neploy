package repository

import (
	"context"

	"neploy.dev/pkg/common"

	"github.com/doug-martin/goqu/v9"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/store"
)

type UserRole struct {
	Base[model.UserRoles]
}

func NewUserRole(db store.Queryable) *UserRole {
	return &UserRole{Base[model.UserRoles]{Store: db, Table: "user_roles"}}
}

func (u *UserRole) GetByUserID(ctx context.Context, userID string) ([]model.UserRoles, error) {
	q := u.baseQuery("ur").
		Select(
			goqu.I("ur.*"),
			goqu.L(`"u"."id" AS "user.id"`),
			goqu.L(`"u"."first_name" AS "user.first_name"`),
			goqu.L(`"u"."last_name" AS "user.last_name"`),
			goqu.L(`"u"."email" AS "user.email"`),
			goqu.L(`"r"."id" AS "role.id"`),
			goqu.L(`"r"."name" AS "role.name"`),
			goqu.L(`"r"."description" AS "role.description"`),
		).
		LeftJoin(
			goqu.T("users").As("u"),
			goqu.On(goqu.I("u.id").Eq(goqu.I("ur.user_id"))),
		).
		LeftJoin(
			goqu.T("roles").As("r"),
			goqu.On(goqu.I("r.id").Eq(goqu.I("ur.role_id"))),
		).
		Where(goqu.I("u.id").Eq(userID))

	query, args, err := q.ToSQL()
	if err != nil {
		logger.Error("Failed to get user roles: %v", err)
		return nil, err
	}

	var userRoles []model.UserRoles
	if err := u.Store.SelectContext(ctx, &userRoles, query, args...); err != nil {
		logger.Error("Failed to get user roles: %v", err)
		return nil, err
	}

	common.AttachSQLToTrace(ctx, query)
	return userRoles, nil
}

func (u *UserRole) GetByRoleID(ctx context.Context, roleID string) ([]model.UserRoles, error) {
	q := u.baseQuery("ur").
		Select(
			goqu.I("ur.*"),
			goqu.L(`"u"."id" AS "user.id"`),
			goqu.L(`"u"."first_name" AS "user.first_name"`),
			goqu.L(`"u"."last_name" AS "user.last_name"`),
			goqu.L(`"u"."email" AS "user.email"`),
			goqu.L(`"r"."id" AS "role.id"`),
			goqu.L(`"r"."name" AS "role.name"`),
			goqu.L(`"r"."description" AS "role.description"`),
		).
		LeftJoin(goqu.T("users").As("u"), goqu.On(goqu.I("u.id").Eq(goqu.I("ur.user_id")))).
		LeftJoin(goqu.T("roles").As("r"), goqu.On(goqu.I("r.id").Eq(goqu.I("ur.role_id")))).
		Where(goqu.I("r.id").Eq(roleID))

	query, args, err := q.ToSQL()
	if err != nil {
		logger.Error("Failed to get user roles: %v", err)
		return nil, err
	}

	var userRoles []model.UserRoles
	if err := u.Store.SelectContext(ctx, &userRoles, query, args...); err != nil {
		logger.Error("Failed to get user roles: %v", err)
		return nil, err
	}

	common.AttachSQLToTrace(ctx, query)
	return userRoles, nil
}

func (u *UserRole) Delete(ctx context.Context, userRole model.UserRoles) error {
	q := u.BaseQueryUpdate().
		Set(goqu.Record{"deleted_at": goqu.L("CURRENT_TIMESTAMP")}).
		Where(
			goqu.I("user_id").Eq(userRole.UserID),
			goqu.I("role_id").Eq(userRole.RoleID),
		)

	query, args, err := q.ToSQL()
	if err != nil {
		logger.Error("Failed to create delete query user role: %v", err)
		return err
	}

	if _, err := u.Store.ExecContext(ctx, query, args...); err != nil {
		logger.Error("Failed to delete user role: %v", err)
		return err
	}

	common.AttachSQLToTrace(ctx, query)
	return nil
}
