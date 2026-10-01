import React, { useEffect, useState } from 'react';
import { Modal, View, Dimensions, StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// React Native 0.78 (new architecture) sizes a Modal's root from a native
// state update that some Android phones never deliver, so the root stays
// 0x0 and every `flex: 1` overlay collapses into the top-left corner.
// React Native 0.79+ fixes this by giving the first render the screen size;
// this wrapper does the same from JS until the app is on a fixed version.
//
// The content is laid out at the screen size until the root reports a real
// size, then it simply fills the root as a normal Modal would.
// The Modal's window covers the whole screen only when both bars are
// translucent; otherwise the system bars take their share of the height.
const fallbackSize = ({ statusBarTranslucent, navigationBarTranslucent }) => {
  const screen = Dimensions.get('screen');
  const window = Dimensions.get('window');
  if (navigationBarTranslucent) {
    return { width: screen.width, height: screen.height };
  }
  const statusBarHeight = statusBarTranslucent ? 0 : StatusBar.currentHeight || 0;
  return { width: window.width, height: window.height - statusBarHeight };
};

const SafeModal = ({ children, ...props }) => {
  const [rootMeasured, setRootMeasured] = useState(false);

  // Each time the Modal opens it gets a fresh native root, so measure again.
  useEffect(() => {
    if (props.visible === false) {
      setRootMeasured(false);
    }
  }, [props.visible]);

  const handleProbeLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setRootMeasured(width > 0 && height > 0);
  };

  return (
    <Modal {...props}>
      <View
        style={StyleSheet.absoluteFill}
        onLayout={handleProbeLayout}
        pointerEvents="none"
      />
      {/* A Modal is its own native window on Android, so gesture handlers
          inside it need their own root. */}
      <GestureHandlerRootView style={rootMeasured ? styles.fill : [styles.fallback, fallbackSize(props)]}>
        {children}
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  fallback: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default SafeModal;
