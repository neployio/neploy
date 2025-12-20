import { DashboardProps } from "frontend/src/types/props";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { DashboardCard } from "../dashboard-card";
import { BaseChart } from "../base-chart";
import { techStackColors } from "frontend/src/lib/colors";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "frontend/src/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "frontend/src/components/ui/table";
import { Theme, useTheme } from "frontend/src/hooks";

export function Home({ requests, techStack, visitors, health = "4/10", traces }: DashboardProps) {
  const { t } = useTranslation();
  const { applyTheme } = useTheme();
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);

  // Map backend RequestStat (with .hour) to frontend RequestData (with .name)
  const chartRequests = useMemo(() => {
    if (!requests) return [];
    return requests
      .map((r) => ({
        ...r,
        name: (r as any).hour || r.name, // prefer .hour if present
        total: r.successful + r.errors,
        successful: r.successful - r.errors,
        errors: r.errors ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [requests]);

  const chartVisitors = useMemo(() => {
    if (!visitors) return [];
    return visitors
      .map((r) => ({
        ...r,
        name: (r as any).hour || r.name, // prefer .hour if present
        total: r.value,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [visitors]);

  useEffect(() => {
    if (chartRequests) {
      const totalSuccessful = chartRequests.reduce((acc, request) => acc + request.total, 0);
      const totalErrors = chartRequests.reduce((acc, request) => acc + request.errors, 0);
      const totalVisitors = chartRequests.reduce((acc, visitors) => acc + visitors.total, 0);
      setTotalRequests(totalSuccessful);
      setTotalErrors(totalErrors);
      setTotalVisitors(totalVisitors);
    }
  }, [chartRequests]);

  return (
    <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8">
      <Button
        onClick={() => {
          // Save current theme
          const currentTheme = localStorage.getItem("theme") || "system";
          const currentDark = localStorage.getItem("darkMode") === "true";

          // Switch to light theme for printing
          applyTheme("neploy", false); // Using 'neploy' as the light theme

          // Trigger print
          setTimeout(() => {
            window.print();

            // Restore original theme after printing
            setTimeout(() => {
              applyTheme(currentTheme as Theme, currentDark);
            }, 500);
          }, 300);
        }}
        className="w-fit flex items-center gap-2 absolute top-[80px] right-[30px] print:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        <span>Imprimir</span>
      </Button>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 print:grid-cols-1">
        {/* Recent activity */}
        <Card className="md:col-span-2 lg:col-span-4 w-full print:hidden">
          <CardHeader>
            <CardTitle>{t("dashboard.recentActivity.title")}</CardTitle>
            <CardDescription>{t("dashboard.recentActivity.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table className="text-xs md:text-sm">
                <TableHeader className="hidden sm:table-header-group">
                  <TableRow>
                    <TableHead>{t("dashboard.settings.trace.date")}</TableHead>
                    <TableHead>{t("dashboard.settings.trace.user")}</TableHead>
                    <TableHead>{t("dashboard.settings.trace.action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {traces?.map((trace) => (
                    <TableRow key={trace.id} className="block sm:table-row border-b border-muted-foreground/10 sm:border-0 mb-2 sm:mb-0">
                      <TableCell className="block sm:table-cell font-semibold sm:font-normal py-1 sm:py-0">
                        <span className="sm:hidden font-bold">{t("dashboard.settings.trace.date")}: </span>
                        {trace.actionTimestamp}
                      </TableCell>
                      <TableCell className="block sm:table-cell font-semibold sm:font-normal py-1 sm:py-0">
                        <span className="sm:hidden font-bold">{t("dashboard.settings.trace.user")}: </span>
                        {trace.email}
                      </TableCell>
                      <TableCell className="block sm:table-cell font-semibold sm:font-normal py-1 sm:py-0">
                        <span className="sm:hidden font-bold">{t("dashboard.settings.trace.action")}: </span>
                        {trace.action}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card className="md:col-span-2 lg:col-span-3 w-full print:hidden">
          <CardHeader>
            <CardTitle>{t("dashboard.resources.title")}</CardTitle>
            <CardDescription>{t("dashboard.resources.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-2 sm:p-4">
            <div className="flex flex-col gap-2 w-full">
              <Button variant="outline" className="w-full justify-start text-xs md:text-base whitespace-normal break-words" onClick={() => window.open("/manual", "_blank")}>
                {t("dashboard.resources.documentation")}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs md:text-base whitespace-normal break-words"
                onClick={() => window.open("https://deepwiki.com/henrriusdev/neploy", "_blank")}>
                {t("dashboard.resources.apiReference")}
              </Button>
              <Button variant="outline" className="w-full justify-start text-xs md:text-base whitespace-normal break-words" onClick={() => window.open("https://github.com/henrriusdev", "_blank")}>
                {t("dashboard.resources.guides")}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs md:text-base whitespace-normal break-words"
                onClick={() => window.open("https://github.com/henrriusdev/neploy/issues", "_blank")}>
                Repo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:hidden">
        <DashboardCard
          title={t("dashboard.healthApps")}
          value={health}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-primary">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          }
        />
        <DashboardCard
          title={t("dashboard.totalRequests")}
          value={totalRequests.toString()}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-primary">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
        />
        <DashboardCard
          title={t("dashboard.totalVisitors")}
          value={totalVisitors.toString()}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4  w-4 text-primary">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <DashboardCard
          title={t("dashboard.totalErrors")}
          value={totalErrors.toString()}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-primary">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {chartRequests && chartRequests.length > 0 ? (
          <BaseChart
            title={t("dashboard.requestsByTime")}
            data={chartRequests}
            type="bar"
            dataKeys={["successful", "errors"]}
            colors={["hsl(var(--primary))", "hsl(var(--destructive))"]}
            className="col-span-full print:w-full print:mb-8"
            config={{
              successful: { label: t("dashboard.successful"), color: "hsl(var(--primary))" },
              errors: { label: t("dashboard.errors"), color: "hsl(var(--destructive))" }
            }}
          />
        ) : requests ? (
          <Card className="col-span-full flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">{t("dashboard.noApps") || "No apps"}</p>
          </Card>
        ) : (
          <Skeleton className="col-span-full h-[300px] print:w-full print:mb-8" />
        )}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {techStack ? (
          techStack.length > 0 ? (
            <BaseChart 
              title={t("dashboard.techStacksMostUsed")} 
              data={techStack} 
              type="pie" 
              dataKeys={["value"]} 
              colors={techStackColors} 
              className="col-span-3 lg:col-span-3 print:w-full print:mb-8" 
              config={{
                value: { label: t("dashboard.apps"), color: techStackColors[0] }
              }}
            />
          ) : (
            <Card className="col-span-3 lg:col-span-3 flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">{t("dashboard.noApps") || "No apps"}</p>
            </Card>
          )
        ) : (
          <Skeleton className="col-span-3 lg:col-span-3 h-[300px] print:w-full print:mb-8" />
        )}
        {visitors ? (
          visitors.length > 0 ? (
            <BaseChart
              title={t("dashboard.visitorCountByTime")}
              data={visitors}
              type="line"
              dataKeys={["value"]}
              colors={["var(--primary)"]}
              className="col-span-3 lg:col-span-4 border-none print:w-full print:mb-8"
              config={{
                value: { label: t("dashboard.visitors"), color: "var(--primary)" }
              }}
            />
          ) : (
            <Card className="col-span-3 lg:col-span-4 flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">{t("dashboard.noApps") || "No apps"}</p>
            </Card>
          )
        ) : (
          <Skeleton className="col-span-3 lg:col-span-4 h-[300px] print:w-full print:mb-8" />
        )}
      </div>
    </div>
  );
}
