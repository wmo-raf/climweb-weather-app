import React, { JSX, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { WRAP_AT_SPACES } from '@/components/PartCard';
import { ThemeColors, Fonts, Radius, shadow, Spacing, touchTarget } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';
import { areaName, suggestAreas } from './marine';
import { MarineArea } from './settings';

type AreaPickerProps = {
  areas: MarineArea[];
  selected: MarineArea;
  onSelect: (area: MarineArea) => void;
  // The selected place: suggestions are nearest it first.
  origin?: { lat: number; lon: number };
};

// "Where are you going?", working like the place search (components/
// Search.tsx): the field shows the chosen marine area; tapping it clears it
// and suggests the three areas nearest the place, typing narrows them
// (up to four), and tapping an area picks it. The page starts on the area nearest
// the selected place.
function AreaPicker({ areas, selected, onSelect, origin }: AreaPickerProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const name = (area: MarineArea) => areaName(area, i18n.language);
  const matches = suggestAreas(query, areas, name, origin);

  const close = () => {
    setOpen(false);
    setQuery('');
    input.current?.blur();
  };

  const pick = (area: MarineArea) => {
    close();
    onSelect(area);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('atSea.area.label')}</Text>
      <View style={styles.field}>
        <Icon source="magnify" color={colors.primary} size={24} />
        <TextInput
          ref={input}
          value={open ? query : name(selected)}
          onChangeText={setQuery}
          onFocus={() => { setQuery(''); setOpen(true); }}
          // Late enough that a tap on an area lands first (web blurs the
          // field before the tap).
          onBlur={() => setTimeout(() => { setOpen(false); setQuery(''); }, 200)}
          placeholder={t('atSea.area.search')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          accessibilityLabel={t('atSea.area.label')}
          accessibilityHint={t('atSea.area.search')}
          returnKeyType="done"
          onSubmitEditing={() => (matches.length === 1 ? pick(matches[0]) : close())}
          testID="at-sea-area-picker"
        />
      </View>

      {open && (
        <View style={styles.list} testID="at-sea-area-list">
          {matches.length === 0 && (
            <Text style={styles.nothing}>{t('atSea.area.nothingFound')}</Text>
          )}
          {matches.map(area => {
            const isSelected = area.id === selected.id;
            return (
              <Pressable
                key={area.id}
                onPress={() => pick(area)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                testID={`at-sea-area-${area.id}`}
              >
                <Text style={[styles.rowText, isSelected && styles.rowTextSelected]} {...WRAP_AT_SPACES}>{name(area)}</Text>
                {isSelected && <Icon source="check" size={20} color={colors.primary} />}
              </Pressable>
            );
          })}
        </View>
      )}

    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  // Matches the place search bar.
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: touchTarget.nav,
    paddingHorizontal: Spacing.lg,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: Radius.small,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: touchTarget.nav,
    fontSize: 16,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
  },
  // Matches the place search's suggestion list.
  list: {
    marginTop: -2,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.small,
    overflow: 'hidden',
    ...shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: touchTarget.nav,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  rowPressed: {
    backgroundColor: colors.bgHover,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
  },
  rowTextSelected: {
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  nothing: {
    padding: 15,
    fontSize: 16,
    fontFamily: Fonts.sans.regular,
    color: colors.textSubtle,
    textAlign: 'center',
  },
});

export default AreaPicker;
