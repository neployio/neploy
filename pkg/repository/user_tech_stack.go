package repository

import (
	"context"

	"github.com/doug-martin/goqu/v9"
	"neploy.dev/pkg/logger"
	"neploy.dev/pkg/model"
	"neploy.dev/pkg/store"
)

type UserTechStack struct {
	Base[model.UserTechStack]
}

func NewUserTechStack(db store.Queryable) *UserTechStack {
	return &UserTechStack{Base[model.UserTechStack]{Store: db, Table: "user_tech_stacks"}}
}

func (u *UserTechStack) Delete(ctx context.Context, userId, techId string) error {
	query := dialect.Delete(u.Table).Where(goqu.I("user_id").Eq(userId), goqu.I("tech_stack_id").Eq(techId))

	q, args, err := query.ToSQL()
	if err != nil {
		logger.Error("error building delete query: %v", err)
		return err
	}

	if _, err := u.Store.ExecContext(ctx, q, args...); err != nil {
		logger.Error("error executing delete query: %v", err)
		return err
	}

	return nil
}
