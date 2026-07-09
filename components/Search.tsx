import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Dialog, Portal, Button, Text } from 'react-native-paper';
import { isNil } from 'lodash';
import { Icon } from 'react-native-paper';

import {
  AutocompleteDropdown,
  TAutocompleteDropdownItem,
} from '@/lib/autocomplete';

import { placeByCurrentLocation } from '@/lib/geo/location';
import { Place } from '@/lib/geo/places';

import geonames from '@/assets/geonames.json'
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, shadow, space } from '@/lib/theme';
const locationAnchor = require('@/assets/location-anchor.png');

type SearchProps = {
  location: string;
  setLocation: (place: Place) => void;
};

type GPS = "INACTIVE" | "SEARCHING" | "FAILED";

export const Search = ({ setLocation }: SearchProps) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

  const [gpsSearch, setGPSSearch] = useState<GPS>("INACTIVE");

  const handleSelect = (item: TAutocompleteDropdownItem) => {
    if (item) {
      setLocation(geonames[item.id]);
    }
  };

  const handlePlaceByCurrentLocation = async () => {
    setGPSSearch("SEARCHING")

    try {
      const place = await placeByCurrentLocation()
      if (place) {
        setGPSSearch("INACTIVE")
        setLocation(place)
      }
    } catch {
      setGPSSearch("FAILED")
      showDialog();
      console.error("Not able to set closest place to current location.")
    }
  }

  return (
    <View>
      <View style={styles.container}>
        <AutocompleteDropdown
          clearOnFocus={true}
          closeOnBlur={false}
          closeOnSubmit={true}
          textInputProps={{ placeholder: t('Search location'), placeholderTextColor: colors.textMuted, style: styles.textStyle }}
          onSelectItem={handleSelect}
          inputContainerStyle={styles.searchBar}
          debounce={100}
          showChevron={false}
          showClear={false}
          RightIconComponent={<TouchableOpacity accessible={true} accessibilityLabel='Go to current location' onPress={handlePlaceByCurrentLocation} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Icon source={locationAnchor} size={24} /></TouchableOpacity>}
          LeftComponent={<TouchableOpacity accessible={true} accessibilityLabel='Search' onPress={() => { }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Icon source={'magnify'} color={colors.primary} size={24} /></TouchableOpacity>}
          useFilter={true}
          suggestionsListContainerStyle={styles.suggestionListStyle}
          suggestionsListTextStyle={styles.textStyle}
          containerStyle={{ zIndex: 1 }}
          inputHeight={48}
          renderItem={(item: any) => <Text style={{ color: colors.text, fontFamily: fonts.regular, fontSize: 16, padding: 15, width: '100%', flexGrow: 1, flexShrink: 0 }}>{isNil(item.region) ? item.title : `${item.title}, ${item.region}`}</Text>}
        />
      </View>
      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog} style={styles.dialogStyle}>
          <Dialog.Title style={styles.whiteText}>Alert</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.whiteText}>Not able to use your location to find the closest place.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}><Text style={styles.whiteText}>Dismiss</Text></Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <GPSFeedback status={gpsSearch} />
    </View>
  );
};

type GPSFeedbackProps = {
  status: GPS
}

const GPSFeedback = ({ status }: GPSFeedbackProps) => {
  if (status === "SEARCHING") {
    return (
      <View style={styles.loader}>
        <ActivityIndicator animating={true} color={colors.primary} size='large' />
      </View>
    )
  }

  return (
    <View>
    </View>
  )
}

const styles = StyleSheet.create({
  searchBar: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingLeft: space[4],
    paddingRight: space[4],
    paddingTop: space[3],
    paddingBottom: space[3],
    borderRadius: radius.md,
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  dialogStyle: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    ...shadow.md,
  },
  whiteText: {
    color: colors.text,
    fontFamily: fonts.regular,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: space[8],
  },
  textStyle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  suggestionListStyle: {
    marginTop: -2,
    padding: 0,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    ...shadow.sm,
  },
  loader: {
    marginTop: space[10],
    marginBottom: space[16],
  },
  gpsfeedback: {
    marginTop: space[10],
    marginBottom: space[16],
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: space[6],
  }
});

export default Search;
