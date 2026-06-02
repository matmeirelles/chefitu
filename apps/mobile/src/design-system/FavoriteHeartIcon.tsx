import { COLORS } from "./tokens";
import { DSIcon } from "./Icon";

type Props = {
  isFavorite: boolean;
  size?: number;
  strokeWidth?: number;
};

/** Filled heart uses `fill` (Lucide strokeWidth 0 alone renders invisible). */
export const DSFavoriteHeartIcon = ({
  isFavorite,
  size = 16,
  strokeWidth = 2,
}: Props) => (
  <DSIcon
    name="Heart"
    size={size}
    color={isFavorite ? COLORS.coracao : COLORS.marrom}
    strokeWidth={isFavorite ? 0 : strokeWidth}
    fill={isFavorite ? COLORS.coracao : "none"}
  />
);
