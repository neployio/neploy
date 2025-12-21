package common

import (
	"context"
	"time"

	"neploy.dev/pkg/model"
)

func FormatDateRange(startDate, endDate time.Time) model.DateRange {
	return model.DateRange{
		StartDate: startDate.Format("2006-01-02"),
		EndDate:   endDate.Format("2006-01-02"),
	}
}

func InjectTrace(ctx context.Context, trace *model.Trace) context.Context {
	return context.WithValue(ctx, "trace", trace)
}

func ExtractTrace(ctx context.Context) (*model.Trace, bool) {
	trace, ok := ctx.Value("trace").(*model.Trace)
	return trace, ok
}

func AttachSQLToTrace(ctx context.Context, sql string) {
	if trace, ok := ExtractTrace(ctx); ok {
		trace.SqlStatement = sql
	}
}
