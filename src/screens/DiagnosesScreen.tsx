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
import { Diagnosis } from '../types';
import { colors, generateId } from '../utils/theme';

const SUGGESTIONS = [
  'Autism Spectrum Disorder (ASD)',
  'ADHD',
  'Epilepsy / Seizure Disorder',
  'Type 1 Diabetes',
  'Type 2 Diabetes',
  'Asthma',
  'Cerebral Palsy',
  'Down Syndrome',
  'Bipolar Disorder',
  'Schizophrenia',
  'PTSD',
  'Anxiety Disorder',
  'Depression',
  'Dementia / Alzheimer\'s',
  'Heart Condition',
];

export default function DiagnosesScreen() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Diagnosis | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadProfile().then((p) => setDiagnoses(p.diagnoses));
    }, []),
  );

  async function persist(updated: Diagnosis[]) {
    const profile = await loadProfile();
    await saveProfile({ ...profile, diagnoses: updated });
    setDiagnoses(updated);
  }

  function openAdd() {
    setEditing(null);
    setName('');
    setNotes('');
    setModalVisible(true);
  }

  function openEdit(d: Diagnosis) {
    setEditing(d);
    setName(d.name);
    setNotes(d.notes);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter the diagnosis name.');
      return;
    }
    let updated: Diagnosis[];
    if (editing) {
      updated = diagnoses.map((d) =>
        d.id === editing.id ? { ...d, name: name.trim(), notes: notes.trim() } : d,
      );
    } else {
      updated = [...diagnoses, { id: generateId(), name: name.trim(), notes: notes.trim() }];
    }
    await persist(updated);
    setModalVisible(false);
  }

  async function handleDelete(id: string) {
    Alert.alert('Remove Diagnosis', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await persist(diagnoses.filter((d) => d.id !== id));
          setModalVisible(false);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={diagnoses}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="medical-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No diagnoses added yet</Text>
            <Text style={styles.emptyHint}>Add conditions like ASD, epilepsy, diabetes, etc.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => openEdit(item)}>
            <View style={styles.itemIcon}>
              <Ionicons name="medical" size={18} color={colors.red} />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.notes ? <Text style={styles.itemNotes} numberOfLines={2}>{item.notes}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Ionicons name="add-circle-outline" size={20} color={colors.red} />
            <Text style={styles.addBtnText}>Add Diagnosis</Text>
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
              <Text style={styles.modalTitle}>{editing ? 'Edit Diagnosis' : 'Add Diagnosis'}</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.done}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.fieldLabel}>Diagnosis / Condition *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Autism Spectrum Disorder"
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />

              {/* Suggestions */}
              {!editing && (
                <>
                  <Text style={styles.suggestLabel}>Common diagnoses (tap to fill):</Text>
                  <View style={styles.suggestions}>
                    {SUGGESTIONS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={styles.suggestion}
                        onPress={() => setName(s)}
                      >
                        <Text style={styles.suggestionText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Non-verbal, may not respond to name, can appear unresponsive"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
              />

              {editing && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(editing.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.red} />
                  <Text style={styles.deleteBtnText}>Remove This Diagnosis</Text>
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
    backgroundColor: colors.redDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: { flex: 1 },
  itemName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  itemNotes: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
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
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  suggestLabel: { color: colors.textTertiary, fontSize: 12, marginBottom: 8 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  suggestion: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionText: { color: colors.textSecondary, fontSize: 13 },
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
