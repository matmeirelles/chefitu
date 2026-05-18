import React from "react";
import * as LucideIcons from "lucide-react-native";
import { COLORS } from "./tokens";

export type IconName = keyof typeof LucideIcons;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export const DSIcon = ({ name, size = 22, color = COLORS.marrom, strokeWidth = 1.75 }: Props) => {
  const LucideIcon = LucideIcons[name] as React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} />;
};
