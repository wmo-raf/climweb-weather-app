import React, { JSX } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { colors, fonts, radius, shadow, space, touchTarget } from '@/lib/theme';

type StatusCardProps = {
  icon: string;
  iconColor?: string;
  title: string;
  text?: string;
  // Renders an action button when provided — retrying a failed fetch,
  // or sending the user somewhere useful (e.g. "Choose a place"). Omit
  // for plain informational cards (e.g. "no warnings right now").
  onRetry?: () => void;
  // Overrides the button label, which otherwise defaults to "Retry".
  actionLabel?: string;
};

// Shared "nothing to show" / "something went wrong" card. Mirrors the
// visual pattern already used for Warnings' empty state, with an optional
// action button for error/unknown-state cases (Today, Places, Alerts,
// NoLocation, 5 Days).
function StatusCard({ icon, iconColor = colors.textSubtle, title, text, onRetry, actionLabel }: StatusCardProps): JSX.Element {
  const { t } = useTranslation();
  const label = actionLabel ?? t('Retry');

  return (
    <View style={styles.card}>
      <Icon source={icon} size={32} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      {text && <Text style={styles.text}>{text}</Text>}
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} accessibilityLabel={label}>
          <Text style={styles.retryButtonText}>{label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space[6],
    marginTop: space[4],
    marginBottom: space[4],
    ...shadow.sm,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
    marginTop: space[3],
    textAlign: 'center',
  },
  text: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'center',
    marginTop: space[1],
  },
  retryButton: {
    marginTop: space[4],
    minHeight: touchTarget.nav,
    paddingHorizontal: space[6],
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textInverse,
  },
});

export default StatusCard;
