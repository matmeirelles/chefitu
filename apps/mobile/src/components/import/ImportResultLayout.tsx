import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { MascotStickerId } from "../../design-system/illustrations";
import { DSMascotSticker } from "../../design-system/MascotSticker";
import { IMPORT_FLOW_STICKER_SIZE } from "../../design-system/illustrations";
import { COLORS, LINE_HEIGHT, SPACING, TYPE_SCALE } from "../../design-system/tokens";
import { DSText } from "../../design-system/Text";

type Props = {
  stickerId: MascotStickerId;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
};

export const ImportResultLayout = ({ stickerId, title, description, children, footer }: Props) => (
  <View style={styles.root}>
    <DSMascotSticker id={stickerId} size={IMPORT_FLOW_STICKER_SIZE} />
    <DSText variant="h2" style={styles.title}>
      {title}
    </DSText>
    {typeof description === "string" ? (
      <DSText style={styles.description}>{description}</DSText>
    ) : (
      <View style={styles.descriptionWrap}>{description}</View>
    )}
    {children ? <View style={styles.slot}>{children}</View> : null}
    {footer ? <View style={styles.slot}>{footer}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    gap: SPACING[4],
    paddingTop: SPACING[1],
  },
  title: {
    textAlign: "center",
  },
  description: {
    fontSize: TYPE_SCALE.body,
    lineHeight: TYPE_SCALE.body * LINE_HEIGHT.base,
    color: COLORS.marromSoft,
    textAlign: "center",
  },
  descriptionWrap: {
    width: "100%",
    alignItems: "center",
  },
  slot: {
    alignSelf: "stretch",
    width: "100%",
  },
});
