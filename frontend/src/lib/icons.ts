import { icons as lucideIconsList } from "lucide-react";
import * as RadixIcons from "@radix-ui/react-icons";

// Get Lucide icons
const lucideIconNames = Object.keys(lucideIconsList);

// Get Radix icons and remove the 'Icon' suffix
const radixIconNames = Object.keys(RadixIcons)
  .filter((key) => typeof RadixIcons[key as keyof typeof RadixIcons] === "function")
  .map((name) => name.replace(/Icon$/, ""));

// Combine both sets of icons and sort alphabetically
export const icons = [...new Set([...lucideIconNames, ...radixIconNames])].sort();

// Create a type union of all icon names
export type Icon = (typeof icons)[number];

export const techIcons = [
  { name: "JavaScript", value: "javascript" },
  { name: "Python", value: "python" },
  { name: "Go", value: "go" },
  { name: "Java", value: "spring" },
  { name: "React", value: "react" },
  { name: "Angular", value: "angular" },
  { name: "Node.js", value: "nodedotjs" },
  { name: "Django", value: "django" },
  { name: "Docker", value: "docker" },
  { name: "MySQL", value: "mysql" },
  { name: "PostgreSQL", value: "postgresql" },
  { name: "MongoDB", value: "mongodb" },
  { name: "Nginx", value: "nginx" },
  { name: "Redis", value: "redis" },
];
