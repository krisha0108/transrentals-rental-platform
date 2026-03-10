import React, { useState, useEffect } from 'react';
import CustomAlert from './CustomAlert';
import { alertService } from '../services/alertService';

export default function GlobalAlert() {
  const [alertConfig, setAlertConfig] = useState(null);

  useEffect(() => {
    const unsubscribe = alertService.subscribe((config) => {
      setAlertConfig({ ...config, visible: true });
    });
    return unsubscribe;
  }, []);

  const handleClose = () => {
    setAlertConfig(prev => prev ? { ...prev, visible: false } : null);
  };

  if (!alertConfig) return null;

  // Wrap each action's onPress to auto-close the modal before running the callback
  const wrappedActions = alertConfig.actions?.map(a => ({
    ...a,
    onPress: () => { handleClose(); a.onPress?.(); },
  }));

  return (
    <CustomAlert
      visible={alertConfig.visible}
      type={alertConfig.type}
      title={alertConfig.title}
      message={alertConfig.message}
      actions={wrappedActions}
      autoCloseMs={alertConfig.autoCloseMs}
      dismissOnBackdrop={alertConfig.dismissOnBackdrop}
      showCloseX={alertConfig.showCloseX}
      onClose={handleClose}
    />
  );
}
