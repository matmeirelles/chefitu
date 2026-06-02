import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
  type ProfileData,
} from "../storage/profile";

type ProfileContextValue = {
  profile: ProfileData;
  ready: boolean;
  updateProfile: (patch: Partial<ProfileData>) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const loaded = await loadProfile();
      setProfile(loaded);
      setReady(true);
    })();
  }, []);

  const updateProfile = useCallback((patch: Partial<ProfileData>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      void saveProfile(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ profile, ready, updateProfile }),
    [profile, ready, updateProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = (): ProfileContextValue => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
};
