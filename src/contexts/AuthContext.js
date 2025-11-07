import React, { createContext, useState, useEffect, useContext } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { auth } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  const signup = async (email, password, displayName) => {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    // Update user profile with display name
    if (displayName && result.user) {
      await result.user.updateProfile({
        displayName: displayName
      });
    }
    // Save credentials for biometric login
    await SecureStore.setItemAsync('userEmail', email);
    await SecureStore.setItemAsync('userPassword', password);
    return result;
  };

  const login = async (email, password) => {
    const result = await auth.signInWithEmailAndPassword(email, password);
    // Save credentials for biometric login
    await SecureStore.setItemAsync('userEmail', email);
    await SecureStore.setItemAsync('userPassword', password);
    return result;
  };

  const biometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your expenses',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Retrieve stored credentials
        const email = await SecureStore.getItemAsync('userEmail');
        const password = await SecureStore.getItemAsync('userPassword');

        if (email && password) {
          return await auth.signInWithEmailAndPassword(email, password);
        } else {
          throw new Error('No stored credentials found');
        }
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Don't clear credentials on logout for biometric login
    return auth.signOut();
  };

  const clearStoredCredentials = async () => {
    await SecureStore.deleteItemAsync('userEmail');
    await SecureStore.deleteItemAsync('userPassword');
  };

  const hasStoredCredentials = async () => {
    const email = await SecureStore.getItemAsync('userEmail');
    return !!email;
  };

  const updateUserProfile = async (updates) => {
    try {
      if (auth.currentUser) {
        const currentUser = auth.currentUser;
        await currentUser.updateProfile(updates);
        // Force refresh the user object
        await currentUser.reload();
        // Create a new user object to trigger React updates
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          emailVerified: currentUser.emailVerified,
          ...currentUser
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      await auth.sendPasswordResetEmail(email);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };

  const value = {
    user,
    signup,
    login,
    biometricLogin,
    logout,
    loading,
    biometricAvailable,
    clearStoredCredentials,
    hasStoredCredentials,
    updateUserProfile,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
