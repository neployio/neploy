package repository

import (
	"context"

	"github.com/doug-martin/goqu/v9"
	"neploy.dev/pkg/common"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/repository/filters"
	"neploy.dev/pkg/store"
)

type ApplicationVersion struct {
	Base[model.ApplicationVersion]
}

func NewApplicationVersion(db store.Queryable) *ApplicationVersion {
	return &ApplicationVersion{Base[model.ApplicationVersion]{Store: db, Table: "application_versions"}}
}

func (a *ApplicationVersion) Delete(ctx context.Context, id string) error {
	query := filters.ApplyUpdateFilters(
		a.BaseQueryUpdate().Set(goqu.Record{"deleted_at": goqu.L("CURRENT_TIMESTAMP")}),
		filters.IsUpdateFilter("id", id),
	)

	q, args, err := query.ToSQL()
	if err != nil {
		logger.Error("error building delete query: %v", err)
		return err
	}

	if _, err := a.Store.ExecContext(ctx, q, args...); err != nil {
		logger.Error("error executing delete query: %v", err)
		return err
	}

	common.AttachSQLToTrace(ctx, q)
	return nil
}

func (a *ApplicationVersion) Exists(ctx context.Context, appID, tag string) (bool, error) {
	row, err := a.GetOne(ctx, filters.IsSelectFilter("application_id", appID), filters.IsSelectFilter("version_tag", tag))
	return row.ID != "", err
}

func (a *ApplicationVersion) ExistsByName(ctx context.Context, name, tag string) (bool, error) {
	query := a.baseQuery("v").
		Select(goqu.I("v.*")).
		LeftJoin(
			goqu.T("gateways").As("g"),
			goqu.On(goqu.I("g.application_id").Eq(goqu.I("v.application_id"))),
		).Where(goqu.I("g.path").Eq("/" + name)).Where(goqu.I("v.version_tag").Eq(tag))

	q, args, err := query.ToSQL()
	if err != nil {
		logger.Error("error building select query: %v", err)
		return false, err
	}

	var row model.ApplicationVersion
	if err := a.Store.GetContext(ctx, &row, q, args...); err != nil {
		logger.Error("error executing exists by name %s: %v", name, err)
		return false, err
	}

	common.AttachSQLToTrace(ctx, q)
	return row.ID != "", err
}

// GetLatestVersionByName retrieves the most recently created version for an app by its path name
func (a *ApplicationVersion) GetLatestVersionByName(ctx context.Context, name string) (string, error) {
	query := a.baseQuery("v").
		Select(goqu.I("v.version_tag")).
		LeftJoin(
			goqu.T("gateways").As("g"),
			goqu.On(goqu.I("g.application_id").Eq(goqu.I("v.application_id"))),
		).
		Where(goqu.I("g.path").Eq("/" + name)).
		Where(goqu.I("v.deleted_at").IsNull()).
		Order(goqu.I("v.created_at").Desc()).
		Limit(1)

	q, args, err := query.ToSQL()
	if err != nil {
		logger.Error("error building latest version query: %v", err)
		return "", err
	}

	var versionTag string
	if err := a.Store.GetContext(ctx, &versionTag, q, args...); err != nil {
		logger.Error("error getting latest version for app %s: %v", name, err)
		return "", err
	}

	common.AttachSQLToTrace(ctx, q)
	return versionTag, nil
}
