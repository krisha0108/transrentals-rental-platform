module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // react-native-reanimated/plugin must stay LAST — it rewrites worklets and
  // expects to run after every other plugin. Reanimated is here as the peer
  // dependency of react-native-keyboard-controller, which drives the
  // keyboard-aware scrolling in the Travel Agent forms.
  plugins: ['react-native-reanimated/plugin'],
};
