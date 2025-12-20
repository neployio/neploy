"use client";
import { Moon, Sun, Palette, Leaf, Sparkles, Cloud, Check } from "lucide-react";
import type React from "react";

import { Button } from "frontend/src/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator } from "frontend/src/components/ui/dropdown-menu";
import { useTheme } from "frontend/src/hooks";
import { useTranslation } from "react-i18next";
import { cn } from "frontend/src/lib/utils";

const themeConfig: Record<string, { icon: React.ElementType; color: string; darkColor: string; label?: string }> = {
  neploy: {
    icon: Palette,
    color: "bg-blue-500",
    darkColor: "bg-blue-800",
    label: "Neploy",
  },
  gruvbox: {
    icon: Leaf,
    color: "bg-amber-500",
    darkColor: "bg-amber-800",
    label: "Gruvbox",
  },
  rosepine: {
    icon: Sparkles,
    color: "bg-pink-400",
    darkColor: "bg-pink-900",
    label: "Rosé Pine",
  },
  tokyonight: {
    icon: Cloud,
    color: "bg-indigo-400",
    darkColor: "bg-indigo-900",
    label: "Tokyo Night",
  },
  system: {
    icon: Sun,
    color: "bg-gray-400",
    darkColor: "bg-gray-700",
    label: "System",
  },
};

export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { theme, isDark, changeTheme, toggleDark, themes } = useTheme();
  const { t } = useTranslation();

  // Get the current theme icon and color
  const currentTheme = themeConfig[theme] || themeConfig.neploy;
  const ThemeIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("w-full justify-between px-2 py-1.5 text-sm font-medium", "hover:bg-accent/50 transition-colors duration-200", className)}>
          <div className="flex items-center gap-2">
            <div className={cn("flex h-5 w-5 items-center justify-center rounded-full", isDark ? currentTheme.darkColor : currentTheme.color)}>
              <ThemeIcon className="h-3 w-3 text-white" />
            </div>
            <span className="font-medium">{currentTheme.label || theme}</span>
          </div>
          <div className="text-xs opacity-70">{isDark ? t("dark") : t("light")}</div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-1">
        <div className="mb-1 px-2 py-1.5 text-xs font-medium text-muted-foreground">{t("appearance")}</div>

        {/* Light/Dark Mode Toggle */}
        <div className="mb-2 px-1">
          <div className="flex items-center rounded-md p-1">
            <Button variant={!isDark ? "default" : "outline"} size="sm" onClick={() => isDark && toggleDark()} className={cn("flex-1 h-8 text-xs font-medium", !isDark ? "shadow-sm" : "shadow-none")}>
              <Sun className="mr-1 h-3.5 w-3.5" />
              {t("light")}
            </Button>
            <Button variant={isDark ? "default" : "outline"} size="sm" onClick={() => !isDark && toggleDark()} className={cn("flex-1 h-8 text-xs font-medium", isDark ? "shadow-sm" : "shadow-none")}>
              <Moon className="mr-1 h-3.5 w-3.5" />
              {t("dark")}
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Theme Selection */}
        <div className="mb-1 px-2 py-1.5 text-xs font-medium text-muted-foreground">{t("theme")}</div>

        <div className="grid grid-cols-1 gap-1 px-1 pb-1">
          {themes.map((themeName) => {
            const config = themeConfig[themeName] || themeConfig.neploy;
            const ThemeIcon = config.icon;

            return (
              <Button
                key={themeName}
                variant="outline"
                size="sm"
                onClick={() => changeTheme(themeName)}
                className={cn("h-9 justify-start px-2 py-1 text-xs", theme === themeName && "border-2 border-primary")}>
                <div className={cn("mr-2 flex h-5 w-5 items-center justify-center rounded-full", isDark ? config.darkColor : config.color)}>
                  <ThemeIcon className="h-3 w-3 text-white" />
                </div>
                <span>{config.label || themeName}</span>
                {theme === themeName && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
              </Button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
