import * as React from "react";

interface TechIconProps {
  name: string;
  size?: number;
}

export function TechIcon({ name, size = 75 }: TechIconProps) {
  const [isDark, setIsDark] = React.useState(() => document.documentElement.classList.contains("dark"));

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains("dark");
      setIsDark(dark);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const normalizedName = React.useMemo(() => {
    let n = name.replace(" ", "");
    if (n.includes(".")) n = n.replace(".", "dot");
    return n.toLowerCase();
  }, [name]);

  const url = `https://cdn.simpleicons.org/${normalizedName}/${isDark ? "white" : "black"}`;

  return <img src={url} className="object-contain" style={{ width: size, height: size }} alt={name} />;
}
