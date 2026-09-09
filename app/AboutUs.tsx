import React, { JSX, useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';

import AppBar from '@/components/AppBar';
import Alerts from '@/components/Alerts';

import { useLocationStore } from '@/lib/store/location.store';
import { useTranslation } from 'react-i18next';
import { ThemeColors, Fonts, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

function AboutUsScreen(): JSX.Element {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const lat = useLocationStore(s => s.lat);
  const lon = useLocationStore(s => s.lon);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={t("About us")} />
          <Alerts lat={lat} lon={lon} location={"About us"} />
          <View style={styles.container}>
            <View style={styles.opacity}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                  <Text variant="bodyMedium">
                    <Text style={styles.title}>
                      {t('placeholder_app_title')}
                    </Text>{"\n"}
                  </Text>
                  <Text variant="bodyMedium">
                    <Text style={styles.whiteHeader}>{t('how.we.started')}</Text>{"\n"}
                    <Text style={styles.whiteText}>
                      {t('placeholder_lorem_ipsum')}
                    </Text>
                  </Text>
                  <Text variant="bodyMedium" style={{ marginTop: 40 }}>
                    <Text style={styles.whiteHeader}>{t('our.mandate')}</Text>{"\n"}
                    <Text style={styles.whiteText}>
                      {t('placeholder_lorem_ipsum')}
                    </Text>
                  </Text>
                  <Text variant="bodyMedium" style={{ marginTop: 40 }}>
                    <Text style={styles.whiteHeader}>{t('our.mission')}</Text>{"\n"}
                    <Text style={styles.whiteText}>
                      {t('placeholder_lorem_ipsum')}
                    </Text>
                  </Text>
                  <Text variant="bodyMedium" style={{ marginTop: 40 }}>
                    <Text style={styles.whiteHeader}>{t('our.vision')}</Text>{"\n"}
                    <Text style={styles.whiteText}>
                      {t('placeholder_lorem_ipsum')}
                    </Text>
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
  },
  opacity: {
    flexDirection: 'column',
    flex: 1,
  },
  whiteHeader: {
    color: colors.textStrong,
    fontSize: 18,
    fontFamily: Fonts.sans.bold,
  },
  whiteText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts.sans.regular,
  },
  title: {
    color: colors.textStrong,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Fonts.sans.bold,
  },
  wrapper: {
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    margin: 0,
    padding: 0,
    overflow: 'scroll',
    backgroundColor: colors.bgAlt,
  },
  bg: {
    height: '100%',
    backgroundColor: colors.bgAlt,
  },
  content: {
    marginTop: Spacing.xl,
    marginLeft: Spacing.xl,
    marginRight: Spacing.xl,
  },
});

export default AboutUsScreen;
