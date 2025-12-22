package repository

import (
	"context"

	"neploy.dev/pkg/common"

	"github.com/doug-martin/goqu/v9"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/repository/filters"
	"neploy.dev/pkg/store"
)

type Application struct {
	Base[model.Application]
}

func NewApplication(db store.Queryable) *Application {
	return &Application{Base[model.Application]{Store: db, Table: "applications"}}
}

func (a *Application) Insert(ctx context.Context, application model.Application) (string, error) {
	var id string
	query := a.BaseQueryInsert().Rows(application).Returning("id")
	q, args, err := query.ToSQL()
	if err != nil {
		logger.Error("error building insert query: %v", err)
		return "", err
	}

	if err := a.Store.QueryRowxContext(ctx, q, args...).Scan(&id); err != nil {
		logger.Error("error executing insert query: %v", err)
		return "", err
	}

	common.AttachSQLToTrace(ctx, q)

	return id, nil
}

func (a *Application) Delete(ctx context.Context, id string) error {
	query := filters.ApplyUpdateFilters(
		a.BaseQueryUpdate().
			Set(goqu.Record{"deleted_at": goqu.L("CURRENT_TIMESTAMP")}),
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
