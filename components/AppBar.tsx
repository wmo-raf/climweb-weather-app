import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-paper';

import { useNavigation, useRouter, Href } from 'expo-router';

import { SCREENS } from '@/lib/layout/constants';
import { useTranslation } from 'react-i18next';
import { ThemeColors, Fonts, Spacing, touchTarget } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

const backArrow = require('@/assets/icons8-back-100_2.png');

type AppBarProps = {
  location: string,
  // True only on the Today screen, where the title IS the place name and
  // should be tappable to switch location — other screens use `location`
  // as a plain screen title (e.g. "Settings", "Warnings").
  isPlace?: boolean,
  hideSettings?: boolean,
};

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const AppBar = (props: AppBarProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const titleBlock = (
    <>
      {props.isPlace && <Icon size={18} color={colors.primary} source="map-marker" />}
      <View style={styles.titleTextBlock}>
        <ThemedText type="default" themeColor="textStrong" style={styles.appTitle} numberOfLines={1}>{props.location || "Climweb Weather App"}</ThemedText>
        {props.isPlace && <ThemedText type="small" themeColor="primary" style={styles.placeSubtitle}>{t('Tap to change place')}</ThemedText>}
      </View>
    </>
  );

  return (
    <ThemedView type="bg" style={styles.appBar}>
      <View style={styles.appTitleContainer}>
        {navigation.canGoBack() &&
          <TouchableOpacity accessible={true} accessibilityLabel='Go back' onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon size={28} color={colors.primary} source={backArrow} />
          </TouchableOpacity>}
        {props.isPlace
          ? <TouchableOpacity
              style={styles.titleTouchable}
              accessible={true}
              accessibilityLabel={`${props.location}. ${t('Tap to change place')}`}
              onPress={() => router.push(SCREENS.Search.toString() as Href)}
            >
              {titleBlock}
            </TouchableOpacity>
          : <View style={styles.titleTouchable}>{titleBlock}</View>
        }
      </View>

      {!props.hideSettings && (
        <TouchableOpacity
          style={styles.settingsButton}
          accessible={true}
          accessibilityLabel={t('Settings')}
          onPress={() => router.push(SCREENS.Settings.toString() as Href)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon size={26} color={colors.primary} source="cog-outline" />
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

export default AppBar;

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: touchTarget.nav + Spacing.lg,
  },
  appTitleContainer: {
    paddingLeft: Spacing.md,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  backButton: {
    minWidth: touchTarget.nav,
    minHeight: touchTarget.nav,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
    minHeight: touchTarget.nav,
    paddingVertical: Spacing.md,
  },
  titleTextBlock: {
    flexShrink: 1,
    marginRight: Spacing.lg,
  },
  appTitle: {
    fontSize: 20,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  placeSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.sans.regular,
    color: colors.primary,
  },
  settingsButton: {
    width: touchTarget.nav,
    height: touchTarget.nav,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  warningIcons: {
    flexDirection: 'row',
    flex: 1,
    height: 30,
  },
});
