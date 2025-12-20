import * as LucideIcons from "lucide-react";
import * as RadixIcons from "@radix-ui/react-icons";

interface RoleIconProps {
  icon: string;
  color?: string;
  size?: number;
}

function isLightColor(hex: string): boolean {
  // Remove # if present
  hex = hex.replace('#', '');
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 200;
}

export function RoleIcon({ icon, color = "white", size = 40 }: RoleIconProps) {
  const LucideIcon = (LucideIcons as any)[icon];
  const iconColor = isLightColor(color) ? "black" : "white";
  if (LucideIcon) {
    return <LucideIcon color={iconColor} size={size} style={{ backgroundColor: color, borderRadius: "20%" }} className="p-1" />;
  }

  const radixIconName = `${icon}Icon`;
  const RadixIcon = (RadixIcons as any)[radixIconName];
  if (RadixIcon) {
    return (
      <div style={{ width: size, height: size, backgroundColor: color, color: iconColor, borderRadius: "20%" }}>
        <RadixIcon className="w-full h-full p-1" />
      </div>
    );
  }

  return null;
}
