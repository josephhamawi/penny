import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { CATEGORIES } from '../config/categories';
import { colors, shadows, typography, spacing, borderRadius } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { createPlan, updatePlan, validateNewAllocation } from '../services/planService';
import Toast from 'react-native-toast-message';

const CreatePlanScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { planId } = route.params || {};
  const isEditing = !!planId;

  const [planName, setPlanName] = useState('');
  const [percentageOfIncome, setPercentageOfIncome] = useState(10);
  const [description, setDescription] = useState('');
  const [targetCategory, setTargetCategory] = useState(null);
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)); // 1 year
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Validate allocation in real-time, but only after user interaction
  useEffect(() => {
    if (user && user.uid) {
      validateAllocation();
    }
  }, [percentageOfIncome, user]);

  const validateAllocation = async () => {
    try {
      if (!user || !user.uid) return;
      const result = await validateNewAllocation(user.uid, percentageOfIncome, planId);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
      // Set a default valid state on error to not block user
      setValidationResult({ valid: true, message: '' });
    }
  };

  const handleSave = async () => {
    // Validation
    if (!planName.trim()) {
      Alert.alert('Validation Error', 'Please enter a plan name');
      return;
    }

    if (percentageOfIncome <= 0 || percentageOfIncome > 100) {
      Alert.alert('Validation Error', 'Percentage must be between 1 and 100');
      return;
    }

    if (!validationResult || !validationResult.valid) {
      Alert.alert('Validation Error', validationResult?.message || 'Invalid allocation');
      return;
    }

    if (targetAmount && parseFloat(targetAmount) <= 0) {
      Alert.alert('Validation Error', 'Target amount must be greater than 0');
      return;
    }

    setSaving(true);

    try {
      const planData = {
        planName: planName.trim(),
        percentageOfIncome,
        description: description.trim(),
        targetCategory,
        targetAmount: targetAmount ? parseFloat(targetAmount) : null,
        targetDate: targetAmount ? targetDate : null
      };

      if (isEditing) {
        await updatePlan(user.uid, planId, planData);
        Toast.show({
          type: 'success',
          text1: 'Plan Updated',
          text2: `${planName} has been updated successfully`
        });
      } else {
        await createPlan(planData);
        Toast.show({
          type: 'success',
          text1: 'Plan Created',
          text2: `${planName} is now active and will allocate ${percentageOfIncome}% of your income`
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving plan:', error);
      Alert.alert('Error', error.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const excludeIncomeCategories = CATEGORIES.filter(
    cat => !['Salary/Income', 'Freelance', 'Other Income'].includes(cat)
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Plan' : 'Create New Plan'}</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Plan Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Plan Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Travel Fund, Emergency Savings"
            placeholderTextColor={colors.text.tertiary}
            value={planName}
            onChangeText={setPlanName}
          />
        </View>

        {/* Percentage Allocation */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Allocation Percentage *</Text>
            <Text style={styles.percentageValue}>{percentageOfIncome}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={percentageOfIncome}
            onValueChange={(value) => {
              setPercentageOfIncome(value);
              setHasInteracted(true);
            }}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.glass.backgroundDark}
            thumbTintColor={colors.primary}
          />
          {validationResult && hasInteracted && (
            <View style={[styles.validationBox, validationResult.valid ? styles.validBox : styles.invalidBox]}>
              <Icon
                name={validationResult.valid ? 'check-circle' : 'exclamation-circle'}
                size={16}
                color={validationResult.valid ? colors.success : colors.error}
              />
              <Text style={[styles.validationText, { color: validationResult.valid ? colors.success : colors.error }]}>
                {validationResult.message}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What is this plan for?"
            placeholderTextColor={colors.text.tertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Target Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target Category (Optional)</Text>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryModal(true)}
          >
            <Icon
              name={targetCategory ? 'tag' : 'tags'}
              size={16}
              color={targetCategory ? colors.primary : colors.text.tertiary}
            />
            <Text style={[styles.categorySelectorText, targetCategory && styles.categorySelectorTextActive]}>
              {targetCategory || 'Select a category'}
            </Text>
            {targetCategory && (
              <TouchableOpacity onPress={() => setTargetCategory(null)} style={styles.clearButton}>
                <Icon name="times-circle" size={16} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Optional Goal Settings */}
        <View style={styles.goalSection}>
          <Text style={styles.sectionTitle}>Goal Settings (Optional)</Text>
          <Text style={styles.sectionSubtitle}>Set a target amount and date to track progress</Text>

          {/* Target Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="0"
                placeholderTextColor={colors.text.tertiary}
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Target Date */}
          {targetAmount && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar" size={16} color={colors.primary} />
                <Text style={styles.dateSelectorText}>
                  {targetDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving || (validationResult && !validationResult.valid)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={saving || (validationResult && !validationResult.valid)
              ? [colors.glass.backgroundDark, colors.glass.backgroundDark]
              : [colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="check" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>{isEditing ? 'Update Plan' : 'Create Plan'}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Icon name="times" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={excludeIncomeCategories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    targetCategory === item && styles.categoryItemActive
                  ]}
                  onPress={() => {
                    setTargetCategory(item);
                    setShowCategoryModal(false);
                  }}
                >
                  <Icon
                    name={targetCategory === item ? 'check-circle' : 'circle'}
                    size={20}
                    color={targetCategory === item ? colors.primary : colors.text.tertiary}
                  />
                  <Text style={[styles.categoryItemText, targetCategory === item && styles.categoryItemTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal for iOS */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={styles.datePickerModalOverlay}>
            <View style={styles.datePickerModalContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>Select Target Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={targetDate}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setTargetDate(selectedDate);
                  }
                }}
                style={styles.datePickerIOS}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Date Picker for Android */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={targetDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setTargetDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.md
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    ...typography.h2,
    color: '#FFFFFF',
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40
  },
  inputGroup: {
    marginBottom: spacing.lg
  },
  label: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontWeight: '600'
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  percentageValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700'
  },
  input: {
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  slider: {
    width: '100%',
    height: 40
  },
  validationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  validBox: {
    backgroundColor: `${colors.success}15`,
    borderWidth: 1,
    borderColor: colors.success
  },
  invalidBox: {
    backgroundColor: `${colors.error}15`,
    borderWidth: 1,
    borderColor: colors.error
  },
  validationText: {
    ...typography.caption,
    flex: 1
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm
  },
  categorySelectorText: {
    ...typography.body,
    color: colors.text.tertiary,
    flex: 1
  },
  categorySelectorTextActive: {
    color: colors.text.primary
  },
  clearButton: {
    padding: 4
  },
  goalSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: 4
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.lg
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    borderRadius: borderRadius.md,
    paddingLeft: spacing.md
  },
  currencySymbol: {
    ...typography.h3,
    color: colors.text.secondary,
    marginRight: spacing.sm
  },
  amountInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm
  },
  dateSelectorText: {
    ...typography.body,
    color: colors.text.primary
  },
  saveButton: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm
  },
  saveButtonText: {
    ...typography.button,
    color: '#FFFFFF'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
    paddingBottom: 40
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight
  },
  categoryItemActive: {
    backgroundColor: colors.glass.background
  },
  categoryItemText: {
    ...typography.body,
    color: colors.text.secondary
  },
  categoryItemTextActive: {
    color: colors.text.primary,
    fontWeight: '600'
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  datePickerModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: 40
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  datePickerCancel: {
    ...typography.body,
    color: '#6B7280'
  },
  datePickerTitle: {
    ...typography.h4,
    color: '#111827'
  },
  datePickerDone: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600'
  },
  datePickerIOS: {
    height: 200,
    backgroundColor: '#FFFFFF'
  }
});

export default CreatePlanScreen;
