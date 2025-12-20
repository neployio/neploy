import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "frontend/src/components/ui/card";

interface DashboardCardProps {
  title: string;
  value: string;
  icon: ReactNode;
}

export function DashboardCard({ title, value, icon }: DashboardCardProps) {
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">{value}</div>
      </CardContent>
    </Card>
  );
}
