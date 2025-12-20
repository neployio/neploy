"use client";

import type * as React from "react";
import { useEffect, useState } from "react";

import { LanguageSelector } from "frontend/src/components/forms";
import { ThemeSwitcher } from "frontend/src/components/theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "frontend/src/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "frontend/src/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "frontend/src/components/ui/sidebar";
import { useTheme, Theme } from "frontend/src/hooks";
import { Link } from "@inertiajs/react";
import { useTranslation } from "react-i18next";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  isActive?: boolean;
}

interface User {
  name: string;
  email: string;
  avatar: string;
  roles: string[];
}

interface SidebarLayoutProps {
  navItems: NavItem[];
  user: User;
  teamName: string;
  logoUrl: string;
  children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ navItems, user, logoUrl, teamName, children }) => {
  const { theme, isDark, applyTheme } = useTheme();
  if (!logoUrl.includes("http://"))
    logoUrl = "http://"+logoUrl.replace("http:/", "")
  useEffect(() => {
    applyTheme(theme, isDark);
  }, [theme, isDark]);

  const { t } = useTranslation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <Sidebar collapsible="icon" className="print:hidden">
          <SidebarHeader className="flex items-center justify-center">
            <img
              src={logoUrl || "/placeholder.svg"}
              alt={teamName}
              className="h-full w-auto transition-all duration-300 ease-in-out
                   group-data-[collapsible=icon]:w-10/12 group-data-[collapsible=icon]:h-full
                   group-data-[state=expanded]:w-10/12 group-data-[state=expanded]:mx-auto"
            />
            <SidebarTrigger className="absolute top-2 left-3 block md:hidden p-1" />
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarMenu>
              {navItems
                .filter((item) => item.url !== "/dashboard/settings" || user.roles.includes("administrator") || user.roles.includes("settings"))
                .filter((item) => item.url !== "/dashboard/report" || user.roles.includes("administrator"))
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <Link href={item.url} className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              <SidebarMenuItem>
                <ThemeSwitcher className="w-full p-2" />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu modal>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg" variant="outline" className="w-full justify-start gap-2 !bg-transparent hover:text-foreground">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-xs font-medium">{user.name}</span>
                        <span className="text-xs text-sidebar-foreground/60">{user.email}</span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start" alignOffset={-8} forceMount>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="p-0">
                      <LanguageSelector className="w-full p-2" />
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/users/profile" as="button" className="w-full flex items-center">
                        <span>{t("profile")}</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main content area with proper sticky header */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sticky Header */}
          <header className="sticky top-0 z-50 min-h-[56px] w-[99%] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0 print:hidden">
            <div className="flex items-center justify-start gap-x-1 py-3 pl-1 min-w-0">
              <SidebarTrigger />
              {teamName && <h1 className="text-base lg:text-xl font-semibold truncate">{teamName} API Gateway</h1>}
            </div>
          </header>

          {/* Single scrollable main content */}
          <main className="flex-1 overflow-auto print:overflow-visible">
            <div className="w-full max-w-full overflow-x-auto print:overflow-visible">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SidebarLayout;
