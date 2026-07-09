import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Icon, Menu } from 'react-native-paper';

import { shallowEqual, useSelector } from 'react-redux';
import { useNavigation, useRouter, Href, usePathname } from 'expo-router';

import { SCREENS } from '@/lib/layout/constants';
import { WEATHER_WARNING_ICONS } from '@/lib/alerts/providers/cap-alerts/icons';
import { RootState } from '@/lib/store';
import { CAPAlert, CAPInfo, alertInLocation, alertLevel } from '@/lib/alerts/providers/cap-alerts/alert';
import { useTranslation } from 'react-i18next';
import { ParamListBase, RouteProp } from 'expo-router/react-navigation';
import { colors, fonts, radius, shadow, space } from '@/lib/theme';

const backArrow = require('@/assets/icons8-back-100_2.png');

type AppBarProps = {
  location: string,
  route?: RouteProp<ParamListBase>
};

const AppBar = (props: AppBarProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();

  const { alerts } = useSelector((state: RootState) => state.alerts, shallowEqual);
  const { lat, lon } = useSelector((state: RootState) => state.location, shallowEqual);

  const showSearch = !pathname.includes(SCREENS.Search);
  const [visible, setVisible] = React.useState(false);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  

  let relevantAlerts: CAPAlert[] = []
  if (lat && lon) {
    relevantAlerts = alerts.filter(alert => alertInLocation(alert, { latitude: lat, longitude: lon }))
  }

  return (
    <View style={styles.appBar}>
      <View style={styles.appTitleContainer}>
        {navigation.canGoBack() &&
          <TouchableOpacity accessible={true} accessibilityLabel='Go back' onPress={() => navigation.goBack()} style={{ paddingRight: 12 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon size={28} color={colors.primary} source={backArrow} />
          </TouchableOpacity>}
        <Text style={styles.appTitle} numberOfLines={1}>{props.location || "Climweb Weather App"}</Text>
        {getWarningIcons(relevantAlerts)}
      </View>

      <View style={styles.appNav}>
        {showSearch &&
          <TouchableOpacity style={styles.items} accessible={true} accessibilityLabel='Search'
            onPress={() => router.push(SCREENS.Search.toString() as Href)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon size={28} color={colors.primary} source="magnify" />
          </TouchableOpacity>
        }
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
          }}>
          <Menu
            visible={visible}
            onDismiss={closeMenu} anchor={<TouchableOpacity accessible={true} accessibilityLabel={visible ? 'Close menu' : 'Open menu'} onPress={() => openMenu()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Icon size={28} color={colors.primary} source={visible ? "close" : "menu"} /></TouchableOpacity>}
            style={{ position: 'absolute', right: 0, width: 185 }}
            contentStyle={{ backgroundColor: colors.bg, borderRadius: radius.md, marginTop: 25, padding: 0, ...shadow.md, borderWidth: 1, borderColor: colors.border }}
          >
            <Menu.Item
              onPress={() => {
                closeMenu();
                router.push(SCREENS.AboutUs.toString() as Href);
              }}
              style={styles.menuItem}
              accessibilityLabel='About the developers'
              titleStyle={styles.menuItemTitle}
              title={t("About us")}
            />
            <Menu.Item
              onPress={() => {
                closeMenu();
                router.push(SCREENS.AboutTheApp.toString() as Href);
              }}
              style={styles.menuItem}
              accessibilityLabel='About the app'
              titleStyle={styles.menuItemTitle}
              title={t("About the app")}
            />
            <Menu.Item
              onPress={() => {
                closeMenu();
                router.push(SCREENS.Settings.toString() as Href);
              }}
              style={styles.menuItem}
              accessibilityLabel='Settings'
              titleStyle={styles.menuItemTitle}
              title={t("Settings")}
            />
          </Menu>
        </View>
      </View>
    </View>
  );
}

const getWarningIcons = (alerts: Array<CAPAlert>) => {
  if (alerts && alerts.length) {
    const icons: Array<React.JSX.Element> = [];
    for (let i = 0, j = 0; i < alerts.length; i += 1, j += 20) {
      const capInfo = alerts[i].info as Array<CAPInfo>;
      const alertColor = alertLevel(capInfo[0]).toLowerCase();
      const icon = WEATHER_WARNING_ICONS[alertColor];
      icons.push(
        <TouchableOpacity key={i} style={{ position: 'relative', top: 0, right: j, zIndex: j }}>
          <Image style={{ width: 35, height: 30 }} source={icon} />
        </TouchableOpacity>
      );
    }
    return <View style={styles.warningIcons}>
      {icons}
    </View>;
  }
};

export default AppBar;

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    alignContent: 'center',
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appTitleContainer: {
    paddingRight: space[3],
    paddingLeft: space[3],
    paddingTop: space[4],
    paddingBottom: space[4],
    flex: 7,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 1,
  },
  appTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textStrong,
    marginRight: space[4],
    flex: 1,
  },
  appNav: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1,
    paddingRight: space[4],
    paddingLeft: space[4],
    paddingTop: space[3],
    paddingBottom: space[3],
  },
  items: {
    paddingRight: space[4],
  },
  menuItem: {
    paddingRight: 50,
    paddingLeft: space[4],
  },
  menuItemTitle: {
    color: colors.text,
    fontFamily: fonts.regular,
  },
  weatherWarning: {
    paddingLeft: space[3],
  },
  warningIcons: {
    flexDirection: 'row',
    flex: 1,
    height: 30,
  },
});
