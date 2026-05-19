import React from "react";
import * as LucideIcons from "lucide-react-native";
import { COLORS } from "./tokens";

export type IconName = keyof typeof LucideIcons;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
};

export const DSIcon = ({ name, size = 22, color = COLORS.marrom, strokeWidth = 1.75, fill }: Props) => {
  const LucideIcon = LucideIcons[name] as React.ComponentType<{ size: number; color: string; strokeWidth: number; fill?: string }>;
  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} fill={fill} />;
};
