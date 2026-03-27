import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDriverToken, clearDriverToken } from '../screens/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const token = await getDriverToken();
      if (token) {
        const saved = await AsyncStorage.getItem('driver_app_user');
        if (saved) setDriver(JSON.parse(saved));
      }
    } catch {}
    setLoading(false);
  }

  async function signIn(driverData, token) {
    await AsyncStorage.setItem('driver_app_token', token);
    await AsyncStorage.setItem('driver_app_user', JSON.stringify(driverData));
    setDriver(driverData);
  }

  async function signOut() {
    await clearDriverToken();
    setDriver(null);
  }

  function updateDriver(data) {
    const updated = { ...driver, ...data };
    setDriver(updated);
    AsyncStorage.setItem('driver_app_user', JSON.stringify(updated));
  }

  return (
    <AuthContext.Provider value={{ driver, loading, signIn, signOut, updateDriver }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
