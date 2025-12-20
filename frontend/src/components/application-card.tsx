import { Application } from "frontend/src/types/common";
import { Badge } from "frontend/src/components/ui/badge";
import { Button } from "frontend/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "frontend/src/components/ui/card";
import { TechIcon } from "frontend/src/components/icons/tech-icon";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { router } from "@inertiajs/react";
import {MouseEvent} from "react";

interface ApplicationCardProps {
  app: Application;
  onDelete: (e: MouseEvent<HTMLButtonElement>, id: string) => void;
}

export function ApplicationCard({ app, onDelete }: ApplicationCardProps) {
  const { t } = useTranslation();

  const getStatusBadgeColor = (status: Application["status"]) => {
    switch (status) {
      case "Running":
        return "!bg-green-500";
      case "Building":
        return "!bg-yellow-500";
      case "Stopped":
        return "!bg-gray-500";
      case "Error":
        return "!bg-red-500";
      case "Created":
        return "!bg-blue-500 !text-white";
      default:
        return "!bg-gray-500";
    }
  };

  const translateStatus = (status: Application["status"]) => {
    switch (status) {
      case "Running":
        return t("dashboard.applications.status.running");
      case "Building":
        return t("dashboard.applications.status.building");
      case "Stopped":
        return t("dashboard.applications.status.stopped");
      case "Error":
        return t("dashboard.applications.status.error");
      case "Created":
        return t("dashboard.applications.status.created");
      default:
        return t("dashboard.applications.status.unknown");
    }
  };

  return (
    <Card className={"hover:!bg-primary hover:cursor-pointer transition-colors"} onClick={() => router.visit(`/dashboard/applications/${app.id}`)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-xl">{app.appName}</CardTitle>
          <CardDescription>{app?.techStack === null ? "Auto detected" : <TechIcon name={app.techStack.name} />}</CardDescription>
        </div>
        <Badge className={`${getStatusBadgeColor(app.status)}`}>{translateStatus(app.status)}</Badge>
      </CardHeader>
      <CardContent>
        <Button size="sm" variant="destructive" onClick={(e) => onDelete(e,app.id)}>
          <Trash2 className="h-4 w-4 mr-1" />
          {t("dashboard.applications.delete")}
        </Button>
      </CardContent>
    </Card>
  );
}
