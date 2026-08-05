import { StyleSheet, View, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import SettingItem from "@/components/setting-item";
import { BottomTabInset, MaxContentWidth, Spacing, Radius } from "@/lib/theme";
import { useTheme } from "@/lib/hooks/use-theme";
import { useThemeToggle } from "@/lib/hooks/use-theme-toggle";
import { useLanguage } from "@/lib/hooks/use-language";
import AppBar from "@/components/AppBar";
import { useTranslation } from "react-i18next";
import { useOnboardingToggle } from "@/lib/hooks/use-onboarding-toggle";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { isDarkMode, setIsDarkMode } = useThemeToggle();
  const { currentLanguage } = useLanguage();
  const { alwaysShowOnboarding, setAlwaysShowOnboarding } = useOnboardingToggle();
  const theme = useTheme();
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <AppBar location={t("Settings")} hideSettings />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >

          {/* Preferences Section */}
          <ThemedText
            type="smallBold"
            themeColor="textSubtle"
            style={styles.sectionHeader}
          >
            Preferences
          </ThemedText>

          <ThemedView type="bg" style={styles.card}>
            {/* Dark Mode Row */}
            <SettingItem
              label="Dark Mode"
              leftIcon="moon"
              leftIconColor="#f9ab00"
              leftIconBgColor="rgba(249, 171, 0, 0.15)"
              showChevron={false}
              rightElement={
                <Switch
                  value={isDarkMode}
                  onValueChange={(value) => setIsDarkMode(value)}
                  trackColor={{
                    false: theme.bgMuted,
                    true: "#34c759",
                  }}
                  thumbColor={isDarkMode ? "#fff" : "#f4f3f4"}
                />
              }
            />

            <View
              style={[
                styles.separator,
                { backgroundColor: theme.bgMuted },
              ]}
            />

            {/* Language Row */}
            <SettingItem
              label="Language"
              leftIcon="language"
              leftIconColor="#1a73e8"
              leftIconBgColor="rgba(26, 115, 232, 0.15)"
              rightText={currentLanguage.nativeName}
              onPress={() => router.push("/settings/language")}
            />

            <View
              style={[
                styles.separator,
                { backgroundColor: theme.bgMuted },
              ]}
            />

            {/* Onboarding Toggle Row */}
            <SettingItem
              label={t("Show Onboarding")}
              leftIcon="flag"
              leftIconColor={theme.primary}
              leftIconBgColor={theme.primary + "26"}
              showChevron={false}
              rightElement={
                <Switch
                  value={alwaysShowOnboarding}
                  onValueChange={(value) => setAlwaysShowOnboarding(value)}
                  trackColor={{
                    false: theme.bgMuted,
                    true: "#34c759",
                  }}
                  thumbColor={alwaysShowOnboarding ? "#fff" : "#f4f3f4"}
                />
              }
            />
          </ThemedView>

          {/* About Section */}
          <ThemedText
            type="smallBold"
            themeColor="textSubtle"
            style={styles.sectionHeader}
          >
            About
          </ThemedText>

          <ThemedView type="bg" style={styles.card}>
            {/* About EMI Row */}
            <SettingItem
              label="About Us"
              leftIcon="business"
              leftIconColor="#0B2C54"
              leftIconBgColor="rgba(11, 44, 84, 0.15)"
              onPress={() => router.push("/settings/about-us")}
            />

            <View
              style={[
                styles.separator,
                { backgroundColor: theme.bgMuted },
              ]}
            />

            {/* About the App Row */}
            <SettingItem
              label={t("About the App")}
              leftIcon="information-circle"
              leftIconColor="#1a73e8"
              leftIconBgColor="rgba(26, 115, 232, 0.15)"
              onPress={() => router.push("/settings/about-the-app")}
            />

            <View
              style={[
                styles.separator,
                { backgroundColor: theme.bgMuted },
              ]}
            />

            {/* Privacy Row */}
            <SettingItem
              label="Privacy Policy"
              leftIcon="shield-checkmark"
              leftIconColor="#c5221f"
              leftIconBgColor="rgba(197, 34, 31, 0.15)"
              onPress={() => router.push("/settings/privacy-policy")}
            />

            <View
              style={[
                styles.separator,
                { backgroundColor: theme.bgMuted },
              ]}
            />

            {/* App Version Row */}
            <SettingItem
              label="App Version"
              leftIcon="information-circle"
              leftIconColor="#5f6368"
              leftIconBgColor="rgba(95, 99, 104, 0.15)"
              rightText="1.0.0 (Build 42)"
              showChevron={false}
            />
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    flexDirection: "row",
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: BottomTabInset + Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 12,
  },
  card: {
    alignSelf: "stretch",
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  separator: {
    height: 1,
    width: "100%",
  },
});
