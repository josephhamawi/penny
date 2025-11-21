import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  Clipboard,
  Share,
  Platform
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useAuth } from '../contexts/AuthContext';
import {
  saveWebhookUrl,
  getWebhookUrl,
  clearWebhookUrl
} from '../services/googleSheetsSyncService';
import {
  startSheetPolling,
  enablePolling
} from '../services/sheetPollingService';
import {
  saveMonthlyBudget,
  getMonthlyBudget,
  resetMonthlyBudget
} from '../services/budgetService';
import { importFromGoogleSheets } from '../services/googleSheetsService';
import { manualSyncToSheets, clearAllExpenses } from '../services/expenseService';
import { getUserDatabaseId } from '../services/invitationService';
import { getUserCollabCode } from '../services/collabCodeService';
import { deleteAccount } from '../services/accountDeletionService';
import { formatCurrency } from '../utils/formatNumber';
import { colors, shadows, typography } from '../theme/colors';
import firebase, { auth } from '../config/firebase';
import Constants from 'expo-constants';

const SettingsScreen = ({ navigation }) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [editingBudget, setEditingBudget] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importCancelled, setImportCancelled] = useState(false);
  const [collabCode, setCollabCode] = useState('');
  const [loadingCollabCode, setLoadingCollabCode] = useState(true);
  const [collabCodeError, setCollabCodeError] = useState(false);
  const [expandedCollabCode, setExpandedCollabCode] = useState(false);
  const { user, logout, updateUserProfile } = useAuth();

  useEffect(() => {
    loadWebhookUrl();
    loadBudget();
    loadCollabCode();
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || null);
    }

    // Debug version info
    console.log('[Settings] expoConfig.version:', Constants.expoConfig?.version);
    console.log('[Settings] manifest.version:', Constants.manifest?.version);
  }, [user]);

  const loadWebhookUrl = async () => {
    try {
      const url = await getWebhookUrl();
      if (url) {
        setWebhookUrl(url);
      }
    } catch (error) {
      console.error('Error loading webhook URL:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBudget = async () => {
    try {
      const budget = await getMonthlyBudget();
      setMonthlyBudget(budget.toString());
    } catch (error) {
      console.error('Error loading budget:', error);
    }
  };

  const loadCollabCode = async () => {
    if (!user) {
      setLoadingCollabCode(false);
      return;
    }

    try {
      setLoadingCollabCode(true);
      setCollabCodeError(false);
      const code = await getUserCollabCode(user.uid);
      if (code) {
        setCollabCode(code);
      } else {
        setCollabCodeError(true);
      }
    } catch (error) {
      console.error('Error loading collab code:', error);
      setCollabCodeError(true);
    } finally {
      setLoadingCollabCode(false);
    }
  };

  const handleCopyCollabCode = () => {
    Clipboard.setString(collabCode);
    Toast.show({
      type: 'success',
      text1: 'Code copied!',
      text2: 'Your collab code has been copied to clipboard',
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  const handleShareCollabCode = async () => {
    try {
      await Share.share({
        message: `Collaborate with me on Penny! My code: ${collabCode}`,
        title: 'My Penny Collab Code',
      });
    } catch (error) {
      console.error('Error sharing collab code:', error);
      Toast.show({
        type: 'error',
        text1: 'Share failed',
        text2: 'Unable to share collab code',
        position: 'bottom',
      });
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoURL(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Name',
        text2: 'Please enter a valid name',
        position: 'bottom',
      });
      return;
    }

    setUpdatingProfile(true);
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        photoURL: photoURL
      });

      setEditingName(false);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully',
        position: 'bottom',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile',
        position: 'bottom',
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(user?.displayName || '');
    setPhotoURL(user?.photoURL || null);
    setEditingName(false);
  };

  const handleSaveBudget = async () => {
    const budgetValue = parseFloat(monthlyBudget);

    if (isNaN(budgetValue) || budgetValue <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Budget',
        text2: 'Please enter a valid positive number',
        position: 'bottom',
      });
      return;
    }

    setSavingBudget(true);
    try {
      await saveMonthlyBudget(budgetValue);
      setEditingBudget(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Monthly budget updated successfully',
        position: 'bottom',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save budget',
        position: 'bottom',
      });
    } finally {
      setSavingBudget(false);
    }
  };

  const handleResetBudget = async () => {
    Alert.alert(
      'Reset Budget',
      'Reset to default budget of $5,000?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const defaultBudget = await resetMonthlyBudget();
              setMonthlyBudget(defaultBudget.toString());
              setEditingBudget(false);
              Toast.show({
                type: 'success',
                text1: 'Reset Complete',
                text2: 'Budget reset to default',
                position: 'bottom',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to reset budget',
                position: 'bottom',
              });
            }
          }
        }
      ]
    );
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid URL',
        text2: 'Please enter a valid Google Sheets URL',
        position: 'bottom',
      });
      return;
    }

    setSaving(true);
    try {
      // Only save the URL - import is done separately via "Import from Google Sheets" button
      await saveWebhookUrl(webhookUrl.trim());

      setEditingWebhook(false);
      Toast.show({
        type: 'success',
        text1: 'URL Saved',
        text2: 'Use "Import from Google Sheets" button below to import data',
        position: 'bottom',
      });
    } catch (error) {
      console.error('Error saving Google Sheets URL:', error);
      Toast.show({
        type: 'error',
        text1: 'Save Error',
        text2: error.message || 'Failed to import from Google Sheets. Check the URL and permissions.',
        position: 'bottom',
        visibilityTime: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearWebhook = () => {
    Alert.alert(
      'Clear Sync Configuration',
      'Are you sure you want to remove the Google Sheets sync configuration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearWebhookUrl();
              setWebhookUrl('');
              Toast.show({
                type: 'success',
                text1: 'Cleared',
                text2: 'Sync configuration removed',
                position: 'bottom',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to clear configuration',
                position: 'bottom',
              });
            }
          }
        }
      ]
    );
  };

  const handleManualSync = async () => {
    if (!webhookUrl || !webhookUrl.trim()) {
      Toast.show({
        type: 'error',
        text1: 'No URL Configured',
        text2: 'Please set up Google Sheets URL first',
        position: 'bottom',
      });
      return;
    }

    setImportCancelled(false);
    setSyncing(true);

    try {
      const databaseId = await getUserDatabaseId(user.uid);
      const url = webhookUrl.trim();

      // Check if it's a Google Sheets document URL (for import)
      const isSheetUrl = url.includes('docs.google.com/spreadsheets');

      let importCount = 0;

      // IMPORT ONLY: Import from Google Sheets (if it's a sheet URL)
      if (isSheetUrl) {
        Toast.show({
          type: 'info',
          text1: '📥 Importing...',
          text2: 'Fetching data from Google Sheets',
          position: 'bottom',
          autoHide: false,
        });

        importCount = await importFromGoogleSheets(url, databaseId);

        // Check if user cancelled during import
        if (importCancelled) {
          Toast.hide();
          Toast.show({
            type: 'info',
            text1: 'Import Cancelled',
            text2: 'Import process was stopped by user',
            position: 'bottom',
            visibilityTime: 3000,
          });
          return;
        }

        console.log(`[Sync] Imported ${importCount} expenses from Google Sheets`);

        // Wait a moment for Firebase to process
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        throw new Error('Please provide a Google Sheets URL (not a webhook URL)');
      }

      // Check again if cancelled after processing
      if (importCancelled) {
        Toast.hide();
        return;
      }

      // Show success message
      Toast.hide();

      Toast.show({
        type: 'success',
        text1: 'Import Complete!',
        text2: `✓ Successfully imported ${importCount} expenses`,
        position: 'bottom',
        visibilityTime: 4000,
      });

      console.log('[Sync] Import completed successfully');

    } catch (error) {
      console.error('[Sync] Manual sync error:', error);
      Toast.hide();
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: error.message || 'Failed to sync. Check URL configuration.',
        position: 'bottom',
        visibilityTime: 4000,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCancelImport = () => {
    setImportCancelled(true);
    setSyncing(false);
    Toast.hide();
    Toast.show({
      type: 'info',
      text1: 'Cancelling...',
      text2: 'Stopping import process',
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  const handleViewInstructions = () => {
    Alert.alert(
      'Setup Instructions',
      '1. Open your Google Sheet\n\n' +
      '2. Click Extensions → Apps Script\n\n' +
      '3. Delete any existing code and paste the provided script\n\n' +
      '4. Click Deploy → New deployment\n\n' +
      '5. Select "Web app" as deployment type\n\n' +
      '6. Set "Execute as" to "Me"\n\n' +
      '7. Set "Who has access" to "Anyone"\n\n' +
      '8. Click Deploy and copy the web app URL\n\n' +
      '9. Paste the URL in the field below',
      [{ text: 'Got it' }]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const handleShowVersionInfo = () => {
    const version = Constants.expoConfig?.version || '1.0.0';
    const buildNumber = Platform.select({
      ios: Constants.expoConfig?.ios?.buildNumber || '1',
      android: Constants.expoConfig?.android?.versionCode || '1',
      default: '1'
    });
    const bundleId = Platform.select({
      ios: Constants.expoConfig?.ios?.bundleIdentifier || 'com.penny.app',
      android: Constants.expoConfig?.android?.package || 'com.penny.app',
      default: 'com.penny.app'
    });

    const debugInfo = `Version: ${version}\nBuild: ${buildNumber}\nPlatform: ${Platform.OS}\nBundle ID: ${bundleId}\nEnvironment: ${__DEV__ ? 'Development' : 'Production'}`;

    Alert.alert(
      'App Information',
      debugInfo,
      [
        {
          text: 'Copy',
          onPress: () => {
            Clipboard.setString(debugInfo);
            Toast.show({
              type: 'success',
              text1: 'Copied!',
              text2: 'App information copied to clipboard',
              position: 'bottom',
            });
          }
        },
        { text: 'Close' }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    // First confirmation alert - Warning
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete your account and ALL associated data:\n\n• All expenses\n• Budget settings\n• Goals and personality reports\n• Shared database memberships\n• Profile information\n\nThis action cannot be undone!\n\nPlease enter your password to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            // Password verification prompt
            Alert.prompt(
              '🔒 Verify Password',
              'Enter your password to permanently delete your account:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: async (password) => {
                    if (!password || password.trim() === '') {
                      Alert.alert('Error', 'Password is required');
                      return;
                    }

                    try {
                      // Show loading toast
                      Toast.show({
                        type: 'info',
                        text1: 'Deleting account...',
                        text2: 'This may take a moment',
                        position: 'bottom',
                        autoHide: false,
                      });

                      // Verify password with Firebase
                      const currentUser = auth.currentUser;
                      const credential = firebase.auth.EmailAuthProvider.credential(
                        currentUser.email,
                        password
                      );

                      await currentUser.reauthenticateWithCredential(credential);

                      // Call account deletion service
                      const result = await deleteAccount(currentUser.uid, currentUser);

                      // Hide loading toast
                      Toast.hide();

                      if (result.success) {
                        // Success - account deleted
                        Toast.show({
                          type: 'success',
                          text1: 'Account Deleted',
                          text2: 'Your account has been permanently deleted',
                          position: 'bottom',
                        });

                        // Navigate to login screen
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Login' }],
                        });
                      } else {
                        // Handle specific errors
                        if (result.error === 'transfer_ownership') {
                          Alert.alert(
                            'Cannot Delete Account',
                            result.message,
                            [
                              { text: 'OK' },
                              {
                                text: 'Manage Sharing',
                                onPress: () => navigation.navigate('Invitations')
                              }
                            ]
                          );
                        } else {
                          Alert.alert(
                            'Error',
                            result.message || 'Failed to delete account. Please try again.'
                          );
                        }
                      }
                    } catch (error) {
                      // Hide loading toast
                      Toast.hide();

                      console.error('Error deleting account:', error);

                      // Handle authentication errors
                      if (error.code === 'auth/wrong-password') {
                        Alert.alert('Error', 'Incorrect password. Please try again.');
                      } else if (error.code === 'auth/too-many-requests') {
                        Alert.alert('Error', 'Too many attempts. Please try again later.');
                      } else if (error.code === 'auth/network-request-failed') {
                        Alert.alert('Error', 'Network error. Please check your connection and try again.');
                      } else {
                        Alert.alert('Error', 'Failed to delete account. Please try again.');
                      }
                    }
                  }
                }
              ],
              'secure-text'
            );
          }
        }
      ]
    );
  };

  const handleClearAllData = async () => {
    // First confirmation alert
    Alert.alert(
      '⚠️ Clear All Data',
      'This will permanently delete ALL your expenses. This action cannot be undone!\n\nPlease enter your password to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            // Password verification prompt
            Alert.prompt(
              '🔒 Verify Password',
              'Enter your password to confirm deletion:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Everything',
                  style: 'destructive',
                  onPress: async (password) => {
                    if (!password || password.trim() === '') {
                      Alert.alert('Error', 'Password is required');
                      return;
                    }

                    try {
                      // Verify password with Firebase
                      const user = auth.currentUser;
                      const credential = firebase.auth.EmailAuthProvider.credential(
                        user.email,
                        password
                      );

                      await user.reauthenticateWithCredential(credential);

                      // Password verified, proceed with deletion
                      Toast.show({
                        type: 'info',
                        text1: '🗑️ Deleting...',
                        text2: 'Clearing all expense data',
                        position: 'bottom',
                        autoHide: false,
                      });

                      const result = await clearAllExpenses();

                      Toast.hide();

                      if (result.success) {
                        Toast.show({
                          type: 'success',
                          text1: 'Data Cleared',
                          text2: `✓ Deleted ${result.count} expenses successfully`,
                          position: 'bottom',
                          visibilityTime: 4000,
                        });
                      } else {
                        throw new Error('Failed to clear data');
                      }
                    } catch (error) {
                      Toast.hide();
                      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        Alert.alert('Error', 'Incorrect password. Data was not deleted.');
                      } else {
                        Alert.alert('Error', `Failed to clear data: ${error.message}`);
                      }
                    }
                  }
                }
              ],
              'secure-text'
            );
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingName ? 'Edit Profile' : 'Profile'}</Text>
        {!editingName && (
          <TouchableOpacity style={styles.editButton} onPress={() => setEditingName(true)}>
            <Icon name="pen" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
        {editingName && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleSaveProfile}
            disabled={updatingProfile}
          >
            {updatingProfile ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.updateButtonText}>Update</Text>
            )}
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <TouchableOpacity
          onPress={editingName ? handlePickImage : null}
          style={styles.avatarContainer}
          disabled={!editingName}
        >
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Icon name="user" size={40} color={colors.primary} />
            </View>
          )}
          {editingName && (
            <View style={styles.cameraIcon}>
              <Icon name="camera" size={14} color={colors.text.primary} />
            </View>
          )}
        </TouchableOpacity>

        {editingName ? (
          <View style={styles.editForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Display name</Text>
              <TextInput
                style={styles.formInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Jackson Reed"
                editable={!updatingProfile}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>E-mail</Text>
              <TextInput
                style={[styles.formInput, styles.formInputDisabled]}
                value={user?.email}
                editable={false}
              />
            </View>
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.formCancelButton}
                onPress={handleCancelEdit}
                disabled={updatingProfile}
              >
                <Text style={styles.cancelButtonText}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, updatingProfile && styles.buttonDisabled]}
                onPress={handleSaveProfile}
                disabled={updatingProfile}
              >
                {updatingProfile ? (
                  <ActivityIndicator color={colors.text.primary} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </>
        )}
      </View>

      {/* My Collab Code Section */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setExpandedCollabCode(!expandedCollabCode)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.glass.background }]}>
              <Icon name="key" size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuItemText}>My Collab Code</Text>
          </View>
          {expandedCollabCode ? (
            <Icon name="chevron-down" size={18} color={colors.text.tertiary} />
          ) : (
            <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
          )}
        </TouchableOpacity>

        {expandedCollabCode && (
          <View style={styles.expandedContent}>
            {loadingCollabCode ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : collabCodeError ? (
              <View style={styles.collabCodeError}>
                <Icon name="exclamation-circle" size={40} color={colors.expense} />
                <Text style={styles.errorText}>Unable to load code</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadCollabCode}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.codeDisplay}>
                  <Icon name="key" size={20} color={colors.primary} style={styles.keyIcon} />
                  <Text style={styles.collabCodeText}>{collabCode}</Text>
                </View>
                <Text style={styles.collabCodeDescription}>
                  Share this code with people you want to collaborate with
                </Text>
                <View style={styles.collabCodeActions}>
                  <TouchableOpacity
                    style={[styles.collabCodeButton, styles.copyButton]}
                    onPress={handleCopyCollabCode}
                  >
                    <Icon name="copy" size={16} color={colors.text.primary} />
                    <Text style={styles.collabCodeButtonText}>Copy Code</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.collabCodeButton, styles.shareButton]}
                    onPress={handleShareCollabCode}
                  >
                    <Icon name="share-alt" size={16} color={colors.text.primary} />
                    <Text style={styles.collabCodeButtonText}>Share Code</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </View>

      {/* Settings Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Settings</Text>

        {/* Monthly Budget */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setEditingBudget(!editingBudget)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.glass.background }]}>
              <Icon name="wallet" size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuItemText}>Monthly Budget</Text>
          </View>
          {editingBudget ? (
            <Icon name="chevron-down" size={18} color={colors.text.tertiary} />
          ) : (
            <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
          )}
        </TouchableOpacity>

        {editingBudget && (
          <View style={styles.expandedContent}>
            <View style={styles.budgetInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.budgetInput}
                value={monthlyBudget}
                onChangeText={setMonthlyBudget}
                placeholder="5000"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.smallButton, styles.primaryButton, savingBudget && styles.buttonDisabled]}
                onPress={handleSaveBudget}
                disabled={savingBudget}
              >
                {savingBudget ? (
                  <ActivityIndicator color={colors.text.primary} size="small" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, styles.secondaryButton]}
                onPress={handleResetBudget}
                disabled={savingBudget}
              >
                <Text style={[styles.buttonText, { color: colors.warning }]}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Google Sheets Sync */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setEditingWebhook(!editingWebhook)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.glass.background }]}>
              <Icon name="file-excel" size={20} color={colors.income} />
            </View>
            <Text style={styles.menuItemText}>Google Sheets Sync</Text>
          </View>
          {editingWebhook ? (
            <Icon name="chevron-down" size={18} color={colors.text.tertiary} />
          ) : (
            <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
          )}
        </TouchableOpacity>

        {editingWebhook && (
          <View style={styles.expandedContent}>
            <Text style={styles.formLabel}>
              Enter your Google Sheets URL{'\n'}
              <Text style={styles.helperText}>
                Use the spreadsheet URL (for import) or the Apps Script webhook URL (for export)
              </Text>
            </Text>
            <TextInput
              style={styles.input}
              value={webhookUrl}
              onChangeText={setWebhookUrl}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              placeholderTextColor={colors.text.disabled}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.smallButton, styles.primaryButton, saving && styles.buttonDisabled]}
                onPress={handleSaveWebhook}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.text.primary} size="small" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
              {webhookUrl && (
                <TouchableOpacity
                  style={[styles.smallButton, styles.secondaryButton]}
                  onPress={handleClearWebhook}
                  disabled={saving}
                >
                  <Text style={[styles.buttonText, { color: colors.expense }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Manual Sync Button */}
            {webhookUrl && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.syncButton, syncing && styles.buttonDisabled, { flex: syncing ? 1 : undefined }]}
                  onPress={handleManualSync}
                  disabled={syncing}
                >
                  <LinearGradient
                    colors={colors.primaryGradient}
                    style={styles.syncButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {syncing ? (
                      <>
                        <ActivityIndicator color={colors.text.primary} size="small" />
                        <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                          Importing...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Icon name="download" size={18} color={colors.text.primary} />
                        <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                          Import from Google Sheets
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Cancel Button - shown only when syncing */}
                {syncing && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelImport}
                  >
                    <Icon name="times" size={18} color={colors.expense} />
                    <Text style={[styles.buttonText, { marginLeft: 8, color: colors.expense }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {/* Info Box with organized information */}
            <View style={styles.infoBox}>
              {/* Primary info - Auto-sync message */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Icon name="sync-alt" size={14} color={colors.primary} />
                </View>
                <Text style={styles.infoTextPrimary}>
                  Changes automatically sync between app and sheet
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.infoDivider} />

              {/* Secondary info - Required columns */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Icon name="table" size={14} color={colors.text.tertiary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Required columns:</Text>
                  <Text style={styles.infoTextSecondary}>
                    Date, Description, Category, In, Out
                  </Text>
                </View>
              </View>

              {/* Help link */}
              <TouchableOpacity
                style={styles.helpLinkButton}
                onPress={handleViewInstructions}
              >
                <Icon name="question-circle" size={12} color={colors.primary} />
                <Text style={styles.helpLinkText}>View setup instructions</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Clear All Data */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleClearAllData}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.glass.background }]}>
              <Icon name="trash-alt" size={20} color={colors.expense} />
            </View>
            <Text style={[styles.menuItemText, { color: colors.expense }]}>Clear All Data</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Manage Subscription */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('SubscriptionManagement')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.glass.background }]}>
              <Icon name="crown" size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuItemText}>Manage Subscription</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleDeleteAccount}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.glass.background }]}>
              <Icon name="user-times" size={20} color={colors.expense} />
            </View>
            <Text style={[styles.menuItemText, { color: colors.expense }]}>Delete Account</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleLogout}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.glass.background }]}>
              <Icon name="sign-out-alt" size={20} color={colors.expense} />
            </View>
            <Text style={[styles.menuItemText, { color: colors.expense }]}>Log out</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* App Version */}
        <TouchableOpacity
          style={styles.versionContainerInline}
          onPress={handleShowVersionInfo}
          activeOpacity={0.7}
        >
          <Text style={styles.versionText}>
            Version {Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0'} (Build {Platform.select({
              ios: Constants.expoConfig?.ios?.buildNumber || Constants.manifest?.ios?.buildNumber || '1',
              android: Constants.expoConfig?.android?.versionCode || Constants.manifest?.android?.versionCode || '1',
              default: '1'
            })})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  updateButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  updateButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: colors.glass.background,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
    ...shadows.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.glass.border,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.glass.background,
    ...shadows.sm,
  },
  profileName: {
    ...typography.h2,
    marginBottom: 5,
  },
  profileEmail: {
    ...typography.caption,
  },
  editForm: {
    width: '100%',
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    ...typography.small,
    marginBottom: 8,
  },
  helperText: {
    ...typography.small,
    color: colors.text.tertiary,
    fontSize: 11,
    fontWeight: '400',
  },
  formInput: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
  },
  formInputDisabled: {
    color: colors.text.disabled,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  formCancelButton: {
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: colors.income,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    ...shadows.md,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: colors.glass.background,
    marginTop: 10,
    paddingVertical: 10,
    ...shadows.md,
  },
  menuSectionTitle: {
    ...typography.small,
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    ...shadows.sm,
  },
  menuItemText: {
    ...typography.body,
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: colors.backgroundLight,
  },
  input: {
    backgroundColor: colors.glass.background,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    ...typography.caption,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    minHeight: 60,
    marginTop: 10,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 5,
  },
  budgetInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  smallButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Info Box Styles - Organized information display
  infoBox: {
    backgroundColor: colors.glass.background,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTextPrimary: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 4,
  },
  infoLabel: {
    color: colors.text.tertiary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoTextSecondary: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.glass.borderLight,
    marginVertical: 12,
  },
  helpLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  helpLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  syncButton: {
    borderRadius: 25, // Pill shape
    overflow: 'hidden',
    ...shadows.md,
  },
  syncButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25, // Pill shape
  },
  cancelButton: {
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.expense,
    borderRadius: 25, // Pill shape
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  // Collab Code Section Styles
  collabCodeSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  collabCodeTitle: {
    ...typography.h4,
    marginBottom: 12,
    color: colors.text.primary,
  },
  collabCodeCard: {
    backgroundColor: colors.glass.background,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.md,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  keyIcon: {
    marginRight: 12,
  },
  collabCodeText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  collabCodeDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  collabCodeActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  collabCodeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 48,
  },
  copyButton: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  shareButton: {
    backgroundColor: colors.income,
    ...shadows.sm,
  },
  collabCodeButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  collabCodeError: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorText: {
    color: colors.text.secondary,
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    ...shadows.sm,
  },
  retryButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  // Version Display Styles
  versionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingBottom: 24,
    backgroundColor: colors.background,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  versionContainerInline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.glass.background,
  },
  versionText: {
    fontSize: 11,
    color: colors.text.tertiary,
    opacity: 0.5,
    letterSpacing: 0.3,
  },
});

export default SettingsScreen;
