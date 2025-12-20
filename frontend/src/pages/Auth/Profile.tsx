"use client";

import { User } from "frontend/src/types";
import { UserProfile } from "frontend/src/components/views/user-profile";
import Layout from "frontend/src/components/Layouts/Layout";
import { useTranslation } from "react-i18next";
import { navItems } from "frontend/src/lib/utils";

export default function Profile({ userData, user: backendUser, teamName, logoUrl }: any) {
  const user = {
    name: backendUser?.name || "",
    email: backendUser?.email || "",
    roles: backendUser.roles || [],
    avatar: backendUser?.provider === "github" ? `https://unavatar.io/github/${backendUser?.username}` : `https://unavatar.io/${backendUser?.email}`,
  };

  const { t } = useTranslation();
  const navigation = navItems.map((item) => ({
    ...item,
    title: t(item.title),
  }));

  return (
    <div className="min-h-screen bg-background">
      <Layout user={user} teamName={teamName} logoUrl={logoUrl} navItems={navigation}>
        <UserProfile user={userData as User} />
      </Layout>
    </div>
  );
}
