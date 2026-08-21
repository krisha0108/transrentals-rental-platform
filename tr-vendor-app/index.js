/**
 * @format
 */

import React from 'react';
import {AppRegistry} from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import {name as appName} from './app.json';

// Report any uncaught JS exception to Crashlytics before React's own error
// handling (or the native red-box) takes over, so we get a real stack trace
// for crashes that happen outside a component render (e.g. in an event
// handler or a promise chain) instead of only guessing from source.
const defaultHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  crashlytics().recordError(error);
  defaultHandler(error, isFatal);
});

const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

AppRegistry.registerComponent(appName, () => AppWithErrorBoundary);
