import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CATEGORIES } from '../config/categories';
import { colors, shadows, typography } from '../theme/colors';

const CreateGoalScreen = ({ navigation, route }) => {
  const { goal } = route.params || {}; // If editing existing goal
  const isEditing = !!goal;

  const [name, setName] = useState(goal?.name || '');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() || '');
  const [targetDate, setTargetDate] = useState(goal?.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default 30 days from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryRestrictions, setCategoryRestrictions] = useState(goal?.categoryRestrictions || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a goal name');
      return;
    }

    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid target amount');
      return;
    }

    if (targetDate <= new Date()) {
      Alert.alert('Validation Error', 'Target date must be in the future');
      return;
    }

    setSaving(true);

    // TODO: Replace with actual service call when Agent 1 completes Firestore setup
    // For now, just show success message
    setTimeout(() => {
      setSaving(false);
      Alert.alert(
        'Success',
        isEditing ? 'Goal updated successfully!' : 'Goal created successfully! (Using mock data - will integrate with Firestore once Agent 1 completes)',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1000);

    /* READY FOR INTEGRATION:
    try {
      if (isEditing) {
        await updateGoal(goal.id, {
          name: name.trim(),
          targetAmount: amount,
          targetDate: firestore.Timestamp.fromDate(targetDate),
          categoryRestrictions: categoryRestrictions.length > 0 ? categoryRestrictions : null,
        });
        Alert.alert('Success', 'Goal updated successfully!');
      } else {
        await createGoal({
          name: name.trim(),
          targetAmount: amount,
          targetDate: firestore.Timestamp.fromDate(targetDate),
          categoryRestrictions: categoryRestrictions.length > 0 ? categoryRestrictions : null,
        });
        Alert.alert('Success', 'Goal created successfully!');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    } finally {
      setSaving(false);
    }
    */
  };

  const toggleCategory = (category) => {
    if (categoryRestrictions.includes(category)) {
      setCategoryRestrictions(categoryRestrictions.filter(c => c !== category));
    } else {
      setCategoryRestrictions([...categoryRestrictions, category]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Goal' : 'Create Goal'}</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <View style={styles.form}>
        {/* Goal Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Goal Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Save for vacation"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        {/* Target Amount */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Target Amount *</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={[styles.input, { borderWidth: 0, flex: 1 }]}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="1500"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
        </View>

        {/* Target Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Target Date *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar" size={20} color={colors.primary} />
            <Text style={styles.dateText}>
              {targetDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={targetDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setTargetDate(selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        {/* Category Restrictions (Optional) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Track Specific Categories (Optional)</Text>
          <Text style={styles.hint}>
            Select categories to track for this goal. Leave empty to track all expenses.
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  categoryRestrictions.includes(category) && styles.categoryChipSelected,
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    categoryRestrictions.includes(category) && styles.categoryChipTextSelected,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : isEditing ? 'Update Goal' : 'Create Goal'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 25,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    ...typography.caption,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.glass.background,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.glass.border,
    color: colors.text.primary,
    ...shadows.sm,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingHorizontal: 15,
    ...shadows.sm,
  },
  currencySymbol: {
    ...typography.h3,
    marginRight: 5,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.sm,
  },
  dateText: {
    ...typography.body,
    marginLeft: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.caption,
  },
  categoryChipTextSelected: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateGoalScreen;
