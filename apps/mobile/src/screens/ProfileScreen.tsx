import { useState, type ComponentProps } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSIcon } from "../design-system/Icon";
import { useProfile } from "../context/ProfileContext";
import { useLocale } from "../i18n/LocaleContext";
import type { Locale } from "../i18n/strings";
import { InConstructionBottomSheet } from "../components/InConstructionBottomSheet";

const MASCOT = require("../../assets/mascot-symbol.png") as number;
const OUTLINE = "rgba(74, 44, 26, 0.12)";

const appVersion =
  Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? "1.0.0";

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useProfile();
  const { locale, t, setLocale } = useLocale();
  const [logOutSheetVisible, setLogOutSheetVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.profile.editAvatar, "Permissão necessária para escolher uma foto.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      updateProfile({ avatarUri: result.assets[0].uri });
    }
  };

  const languageLabel = locale === "pt" ? t.profile.languagePt : t.profile.languageEn;

  const selectLanguage = (next: Locale) => {
    setLocale(next);
    setLanguageModalVisible(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: COLORS.creme }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + SPACING[5], paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <DSText style={styles.screenTitle}>{t.profile.title}</DSText>

        <View style={styles.profileCard}>
          <Pressable
            onPress={() => void pickAvatar()}
            style={styles.avatarPressable}
            accessibilityRole="button"
            accessibilityLabel={t.profile.editAvatar}
          >
            <View style={styles.avatarCircle}>
              {profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
              ) : (
                <Image source={MASCOT} style={styles.avatarMascot} resizeMode="contain" />
              )}
            </View>
            <View style={styles.avatarBadge}>
              <DSIcon name="Camera" size={16} color={COLORS.white} strokeWidth={2} />
            </View>
          </Pressable>

          <View style={styles.fields}>
            <TextInput
              value={profile.displayName}
              onChangeText={(displayName) => updateProfile({ displayName })}
              placeholder={t.profile.namePlaceholder}
              placeholderTextColor={COLORS.marromSoft}
              style={styles.nameInput}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <TextInput
              value={profile.email}
              onChangeText={(email) => updateProfile({ email })}
              placeholder={t.profile.emailPlaceholder}
              placeholderTextColor={COLORS.marromSoft}
              style={styles.emailInput}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.menuCard}>
          <ProfileMenuRow
            icon="Globe"
            label={t.profile.language}
            value={languageLabel}
            onPress={() => setLanguageModalVisible(true)}
          />
          <View style={styles.menuDivider} />
          <ProfileMenuRow icon="LifeBuoy" label={t.profile.help} showChevron />
          <View style={styles.menuDivider} />
          <ProfileMenuRow
            icon="LogOut"
            label={t.profile.logOut}
            onPress={() => setLogOutSheetVisible(true)}
            destructive
          />
        </View>

        <View style={styles.aboutBlock}>
          <DSText style={styles.aboutLabel}>{t.profile.aboutLabel}</DSText>
          <DSText style={styles.aboutVersion}>{t.profile.version(appVersion)}</DSText>
        </View>
      </ScrollView>

      <InConstructionBottomSheet
        visible={logOutSheetVisible}
        onDismiss={() => setLogOutSheetVisible(false)}
      />

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable style={styles.langOverlay} onPress={() => setLanguageModalVisible(false)}>
          <Pressable style={styles.langSheet} onPress={(e) => e.stopPropagation()}>
            <DSText style={styles.langTitle}>{t.profile.language}</DSText>
            <Pressable
              style={[styles.langOption, locale === "pt" && styles.langOptionActive]}
              onPress={() => selectLanguage("pt")}
            >
              <DSText style={styles.langOptionText}>{t.profile.languagePt}</DSText>
              {locale === "pt" ? <DSIcon name="Check" size={18} color={COLORS.laranja} /> : null}
            </Pressable>
            <Pressable
              style={[styles.langOption, locale === "en" && styles.langOptionActive]}
              onPress={() => selectLanguage("en")}
            >
              <DSText style={styles.langOptionText}>{t.profile.languageEn}</DSText>
              {locale === "en" ? <DSIcon name="Check" size={18} color={COLORS.laranja} /> : null}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const ProfileMenuRow = ({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  destructive = false,
}: {
  icon: ComponentProps<typeof DSIcon>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}) => {
  const color = destructive ? COLORS.danger : COLORS.marrom;
  const content = (
    <>
      <View style={styles.menuRowLeft}>
        <DSIcon name={icon} size={20} color={color} strokeWidth={1.75} />
        <DSText style={[styles.menuLabel, destructive && styles.menuLabelDanger]}>{label}</DSText>
      </View>
      <View style={styles.menuRowRight}>
        {value ? <DSText style={styles.menuValue}>{value}</DSText> : null}
        {showChevron ? (
          <DSIcon name="ChevronRight" size={18} color={COLORS.marromSoft} strokeWidth={1.75} />
        ) : null}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={styles.menuRow}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[5],
  },
  screenTitle: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h1,
    lineHeight: TYPE_SCALE.h1 * 1.45,
    color: COLORS.marrom,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING[5],
    alignItems: "center",
    gap: SPACING[4],
    ...SHADOWS.sm,
  },
  avatarPressable: {
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bege,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 96,
    height: 96,
  },
  avatarMascot: {
    width: 72,
    height: 72,
  },
  avatarBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.laranja,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },
  fields: {
    alignSelf: "stretch",
    gap: SPACING[2],
  },
  nameInput: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h2,
    color: COLORS.marrom,
    textAlign: "center",
    paddingVertical: SPACING[1],
  },
  emailInput: {
    fontFamily: FONTS.ui,
    fontSize: TYPE_SCALE.body,
    color: COLORS.marromSoft,
    textAlign: "center",
    paddingVertical: SPACING[1],
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING[4],
    paddingVertical: 16,
    minHeight: 56,
  },
  menuRowPressed: {
    backgroundColor: COLORS.cremeDeep,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[3],
    flex: 1,
  },
  menuRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[2],
  },
  menuLabel: {
    fontFamily: FONTS.uiSemiBold,
    fontSize: TYPE_SCALE.body,
    fontWeight: "600",
    color: COLORS.marrom,
  },
  menuLabelDanger: {
    color: COLORS.danger,
  },
  menuValue: {
    fontSize: TYPE_SCALE.bodySm,
    color: COLORS.marromSoft,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: OUTLINE,
    marginLeft: SPACING[4] + 20 + SPACING[3],
  },
  aboutBlock: {
    alignItems: "center",
    gap: 4,
    paddingVertical: SPACING[2],
  },
  aboutLabel: {
    fontFamily: FONTS.uiSemiBold,
    fontSize: TYPE_SCALE.bodySm,
    fontWeight: "600",
    color: COLORS.marromSoft,
  },
  aboutVersion: {
    fontSize: TYPE_SCALE.bodySm,
    color: COLORS.marromSoft,
  },
  langOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: SPACING[5],
  },
  langSheet: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sheet,
    padding: SPACING[5],
    gap: SPACING[2],
  },
  langTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: TYPE_SCALE.h3,
    color: COLORS.marrom,
    marginBottom: SPACING[2],
    textAlign: "center",
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: SPACING[3],
    borderRadius: RADIUS.sm,
  },
  langOptionActive: {
    backgroundColor: COLORS.laranjaSoft,
  },
  langOptionText: {
    fontFamily: FONTS.uiSemiBold,
    fontSize: TYPE_SCALE.body,
    color: COLORS.marrom,
  },
});
