import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import AlertShareCard from './AlertShareCard';
import { CAPAlert } from '@/lib/alerts/providers/cap-alerts/alert';
import { radius } from '@/lib/theme';

type AlertShareButtonProps = {
  alert: CAPAlert;
  textColor: string;
  backgroundColor: string;
};

// Renders the branded AlertShareCard off-screen purely so it can be
// captured to a PNG on demand — nothing here is ever visible to the user.
function AlertShareButton({ alert, textColor, backgroundColor }: AlertShareButtonProps) {
  const { t } = useTranslation();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const onShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('alert.share.dialogTitle') });
      } else {
        console.warn(t('alert.share.unavailable'));
      }
    } catch (error) {
      console.error('Failed to share alert', error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor }]}
        onPress={onShare}
        disabled={sharing}
        accessibilityLabel={t('alert.share')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {sharing ? <ActivityIndicator size="small" color={textColor} /> : <Icon source="share-variant" size={20} color={textColor} />}
      </TouchableOpacity>

      <View style={styles.offscreen} pointerEvents="none">
        <AlertShareCard ref={cardRef} alert={alert} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: radius.full,
  },
  offscreen: {
    position: 'absolute',
    top: -9999,
    left: -9999,
  },
});

export default AlertShareButton;
