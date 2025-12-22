import { Link } from "@inertiajs/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GatewayTableProps } from "@/types/props";
import { useTranslation } from "react-i18next";

export function GatewayTable({ gateways }: GatewayTableProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("dashboard.gateways.endpointType")}</TableHead>
            <TableHead>{t("dashboard.gateways.routePath")}</TableHead>
            <TableHead>{t("dashboard.gateways.application")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gateways.map((gateway) => (
            <TableRow key={gateway.id}>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  gateway.endpointType === 'subdomain' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {gateway.endpointType === 'subdomain' ? 'Subdomain' : 'Path'}
                </span>
              </TableCell>
              <TableCell>
                {gateway.endpointType === 'subdomain' 
                  ? `${gateway.subdomain}.${gateway.domain}`
                  : gateway.path
                }
              </TableCell>
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
