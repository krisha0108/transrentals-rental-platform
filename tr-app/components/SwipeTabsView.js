import React, { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// A View whose content can be swiped to change tabs: right-to-left for the
// next tab, left-to-right for the previous one.
//
// This uses react-native-gesture-handler rather than PanResponder. On the new
// architecture a PanResponder inside a Modal's ScrollView often never sees
// the move events, so the swipe did nothing. The native pan recogniser below
// wins over the ScrollView for horizontal drags and gives vertical drags back
// to it, so the content still scrolls normally.

// The finger has to move this far sideways before the swipe takes over...
const ACTIVE_OFFSET_X = 12;
// ...and a drag that goes this far up or down first is left as a scroll.
const FAIL_OFFSET_Y = 20;
// On release, a swipe counts once it has travelled far enough or was fast.
const SWIPE_DISTANCE = 50;
const SWIPE_VELOCITY = 500; // px per second

/**
 * @param {string[]} tabs - tab keys in display order
 * @param {string} activeTab - the current tab key
 * @param {(tab: string) => void} onChange - called with the tab to show
 */
const SwipeTabsView = ({ tabs, activeTab, onChange, children, ...viewProps }) => {
  // The gesture is created once, so read the latest values through a ref.
  const latest = useRef({ tabs, activeTab, onChange });
  latest.current = { tabs, activeTab, onChange };

  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X])
        .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
        .onEnd((event, success) => {
          if (!success) return;
          const { translationX, translationY, velocityX } = event;
          if (Math.abs(translationX) <= Math.abs(translationY)) return;
          const swiped =
            Math.abs(translationX) > SWIPE_DISTANCE || Math.abs(velocityX) > SWIPE_VELOCITY;
          if (!swiped) return;
          const { tabs: list, activeTab: current, onChange: change } = latest.current;
          const index = list.indexOf(current);
          if (index === -1) return;
          const next = translationX < 0 ? index + 1 : index - 1;
          if (next >= 0 && next < list.length) {
            change(list[next]);
          }
        }),
    [],
  );

  return (
    <GestureDetector gesture={swipe}>
      <View collapsable={false} {...viewProps}>
        {children}
      </View>
    </GestureDetector>
  );
};

export default SwipeTabsView;
