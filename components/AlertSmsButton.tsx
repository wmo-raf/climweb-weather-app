import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon, Portal, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as SMS from 'expo-sms';

import { CAPAlert } from '@/lib/alerts/providers/cap-alerts/alert';
import { buildSmsText } from '@/lib/alerts/providers/cap-alerts/plain-language';
import { Radius } from '@/lib/theme';

type AlertSmsButtonProps = {
  alert: CAPAlert;
  textColor: string;
  backgroundColor: string;
};

// A dedicated SMS action, separate from AlertShareButton's image share:
// the native OS share sheet (used by AlertShareButton) never reports back
// which app the user picked, so there's no reliable way to detect "the
// destination is SMS" from within a general share flow and swap in text
// there instead — SMS has to be its own explicit entry point, going
// straight to expo-sms's native compose UI with a plain-text body built by
// buildSmsText (see plain-language.ts).
function AlertSmsButton({ alert, textColor, backgroundColor }: AlertSmsButtonProps) {
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const onPress = async () => {
    if (sending) return;
    setSending(true);
    try {
      const message = buildSmsText(t, alert);
      if (!message || !(await SMS.isAvailableAsync())) {
        setUnavailable(true);
        return;
      }
      // No addresses passed — the user picks recipients in the native
      // compose UI that opens with this message pre-filled.
      await SMS.sendSMSAsync([], message);
    } catch (error) {
      console.error('Failed to open SMS composer for alert', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor }]}
        onPress={onPress}
        disabled={sending}
        accessibilityLabel={t('alert.sms')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {sending ? <ActivityIndicator size="small" color={textColor} /> : <Icon source="message-text-outline" size={20} color={textColor} />}
      </TouchableOpacity>
      <Portal>
        <Snackbar visible={unavailable} onDismiss={() => setUnavailable(false)} duration={4000}>
          {t('alert.sms.unavailable')}
        </Snackbar>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: Radius.extraLarge,
  },
});

export default AlertSmsButton;
