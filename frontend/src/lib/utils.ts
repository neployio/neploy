import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AppWindowMac, DoorOpen, Frame, PieChartIcon, Settings2 } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeAppName(appName: string): string {
  // Reemplazar espacios por guiones
  appName = appName.replace(/ /g, "-");

  // Eliminar cualquier carácter que no sea letra, número o guion
  appName = appName.replace(/[^a-zA-Z0-9-]/g, "");

  // Convertir a minúsculas
  return appName.toLowerCase();
}

export const navItems = [
  {
    title: "sidebar.dashboard",
    url: "/dashboard",
    icon: PieChartIcon,
  },
  {
    title: "sidebar.applications",
    url: "/dashboard/applications",
    icon: AppWindowMac,
  },
  {
    title: "sidebar.gateways",
    url: "/dashboard/gateways",
    icon: DoorOpen,
  },
  {
    title: "sidebar.team",
    url: "/dashboard/team",
    icon: Frame,
  },
  {
    title: "sidebar.settings",
    url: "/dashboard/settings",
    icon: Settings2,
  },
  {
    title: "Reportes",
    url: "/dashboard/report",
    icon: PieChartIcon,
  },
  {
    title: "sidebar.logout",
    url: "/logout",
    icon: DoorOpen,
  },
];
