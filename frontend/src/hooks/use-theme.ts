import { useEffect, useState } from "react";
import bgTokyonight from "../../assets/bg_tokyonight.webp";
import bgNeploy from "../../assets/bg_neploy.webp";
import bgRosepine from "../../assets/bg_rosepine.webp";
import bgGruvbox from "../../assets/bg_gruvbox.webp";

const themes = ["neploy", "gruvbox", "rosepine", "tokyonight"] as const;
export type Theme = (typeof themes)[number] | "system";

const getBackgroundImage = (theme: Theme) => {
  switch (theme) {
    case "tokyonight":
      return bgTokyonight;
    case "neploy":
      return bgNeploy;
    case "rosepine":
      return bgRosepine;
    case "gruvbox":
      return bgGruvbox;
    default:
      return bgNeploy;
  }
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>("neploy");
  const [isDark, setIsDark] = useState(false);

  const applyTheme = (t: Theme, dark: boolean) => {
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.classList.toggle("dark", dark);
    const root = document.documentElement;
    root.style.setProperty("--bg-image", `url(${getBackgroundImage(t)})`);
  };

  useEffect(() => {
    const storedTheme = (localStorage.getItem("theme") as Theme) || "neploy";
    const storedDark = localStorage.getItem("darkMode") === "true";
    setTheme(storedTheme);
    setIsDark(storedDark);
    applyTheme(storedTheme, storedDark);
  }, []);

  const changeTheme = (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
    applyTheme(newTheme, isDark);
  };

  const toggleDark = () => {
    const nextDark = !isDark;
    localStorage.setItem("darkMode", String(nextDark));
    setIsDark(nextDark);
    applyTheme(theme, nextDark);
  };

  return { theme, isDark, changeTheme, toggleDark, themes, applyTheme };
};
