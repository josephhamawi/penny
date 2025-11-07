import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { updateExpense, deleteExpense } from '../services/expenseService';
import { CATEGORIES, getCategoryConfig } from '../config/categories';
import { useAuth } from '../contexts/AuthContext';

const EditExpenseScreen = ({ navigation, route }) => {
  const { expense } = route.params;
  const { user } = useAuth();

  const [date, setDate] = useState(expense.date.toISOString().split('T')[0]);
  const [description, setDescription] = useState(expense.description);
  const [category, setCategory] = useState(expense.category);
  const [inAmount, setInAmount] = useState(expense.inAmount > 0 ? expense.inAmount.toString() : '');
  const [outAmount, setOutAmount] = useState(expense.outAmount > 0 ? expense.outAmount.toString() : '');
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleUpdate = async () => {
    if (!description.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a description',
        position: 'bottom',
      });
      return;
    }

    const inValue = parseFloat(inAmount) || 0;
    const outValue = parseFloat(outAmount) || 0;

    if (inValue === 0 && outValue === 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter an amount for In or Out',
        position: 'bottom',
      });
      return;
    }

    if (inValue < 0 || outValue < 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Amounts cannot be negative',
        position: 'bottom',
      });
      return;
    }

    if (inValue > 0 && outValue > 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter only In or Out, not both',
        position: 'bottom',
      });
      return;
    }

    setLoading(true);
    try {
      await updateExpense(expense.id, {
        date,
        description: description.trim(),
        category,
        inAmount: inValue,
        outAmount: outValue
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Expense updated successfully',
        position: 'bottom',
      });

      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update expense',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteExpense(expense.id);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Expense deleted successfully',
                position: 'bottom',
              });
              setTimeout(() => {
                navigation.goBack();
              }, 500);
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete expense',
                position: 'bottom',
              });
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Expense</Text>
        <TouchableOpacity onPress={handleDelete} disabled={loading}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            editable={!loading}
          />
          <Text style={styles.hint}>Format: YYYY-MM-DD</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g., Grocery shopping"
            multiline
            numberOfLines={2}
            editable={!loading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryModal(true)}
            disabled={loading}
          >
            <View style={styles.categoryContent}>
              <View style={[styles.categoryIconBox, { backgroundColor: getCategoryConfig(category).bgColor }]}>
                <Icon name={getCategoryConfig(category).icon} size={20} color={getCategoryConfig(category).color} />
              </View>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Income (In) - $</Text>
          <TextInput
            style={styles.input}
            value={inAmount}
            onChangeText={setInAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            returnKeyType="done"
            blurOnSubmit={true}
            editable={!loading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Expense (Out) - $</Text>
          <TextInput
            style={styles.input}
            value={outAmount}
            onChangeText={setOutAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            returnKeyType="done"
            blurOnSubmit={true}
            editable={!loading}
          />
        </View>

        <Text style={styles.note}>
          Note: Enter either In or Out amount, not both
        </Text>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Update Expense</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Icon name="times" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CATEGORIES}
              numColumns={3}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const config = getCategoryConfig(item);
                return (
                  <TouchableOpacity
                    style={styles.categoryItem}
                    onPress={() => {
                      setCategory(item);
                      setShowCategoryModal(false);
                    }}
                  >
                    <View style={[styles.categoryItemIcon, { backgroundColor: config.bgColor }]}>
                      <Icon name={config.icon} size={28} color={config.color} />
                    </View>
                    <Text style={styles.categoryItemText} numberOfLines={2}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.categoryGrid}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelText: {
    color: '#2196F3',
    fontSize: 16,
  },
  deleteText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  categorySelector: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  note: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryGrid: {
    padding: 15,
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    margin: 5,
    padding: 10,
    maxWidth: '30%',
  },
  categoryItemIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryItemText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default EditExpenseScreen;
