import React, { JSX, useMemo } from 'react';
import { StyleSheet, View, Linking, ListRenderItemInfo, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';

import AppBar from '@/components/AppBar';
import Alerts from '@/components/Alerts';

import { RootState } from '@/lib/store';
import { useTranslation } from 'react-i18next';
import { ThemeColors, fonts, space } from '@/lib/theme';
import { useThemeColors } from '@/lib/theme/ThemeContext';

const bulletListIcon = require('@/assets/time-period-bullet.png');

function AboutTheAppScreen(): JSX.Element {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { lat, lon } = useSelector((state: RootState) => state.location);

  const getPartners = (): Array<string> => ([
    'Norwegian Meteorological Institute',
    'NORAD',
    'NORCAP',
    'World Meteorological Organisation',
    'Save the Children'
  ]);

  const renderPartner = (item: ListRenderItemInfo<string>) => <View style={styles.partnerItem}>
    <Image style={styles.bulletStyle} source={bulletListIcon} /><Text style={styles.partnerText}> {item.item}</Text>
  </View>;

  const onClickURL = (url: string) => Linking.openURL(url);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={t("About the app")} />
          <Alerts lat={lat} lon={lon} location={"About the app"} />
          <View style={styles.container}>
            <View style={styles.opacity}>
              <FlatList
                data={[{ key: 'data' }]}
                showsVerticalScrollIndicator={false}
                snapToStart={false}
                renderItem={() => (
                  <>
                    <View style={styles.content}>
                      <Text variant="bodyMedium">
                        <Text style={styles.title}>{t('app.and.forecasts')}</Text>
                      </Text>
                      <Text variant="bodyMedium">
                        <Text style={styles.whiteText}>
                          {t('app.and.forecasts.desc')}
                        </Text>
                      </Text>
                      <View>
                        <View>
                          <Text style={styles.whiteHeader}>
                            {"\n"}{t('partners')}:
                          </Text>
                          <FlatList data={getPartners()} renderItem={(item: ListRenderItemInfo<string>) => renderPartner(item)} key={new Date().toISOString()} />
                        </View>
                      </View>
                      <Text variant="bodyMedium">
                        <Text style={styles.whiteHeader}>{"\n"}{t('Icons')}</Text>{"\n"}
                        <Text style={styles.whiteText}>
                          <Text style={styles.whiteText}>
                            {t("icons.disclaimer")} <Text onPress={() => onClickURL('https://yr.no/NRK')} style={{ ...styles.whiteText, ...styles.ln }}>yr.no/NRK</Text>.
                          </Text>{"\n"}{"\n"}
                          {t('warning.icons.disclaimer')}
                        </Text>
                      </Text>
                      <Text variant="bodyMedium">
                        <Text style={styles.whiteHeader}>{"\n"}{t('Geographical Data')}</Text>{"\n"}
                        <Text style={styles.whiteText}>
                          {t('geographical.data.disclaimer')} <Text onPress={() => onClickURL('https://download.geonames.org/export/dump/MW.zip')} style={{ ...styles.whiteText, ...styles.ln }}>Geonames</Text>.{"\n"}{"\n"}{"\n"}
                        </Text>
                      </Text>
                    </View>
                  </>
                )}
              />
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
    fontFamily: fonts.bold,
  },
  whiteText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
  title: {
    color: colors.textStrong,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.bold,
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
    marginTop: space[6],
    marginLeft: space[6],
    marginRight: space[6],
  },
  ln: {
    textDecorationLine: 'underline',
    color: colors.info,
  },
  partnerItem: {
    flexDirection: 'row',
  },
  partnerText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 25,
    fontFamily: fonts.regular,
  },
  bulletStyle: {
    height: 7,
    width: 7,
    alignSelf: 'center',
  },
});

export default AboutTheAppScreen;
