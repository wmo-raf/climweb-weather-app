import React, { JSX, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { WRAP_AT_SPACES } from '@/components/PartCard';
import { ThemeColors, Fonts } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';
import { Advisory, Banner } from './marine';

// Background, border/icon and title colour per advisory.
export const advisoryColors = (colors: ThemeColors, level: Advisory) => ({
  okay: { bg: colors.advisoryOkayBg, accent: colors.advisoryOkay, title: colors.advisoryOkayTitle },
  takeCare: { bg: colors.advisoryTakeCareBg, accent: colors.advisoryTakeCare, title: colors.advisoryTakeCareTitle },
  danger: { bg: colors.advisoryDangerBg, accent: colors.advisoryDanger, title: colors.advisoryDangerTitle },
}[level]);

const ICONS: Record<Advisory, string> = { okay: 'flag', takeCare: 'flag', danger: 'block-helper' };

// The day's one advisory: an icon, the title and a line of words, read by
// screen readers as one item.
function AdvisoryBanner({ banner }: { banner: Banner }): JSX.Element {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tone = advisoryColors(colors, banner.level);

  return (
    <View
      style={[styles.banner, { backgroundColor: tone.bg, borderColor: tone.accent }]}
      accessible={true}
      accessibilityLabel={[banner.title, banner.line].filter(Boolean).join('. ')}
      testID={`at-sea-banner-${banner.level}`}
    >
      <Icon source={ICONS[banner.level]} size={28} color={tone.accent} />
      <View style={styles.text}>
        <Text style={[styles.title, { color: tone.title }]} {...WRAP_AT_SPACES}>{banner.title}</Text>
        {!!banner.line && <Text style={styles.line} {...WRAP_AT_SPACES}>{banner.line}</Text>}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 15,
    borderWidth: 1,
    borderRadius: 12,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.sans.bold,
  },
  line: {
    fontSize: 13.5,
    fontFamily: Fonts.sans.regular,
    color: colors.textStrong,
  },
});

export default AdvisoryBanner;
