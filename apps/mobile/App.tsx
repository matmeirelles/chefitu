import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from "@expo-google-fonts/baloo-2";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import { AppShell } from "./src/AppShell";
import { LocaleProvider } from "./src/i18n/LocaleContext";
import { ProfileProvider } from "./src/context/ProfileContext";
import { ShoppingListProvider } from "./src/context/ShoppingListContext";

export default function App() {
  const [fontsLoaded] = useFonts({
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <LocaleProvider>
        <ProfileProvider>
          <ShoppingListProvider>
            <AppShell />
          </ShoppingListProvider>
        </ProfileProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}
