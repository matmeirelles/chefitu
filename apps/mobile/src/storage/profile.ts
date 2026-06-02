import AsyncStorage from "@react-native-async-storage/async-storage";

export type ProfileData = {
  displayName: string;
  email: string;
  avatarUri: string | null;
};

export const DEFAULT_PROFILE: ProfileData = {
  displayName: "Mateus",
  email: "you@example.com",
  avatarUri: null,
};

const STORAGE_KEY = "chefitu.profile.v1";

export const loadProfile = async (): Promise<ProfileData> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<ProfileData>;
    return {
      displayName: parsed.displayName?.trim() || DEFAULT_PROFILE.displayName,
      email: parsed.email?.trim() || DEFAULT_PROFILE.email,
      avatarUri: parsed.avatarUri ?? null,
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
};

export const saveProfile = async (profile: ProfileData): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};
