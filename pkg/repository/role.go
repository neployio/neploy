package repository

import (
	"context"

	"neploy.dev/pkg/common"

	"github.com/doug-martin/goqu/v9"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/store"
)

type Role struct {
	Base[model.Role]
}

func NewRole(db store.Queryable) *Role {
	return &Role{Base[model.Role]{Store: db, Table: "roles"}}
}

func (r *Role) Delete(ctx context.Context, id string) error {
	q := r.BaseQueryUpdate().Where(goqu.Ex{"id": id}).Set(goqu.Record{"deleted_at": goqu.L("CURRENT_TIMESTAMP")})
	query, args, err := q.ToSQL()
	if err != nil {
		return err
	}

	if _, err := r.Store.ExecContext(ctx, query, args...); err != nil {
		return err
	}

	common.AttachSQLToTrace(ctx, query)
	return nil
}
