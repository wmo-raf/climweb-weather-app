import React, { JSX } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';

import AppBar from '@/components/AppBar';
import Alerts from '@/components/Alerts';

import { RootState } from '@/lib/store';
import { useTranslation } from 'react-i18next';
import { colors, fonts, space } from '@/lib/theme';

function AboutUsScreen(): JSX.Element {
  const { t } = useTranslation();
  const { lat, lon } = useSelector((state: RootState) => state.location);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={t("About us")} />
          <Alerts lat={lat} lon={lon} location={"About us"} />
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

const styles = StyleSheet.create({
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
});

export default AboutUsScreen;
