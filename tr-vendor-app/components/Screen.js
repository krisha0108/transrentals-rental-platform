import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Screen({
  children,
  style,
  useSafeTop = true,
  useSafeBottom = true,
  bg = '#F6F8F7',
  ...rest
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: bg,
          paddingTop: useSafeTop ? insets.top : 0,
          paddingBottom: useSafeBottom ? insets.bottom : 0,
        },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}
