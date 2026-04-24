// WeakRef polyfill for older Hermes/Android versions
if (typeof WeakRef === 'undefined') {
  global.WeakRef = class WeakRef {
    constructor(target) { this._target = target; }
    deref() { return this._target; }
  };
}

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
