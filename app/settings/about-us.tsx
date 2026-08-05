import { StyleSheet, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { useTheme } from "@/lib/hooks/use-theme";
import InfoItem from "@/components/info-item";
import {
  BottomTabInset,
  MaxContentWidth,
  Spacing,
  Radius,
} from "@/lib/theme";

import AppBar from "@/components/AppBar";
import { useTranslation } from "react-i18next";

export default function AboutUsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <AppBar location={t("About Us")} hideSettings />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* About EMI Section */}
          <ThemedView type="bg" style={[styles.card, { marginTop: 16 }]}>
            <View style={styles.sectionHeaderContainer}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.primary + '26' },
                ]}
              >
                <Ionicons name="business" size={22} color={theme.primary} />
              </View>
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Ethiopian Meteorological Institute
              </ThemedText>
            </View>

            <ThemedText
              themeColor="textSubtle"
              type="default"
              style={styles.paragraph}
            >
              The Ethiopian Meteorological Institute (EMI) is the state
              authority responsible for providing weather, climate, and early
              warning services across Ethiopia.
            </ThemedText>

            <InfoItem
              title="Mission"
              description="To monitor, analyze, and forecast weather, climate, and agro-meteorological conditions to support sustainable national development and ensure public safety.."
              icon="ribbon-outline"
              iconColor={theme.primary}
            />
          </ThemedView>

          {/* Forecast Services Section */}
          <ThemedText
            type="smallBold"
            themeColor="textSubtle"
            style={styles.groupHeader}
          >
            Forecast Services
          </ThemedText>

          <ThemedView type="bg" style={styles.card}>
            <View style={styles.sectionHeaderContainer}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.primary + '26' },
                ]}
              >
                <Ionicons
                  name="thunderstorm-outline"
                  size={22}
                  color={theme.primary}
                />
              </View>
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Meteorological Products
              </ThemedText>
            </View>

            <ThemedText
              themeColor="textSubtle"
              type="default"
              style={styles.paragraph}
            >
              EMI uses advanced meteorological stations, satellite data, and
              numerical models to deliver tailored forecasts:
            </ThemedText>

            {/* Nowcast Item */}
            <InfoItem
              title="Nowcasting & Hourly"
              description="Real-time alerts for sudden changes in weather conditions."
              icon="time-outline"
              iconColor={theme.primary}
            />

            <View style={[styles.itemSeparator, { backgroundColor: theme.bgMuted }]} />

            {/* Daily Item */}
            <InfoItem
              title="Daily & Medium Range"
              description="1 to 10-day outlooks for travel, public safety, and general planning."
              icon="today-outline"
              iconColor={theme.primary}
            />

            <View style={[styles.itemSeparator, { backgroundColor: theme.bgMuted }]} />

            {/* Seasonal Item */}
            <InfoItem
              title="Seasonal Outlooks"
              description="Critical forecasts for agricultural seasons like Belg and Kiremt."
              icon="calendar-outline"
              iconColor={theme.primary}
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
    paddingTop: Spacing.md,
    paddingBottom: BottomTabInset + Spacing.xl,
    gap: Spacing.xl,
  },
  groupHeader: {
    marginTop: Spacing.lg,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 12,
  },
  card: {
    alignSelf: "stretch",
    borderRadius: Radius.large,
    padding: Spacing.xl,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    gap: Spacing.lg,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.small,
    justifyContent: "center",
    alignItems: "center",
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
  },
  highlightBox: {
    flexDirection: "row",
    borderRadius: Radius.small,
    padding: Spacing.lg,
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  itemSeparator: {
    height: 1,
    marginVertical: Spacing.sm,
  },
});
