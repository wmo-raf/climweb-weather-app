import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-paper';

import { useNavigation, useRouter, Href } from 'expo-router';

import { SCREENS } from '@/lib/layout/constants';
import { useTranslation } from 'react-i18next';
import { ThemeColors, fonts, space, touchTarget } from '@/lib/theme';
import { useThemeColors } from '@/lib/theme/ThemeContext';

const backArrow = require('@/assets/icons8-back-100_2.png');

type AppBarProps = {
  location: string,
  // True only on the Today screen, where the title IS the place name and
  // should be tappable to switch location — other screens use `location`
  // as a plain screen title (e.g. "Settings", "Warnings").
  isPlace?: boolean,
};

const AppBar = (props: AppBarProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const titleBlock = (
    <>
      <Icon size={18} color={colors.primary} source="map-marker" />
      <View style={styles.titleTextBlock}>
        <Text style={styles.appTitle} numberOfLines={1}>{props.location || "Climweb Weather App"}</Text>
        {props.isPlace && <Text style={styles.placeSubtitle}>{t('Tap to change place')}</Text>}
      </View>
    </>
  );

  return (
    <View style={styles.appBar}>
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

      <TouchableOpacity
        style={styles.settingsButton}
        accessible={true}
        accessibilityLabel={t('Settings')}
        onPress={() => router.push(SCREENS.Settings.toString() as Href)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon size={26} color={colors.primary} source="cog-outline" />
      </TouchableOpacity>
    </View>
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
    minHeight: touchTarget.nav + space[4],
  },
  appTitleContainer: {
    paddingLeft: space[3],
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
    gap: space[1],
    flexShrink: 1,
    minHeight: touchTarget.nav,
    paddingVertical: space[2],
  },
  titleTextBlock: {
    flexShrink: 1,
    marginRight: space[4],
  },
  appTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textStrong,
  },
  placeSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.primary,
  },
  settingsButton: {
    width: touchTarget.nav,
    height: touchTarget.nav,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space[2],
  },
  warningIcons: {
    flexDirection: 'row',
    flex: 1,
    height: 30,
  },
});
