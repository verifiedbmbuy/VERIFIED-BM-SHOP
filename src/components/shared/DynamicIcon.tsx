import { icons } from "lucide-react";

interface DynamicIconProps {
  name: string;
  className?: string;
}

const DynamicIcon = ({ name, className }: DynamicIconProps) => {
  const Icon = (icons as Record<string, any>)[name];
  if (!Icon) return null;
  return <Icon className={className} />;
};

export default DynamicIcon;
