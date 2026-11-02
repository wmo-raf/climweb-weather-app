import React, { JSX, useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { ThemeColors, Fonts, Radius, shadow, Spacing, touchTarget } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

export type ReadMoreLink = {
  // MaterialCommunityIcons name.
  icon: string;
  label: string;
  url: string;
};

type ReadMoreCardProps = {
  title: string;
  links: ReadMoreLink[];
};

// A titled list of links that open in the system browser — "Read more from
// TMA" on the At sea and For farming pages. Rows stay usable offline; the
// browser shows its own no-connection page then.
function ReadMoreCard({ title, links }: ReadMoreCardProps): JSX.Element {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const open = (url: string) => {
    Linking.openURL(url).catch(error => console.warn(`Couldn't open ${url}:`, error));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      {links.map((link, idx) => (
        <Pressable
          key={link.url}
          onPress={() => open(link.url)}
          accessibilityRole="link"
          accessibilityLabel={link.label}
          style={({ pressed }) => [styles.row, idx > 0 && styles.rowDivider, pressed && styles.rowPressed]}
        >
          <Icon source={link.icon} size={24} color={colors.primary} />
          <Text style={styles.rowLabel}>{link.label}</Text>
          <Icon source="open-in-new" size={20} color={colors.primary} />
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.large,
    ...shadow.sm,
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: touchTarget.nav,
    paddingVertical: Spacing.md,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.bgHover,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.sans.regular,
    color: colors.textStrong,
  },
});

export default ReadMoreCard;
