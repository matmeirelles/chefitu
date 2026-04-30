import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { AppShell } from "./src/AppShell";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#8E4D22",
    onPrimary: "#FFFFFF",
    primaryContainer: "#FFDBC9",
    onPrimaryContainer: "#341000",
    secondary: "#76574A",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#FFDBC9",
    onSecondaryContainer: "#2C160B",
    surface: "#FFF8F5",
    surfaceVariant: "#F3E5DD",
    onSurface: "#221A16",
    onSurfaceVariant: "#52443D",
    outline: "#D6C3BA",
    background: "#FFF8F5",
    error: "#BA1A1A",
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="dark" />
        <AppShell />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
