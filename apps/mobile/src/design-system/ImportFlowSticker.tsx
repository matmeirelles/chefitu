import { DSMascotSticker } from "./MascotSticker";
import {
  IMPORT_FLOW_STICKER_BY_KIND,
  IMPORT_FLOW_STICKER_SIZE,
  type ImportFlowStickerKind,
} from "./illustrations";

type Props = {
  kind: ImportFlowStickerKind;
  size?: number;
};

/** Sticker for import sheet result states (success / failed / no recipe). */
export const DSImportFlowSticker = ({ kind, size = IMPORT_FLOW_STICKER_SIZE }: Props) => (
  <DSMascotSticker id={IMPORT_FLOW_STICKER_BY_KIND[kind]} size={size} />
);
