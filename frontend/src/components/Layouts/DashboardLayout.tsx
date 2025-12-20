import Layout from "frontend/src/components/Layouts/Layout";
import { Toaster } from "frontend/src/components/ui/toaster";
import { ApplicationView } from "frontend/src/components/views/application-view";
import { Reports } from "frontend/src/components/views/reports";
import { navItems } from "frontend/src/lib/utils";
import { usePage } from "@inertiajs/react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Applications, Config, Gateways, Home, Team } from "../views";

interface DashboardLayoutProps {
  user?: {
    name?: string;
    email?: string;
    username?: string;
    provider?: string;
    roles?: string[];
  };
  teamName?: string;
  logoUrl?: string;
  props?: any;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user: backendUser, teamName, logoUrl, props }) => {
  const { url } = usePage();
  const { t } = useTranslation();

  const user = {
    name: backendUser?.name || "",
    email: backendUser?.email || "",
    avatar: backendUser?.provider === "github" ? `https://unavatar.io/github/${backendUser?.username}` : `https://unavatar.io/${backendUser?.email}`,
    roles: backendUser.roles || [],
  };

  const getComponent = () => {
    const dashboardUrl = url.replace("/dashboard", "");
    if (dashboardUrl.startsWith("/applications/") && dashboardUrl.split("/").length === 3) {
      return <ApplicationView {...props} />;
    }

    switch (dashboardUrl) {
      case "":
        return <Home {...props} />;
      case "/applications":
        return <Applications {...props} />;
      case "/gateways":
        return <Gateways {...props} />;
      case "/team":
        return <Team {...props} />;
      case "/settings":
        return <Config {...props} />;
      case "/report":
        return <Reports {...props} />;
      default:
        return "Dashboard";
    }
  };

  // Create navigation with active state based on current URL
  const navigation = navItems.map((item) => ({
    ...item,
    title: t(item.title), // Translate the title
    isActive: url === item.url || (url.startsWith(item.url) && item.url !== "/dashboard" && item.url !== "/logout"),
  }));

  return (
    <div className="bg-background">
      <Layout user={user} teamName={teamName} logoUrl={logoUrl} navItems={navigation}>
        {getComponent()}
      </Layout>
      <Toaster />
    </div>
  );
};

export default DashboardLayout;
