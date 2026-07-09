import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';

import { fonts, radius, space } from '@/lib/theme';

// Maps i18next locale codes to expo-speech voice locales. Only English is a
// real locale today — Swahili is added here once Step 6 registers it so this
// doesn't need to change later.
const SPEECH_LANGUAGES: Record<string, string> = {
  en: 'en-US',
  sw: 'sw-KE',
};

type ListenButtonProps = {
  text: string;
  textColor: string;
  backgroundColor: string;
};

function ListenButton({ text, textColor, backgroundColor }: ListenButtonProps) {
  const { t, i18n } = useTranslation();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const toggle = async () => {
    if (speaking) {
      await Speech.stop();
      setSpeaking(false);
      return;
    }

    setSpeaking(true);
    Speech.speak(text, {
      language: SPEECH_LANGUAGES[i18n.language] ?? 'en-US',
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }]}
      onPress={toggle}
      accessibilityLabel={speaking ? t('alert.stop') : t('alert.listen')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Icon source={speaking ? 'stop' : 'volume-high'} size={18} color={textColor} />
      <Text style={[styles.label, { color: textColor }]}>{speaking ? t('alert.stop') : t('alert.listen')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    borderRadius: radius.full,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
});

export default ListenButton;
