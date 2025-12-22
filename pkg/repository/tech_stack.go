package repository

import (
	"context"
	"database/sql"
	"errors"

	"neploy.dev/pkg/common"

	"github.com/doug-martin/goqu/v9"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/repository/filters"
	"neploy.dev/pkg/store"
)

type TechStack struct {
	Base[model.TechStack]
}

func NewTechStack(db store.Queryable) *TechStack {
	return &TechStack{Base[model.TechStack]{Store: db, Table: "tech_stacks"}}
}

func (t *TechStack) FindOrCreate(ctx context.Context, name string) (model.TechStack, error) {
	query := t.baseQuery().Where(goqu.Ex{"name": name})
	q, args, err := query.ToSQL()
	if err != nil {
		logger.Error("error building find or create query: %v", err)
		return model.TechStack{}, err
	}

	var techStack model.TechStack
	if err := t.Store.GetContext(ctx, &techStack, q, args...); err != nil && !errors.Is(err, sql.ErrNoRows) {
		logger.Error("error executing find query: %v", err)
		return model.TechStack{}, err
	}

	common.AttachSQLToTrace(ctx, q)

	if techStack.ID != "" {
		return techStack, nil
	}

	insert := t.BaseQueryInsert().Rows(model.TechStack{Name: name}).Returning(goqu.Star())
	q, args, err = insert.ToSQL()
	if err != nil {
		logger.Error("error building insert query: %v", err)
		return model.TechStack{}, err
	}

	if err := t.Store.QueryRowxContext(ctx, q, args...).StructScan(&techStack); err != nil {
		logger.Error("error executing insert query: %v", err)
		return model.TechStack{}, err
	}

	common.AttachSQLToTrace(ctx, q)
	return techStack, nil
}

func (t *TechStack) Delete(ctx context.Context, id string) error {
	query := filters.ApplyUpdateFilters(
		t.BaseQueryUpdate().
			Set(goqu.Record{"deleted_at": goqu.L("CURRENT_TIMESTAMP")}),
		filters.IsUpdateFilter("id", id),
	)

	q, args, err := query.ToSQL()
	if err != nil {
		logger.Error("error building delete query: %v", err)
		return err
	}

	if _, err := t.Store.ExecContext(ctx, q, args...); err != nil {
		logger.Error("error executing delete query: %v", err)
		return err
	}

	common.AttachSQLToTrace(ctx, q)
	return nil
}

func (t *TechStack) GetUsageInApps(ctx context.Context) ([]model.TechStat, error) {
	query := t.baseQuery("t").
		Join(
			goqu.T("applications").As("a"),
			goqu.On(goqu.I("a.tech_stack_id").Eq(goqu.I("t.id"))),
		).
		Select(
			goqu.COUNT("*").As("count"),
			goqu.I("t.name").As("name"),
		).
		GroupBy(goqu.I("t.name"))

	q, args, err := query.ToSQL()
	if err != nil {
		logger.Error("error building query for get techstack usage in apps: %v", err)
		return nil, err
	}

	var techStats []model.TechStat
	if err := t.Store.SelectContext(ctx, &techStats, q, args...); err != nil {
		logger.Error("error executing get all query: %v", err)
		return nil, err
	}

	common.AttachSQLToTrace(ctx, q)
	return techStats, nil
}
