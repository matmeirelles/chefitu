import { Image, StyleSheet, View } from "react-native";
import { MASCOT_STICKERS, type MascotStickerId } from "./illustrations";

export const MASCOT_STICKER_DEFAULT_SIZE = 168;

type Props = {
  id: MascotStickerId;
  size?: number;
};

export const DSMascotSticker = ({ id, size = MASCOT_STICKER_DEFAULT_SIZE }: Props) => (
  <View style={[styles.wrap, { width: size, height: size }]}>
    <Image source={MASCOT_STICKERS[id]} style={styles.image} resizeMode="contain" />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
