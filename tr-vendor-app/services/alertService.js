import { EventEmitter } from 'eventemitter3';

const emitter = new EventEmitter();

export const alertService = {
  show(type = 'info', title = '', message = '', options = {}) {
    emitter.emit('SHOW_ALERT', { type, title, message, ...options });
  },
  confirm(title, message, onConfirm, options = {}) {
    emitter.emit('SHOW_ALERT', {
      type: 'warning',
      title,
      message,
      actions: [
        { label: options.cancelText || 'Cancel', onPress: options.onCancel || (() => {}), variant: 'ghost' },
        { label: options.confirmText || 'Confirm', onPress: onConfirm, variant: 'primary', destructive: options.destructive },
      ],
      dismissOnBackdrop: false,
      showCloseX: false,
      ...options,
    });
  },
  subscribe(callback) {
    emitter.on('SHOW_ALERT', callback);
    return () => emitter.off('SHOW_ALERT', callback);
  },
};

// Shorthand helpers
export const showAlert = (type, title, message, options) =>
  alertService.show(type, title, message, options);

export const showError = (message, title = 'Error') =>
  alertService.show('error', title, message);

export const showSuccess = (message, title = 'Success', options) =>
  alertService.show('success', title, message, options);

export const showInfo = (message, title = 'Info') =>
  alertService.show('info', title, message);

export const showConfirm = (title, message, onConfirm, options) =>
  alertService.confirm(title, message, onConfirm, options);
