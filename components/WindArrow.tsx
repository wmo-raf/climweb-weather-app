import React, { JSX } from 'react';
import { View } from 'react-native';
import { Icon } from 'react-native-paper';

type WindArrowProps = {
  fromDegrees: number; // where the wind blows from (0 = north)
  size: number;
  color: string;
  accessibilityLabel?: string;
};

// Points the way the wind blows (downwind), as on Yr: arrow-down points
// south, so a north wind (0°) needs no rotation.
function WindArrow({ fromDegrees, size, color, accessibilityLabel }: WindArrowProps): JSX.Element {
  return (
    <View
      style={{ transform: [{ rotate: `${fromDegrees}deg` }] }}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      testID="wind-arrow"
    >
      <Icon source="arrow-down" size={size} color={color} />
    </View>
  );
}

export default WindArrow;
