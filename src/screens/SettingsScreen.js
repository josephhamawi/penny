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
import { formatCurrency } from '../utils/formatNumber';

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
        text2: 'Please enter a valid webhook URL',
        position: 'bottom',
      });
      return;
    }

    setSaving(true);
    try {
      await saveWebhookUrl(webhookUrl.trim());
      setEditingWebhook(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Google Sheets sync configured successfully',
        position: 'bottom',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save webhook URL',
        position: 'bottom',
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
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingName ? 'Edit Profile' : 'Profile'}</Text>
        {!editingName && (
          <TouchableOpacity style={styles.editButton} onPress={() => setEditingName(true)}>
            <Icon name="pen" size={16} color="#1976D2" />
          </TouchableOpacity>
        )}
        {editingName && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleSaveProfile}
            disabled={updatingProfile}
          >
            {updatingProfile ? (
              <ActivityIndicator color="#1976D2" size="small" />
            ) : (
              <Text style={styles.updateButtonText}>Update</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

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
              <Icon name="user" size={40} color="#1976D2" />
            </View>
          )}
          {editingName && (
            <View style={styles.cameraIcon}>
              <Icon name="camera" size={14} color="#FFF" />
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
                  <ActivityIndicator color="#fff" size="small" />
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
            <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="wallet" size={20} color="#1976D2" />
            </View>
            <Text style={styles.menuItemText}>Monthly Budget</Text>
          </View>
          {editingBudget ? (
            <Icon name="chevron-down" size={18} color="#999" />
          ) : (
            <Icon name="chevron-right" size={18} color="#999" />
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
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, styles.secondaryButton]}
                onPress={handleResetBudget}
                disabled={savingBudget}
              >
                <Text style={[styles.buttonText, { color: '#FF9800' }]}>Reset</Text>
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
            <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="file-excel" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.menuItemText}>Google Sheets Sync</Text>
          </View>
          {editingWebhook ? (
            <Icon name="chevron-down" size={18} color="#999" />
          ) : (
            <Icon name="chevron-right" size={18} color="#999" />
          )}
        </TouchableOpacity>

        {editingWebhook && (
          <View style={styles.expandedContent}>
            <TextInput
              style={styles.input}
              value={webhookUrl}
              onChangeText={setWebhookUrl}
              placeholder="https://script.google.com/macros/s/..."
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
                  <ActivityIndicator color="#fff" size="small" />
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
                  <Text style={[styles.buttonText, { color: '#F44336' }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleViewInstructions}
            >
              <Text style={styles.linkText}>View Setup Instructions</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleLogout}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#FFEBEE' }]}>
              <Icon name="sign-out-alt" size={20} color="#F44336" />
            </View>
            <Text style={[styles.menuItemText, { color: '#F44336' }]}>Log out</Text>
          </View>
          <Icon name="chevron-right" size={18} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  header: {
    backgroundColor: '#1976D2',
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
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: '#FFF',
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#999',
  },
  editForm: {
    width: '100%',
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F5F6FA',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 15,
    color: '#333',
  },
  formInputDisabled: {
    color: '#999',
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
    color: '#999',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#00BFA6',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: '#FFF',
    marginTop: 10,
    paddingVertical: 10,
  },
  menuSectionTitle: {
    fontSize: 13,
    color: '#999',
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
    borderBottomColor: '#F5F5F5',
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
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FAFAFA',
  },
  input: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 60,
    marginTop: 10,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 15,
    marginTop: 10,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 5,
  },
  budgetInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
  },
  primaryButton: {
    backgroundColor: '#1976D2',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 10,
  },
  linkText: {
    color: '#1976D2',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default SettingsScreen;
