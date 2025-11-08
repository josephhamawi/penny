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
  Image
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
  saveMonthlyBudget,
  getMonthlyBudget,
  resetMonthlyBudget
} from '../services/budgetService';
import { importFromGoogleSheets } from '../services/googleSheetsService';
import { manualSyncToSheets } from '../services/expenseService';
import { getUserDatabaseId } from '../services/invitationService';
import { formatCurrency } from '../utils/formatNumber';
import { colors, shadows, typography } from '../theme/colors';

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
  const { user, logout, updateUserProfile } = useAuth();

  useEffect(() => {
    loadWebhookUrl();
    loadBudget();
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || null);
    }
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
      // Save the URL first
      await saveWebhookUrl(webhookUrl.trim());

      // Immediately import data from the sheet
      Toast.show({
        type: 'info',
        text1: 'Importing...',
        text2: 'Fetching data from Google Sheets',
        position: 'bottom',
        autoHide: false,
      });

      const count = await importFromGoogleSheets(webhookUrl.trim(), user.uid);

      setEditingWebhook(false);
      Toast.hide();
      Toast.show({
        type: 'success',
        text1: 'Import Successful',
        text2: `Imported ${count} expense${count !== 1 ? 's' : ''} from Google Sheets`,
        position: 'bottom',
      });
    } catch (error) {
      console.error('Google Sheets sync error:', error);
      Toast.hide();
      Toast.show({
        type: 'error',
        text1: 'Sync Error',
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

    setSyncing(true);

    try {
      const databaseId = await getUserDatabaseId(user.uid);
      const url = webhookUrl.trim();

      // Check if it's a Google Sheets document URL (for import)
      const isSheetUrl = url.includes('docs.google.com/spreadsheets');
      const isWebhookUrl = url.includes('script.google.com/macros');

      // Step 1: Import from Google Sheets (if it's a sheet URL)
      if (isSheetUrl) {
        Toast.show({
          type: 'info',
          text1: 'Importing...',
          text2: 'Fetching data from Google Sheets',
          position: 'bottom',
          autoHide: false,
        });

        const count = await importFromGoogleSheets(url, databaseId);

        Toast.hide();
        Toast.show({
          type: 'success',
          text1: 'Import Complete!',
          text2: `Imported ${count} expense${count !== 1 ? 's' : ''}`,
          position: 'bottom',
          visibilityTime: 2000,
        });

        // Wait a moment before exporting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 2: Export to Google Sheets (if it's a webhook URL)
      if (isWebhookUrl) {
        Toast.show({
          type: 'info',
          text1: 'Exporting...',
          text2: 'Pushing all expenses to Google Sheets',
          position: 'bottom',
          autoHide: false,
        });

        await manualSyncToSheets(databaseId);

        Toast.hide();
        Toast.show({
          type: 'success',
          text1: 'Export Complete!',
          text2: 'All expenses synced to Google Sheets',
          position: 'bottom',
        });
      } else if (!isSheetUrl) {
        // Neither format recognized
        Toast.hide();
        Toast.show({
          type: 'error',
          text1: 'Invalid URL',
          text2: 'Please use a Google Sheets or webhook URL',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Manual sync error:', error);
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
                style={styles.cancelButton}
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
                  <Text style={styles.buttonText}>Save & Import</Text>
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
              <TouchableOpacity
                style={[styles.syncButton, syncing && styles.buttonDisabled]}
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
                    <ActivityIndicator color={colors.text.primary} size="small" />
                  ) : (
                    <>
                      <Icon name="sync-alt" size={18} color={colors.text.primary} />
                      <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                        Sync Bidirectionally
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleViewInstructions}
            >
              <Text style={styles.linkText}>
                Required columns: Date, Description, Category, In, Out
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Invitations & Sharing */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Invitations')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.glass.background }]}>
              <Icon name="users" size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuItemText}>Invitations & Sharing</Text>
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
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  cancelButton: {
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  smallButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
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
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 10,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  syncButton: {
    marginTop: 15,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.md,
  },
  syncButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SettingsScreen;
