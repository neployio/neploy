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

type ApplicationStat struct {
	Base[model.ApplicationStat]
}

func NewApplicationStat(db store.Queryable) *ApplicationStat {
	return &ApplicationStat{Base[model.ApplicationStat]{Store: db, Table: "application_stats"}}
}

func (a *ApplicationStat) Delete(ctx context.Context, id string) error {
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

func (a *ApplicationStat) GetHourlyRequests(ctx context.Context) ([]model.RequestStat, error) {
	query := goqu.
		From("application_stats")

	query = query.Select(
		goqu.L("to_char(date AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:00')").As("hour"),
		goqu.SUM("requests").As("successful"),
		goqu.SUM("errors").As("errors"),
		goqu.C("application_id").As("application_id"),
	).
		GroupBy(goqu.L("hour"), goqu.C("application_id")).
		Order(goqu.L("hour").Asc()).
		Limit(24)

	sql, args, err := query.ToSQL()
	if err != nil {
		return nil, err
	}

	var stats []model.RequestStat
	if err := a.Store.SelectContext(ctx, &stats, sql, args...); err != nil {
		return nil, err
	}

	return stats, nil
}
