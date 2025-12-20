import { Link } from "@inertiajs/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "frontend/src/components/ui/table";
import { GatewayTableProps } from "frontend/src/types/props";
import { useTranslation } from "react-i18next";

export function GatewayTable({ gateways }: GatewayTableProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("dashboard.gateways.routePath")}</TableHead>
            <TableHead>{t("dashboard.gateways.application")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gateways.map((gateway) => (
            <TableRow key={gateway.id}>
              <TableCell>{gateway.path}</TableCell>
              <TableCell>
                <Link href={`/dashboard/applications/${gateway.applicationId}`} className="text-primary hover:underline">
                  {gateway.application.appName}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
