package repository

import (
	"context"
	"errors"

	"neploy.dev/pkg/common"

	"github.com/doug-martin/goqu/v9"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/repository/filters"
	"neploy.dev/pkg/store"
)

type Gateway struct {
	Base[model.Gateway]
}

func NewGateway(db store.Queryable) *Gateway {
	return &Gateway{Base[model.Gateway]{Store: db, Table: "gateways"}}
}

func (g *Gateway) Insert(ctx context.Context, gateway model.Gateway) error {
	if _, err := g.GetOne(ctx, filters.IsSelectFilter("path", "/"+gateway.Path)); err == nil {
		return errors.New("path already exists")
	}

	query := g.BaseQueryInsert().Rows(gateway)
	q, args, err := query.ToSQL()
	if err != nil {
		logger.Error("error building insert query: %v", err)
		return err
	}

	if _, err := g.Store.ExecContext(ctx, q, args...); err != nil {
		logger.Error("error executing insert query: %v", err)
		return err
	}

	common.AttachSQLToTrace(ctx, q)
	return nil
}

func (g *Gateway) Delete(ctx context.Context, id string) error {
	query := filters.ApplyUpdateFilters(
		g.BaseQueryUpdate().
			Set(goqu.Record{"deleted_at": goqu.L("CURRENT_TIMESTAMP")}),
		filters.IsUpdateFilter("id", id),
	)

	q, args, err := query.ToSQL()
	if err != nil {
		logger.Error("error building delete query: %v", err)
		return err
	}

	if _, err := g.Store.ExecContext(ctx, q, args...); err != nil {
		logger.Error("error executing delete query: %v", err)
		return err
	}

	common.AttachSQLToTrace(ctx, q)
	return nil
}
