import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadProfile, saveProfile } from '../storage/storage';
import { Medication } from '../types';
import { colors, generateId } from '../utils/theme';

export default function MedicationsScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadProfile().then((p) => setMedications(p.medications));
    }, []),
  );

  async function persist(updated: Medication[]) {
    const profile = await loadProfile();
    await saveProfile({ ...profile, medications: updated });
    setMedications(updated);
  }

  function openAdd() {
    setEditing(null);
    setName('');
    setDosage('');
    setFrequency('');
    setModalVisible(true);
  }

  function openEdit(m: Medication) {
    setEditing(m);
    setName(m.name);
    setDosage(m.dosage);
    setFrequency(m.frequency);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter the medication name.');
      return;
    }
    let updated: Medication[];
    if (editing) {
      updated = medications.map((m) =>
        m.id === editing.id
          ? { ...m, name: name.trim(), dosage: dosage.trim(), frequency: frequency.trim() }
          : m,
      );
    } else {
      updated = [
        ...medications,
        { id: generateId(), name: name.trim(), dosage: dosage.trim(), frequency: frequency.trim() },
      ];
    }
    await persist(updated);
    setModalVisible(false);
  }

  async function handleDelete(id: string) {
    Alert.alert('Remove Medication', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await persist(medications.filter((m) => m.id !== id));
          setModalVisible(false);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={medications}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="flask-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No medications added</Text>
            <Text style={styles.emptyHint}>Add any medications first responders should know about</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => openEdit(item)}>
            <View style={styles.itemIcon}>
              <Ionicons name="flask" size={18} color="#5E5CE6" />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetail}>
                {[item.dosage, item.frequency].filter(Boolean).join(' — ') || 'No dosage info'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Ionicons name="add-circle-outline" size={20} color={colors.red} />
            <Text style={styles.addBtnText}>Add Medication</Text>
          </TouchableOpacity>
        }
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editing ? 'Edit Medication' : 'Add Medication'}</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.done}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.fieldLabel}>Medication Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Levetiracetam"
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />

              <Text style={styles.fieldLabel}>Dosage</Text>
              <TextInput
                style={styles.input}
                value={dosage}
                onChangeText={setDosage}
                placeholder="e.g. 500mg"
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={styles.fieldLabel}>Frequency</Text>
              <TextInput
                style={styles.input}
                value={frequency}
                onChangeText={setFrequency}
                placeholder="e.g. Twice daily, morning and evening"
                placeholderTextColor={colors.textTertiary}
              />

              {editing && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(editing.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.red} />
                  <Text style={styles.deleteBtnText}>Remove This Medication</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { color: colors.textSecondary, fontSize: 17, fontWeight: '600' },
  emptyHint: { color: colors.textTertiary, fontSize: 14, textAlign: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: { flex: 1 },
  itemName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  itemDetail: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addBtnText: { color: colors.red, fontSize: 16, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  cancel: { color: colors.textSecondary, fontSize: 16 },
  done: { color: colors.red, fontSize: 16, fontWeight: '700' },
  modalContent: { padding: 20 },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.red,
  },
  deleteBtnText: { color: colors.red, fontSize: 15, fontWeight: '600' },
});
