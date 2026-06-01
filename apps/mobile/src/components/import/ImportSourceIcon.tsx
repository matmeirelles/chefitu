import Svg, { Path, Rect } from "react-native-svg";
import type { ImportSourceKind } from "../../utils/import-source";
import { DSIcon } from "../../design-system/Icon";

type Props = {
  kind: ImportSourceKind;
  size?: number;
  color?: string;
};

export const ImportSourceIcon = ({ kind, size = 18, color = "#FFFFFF" }: Props) => {
  if (kind === "generic") {
    return <DSIcon name="Link2" size={size} color={color} strokeWidth={2} />;
  }

  if (kind === "instagram") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="3" width="18" height="18" rx="5" stroke={color} strokeWidth={2} />
        <Path
          d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z"
          stroke={color}
          strokeWidth={2}
        />
        <Path d="M17.5 6.5h.01" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.6 7.2c-.2-1.1-1-1.9-2.1-2.1C17.4 4.6 12 4.6 12 4.6s-5.4 0-7.5.5c-1.1.2-1.9 1-2.1 2.1C2 9.3 2 12 2 12s0 2.7.4 4.8c.2 1.1 1 1.9 2.1 2.1 2.1.5 7.5.5 7.5.5s5.4 0 7.5-.5c1.1-.2 1.9-1 2.1-2.1.4-2.1.4-4.8.4-4.8s0-2.7-.4-4.8Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M10 9.5v5l5.5-2.5L10 9.5Z" fill={color} />
    </Svg>
  );
};
