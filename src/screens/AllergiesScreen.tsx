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
import { Allergy, AllergySeverity } from '../types';
import { colors, generateId } from '../utils/theme';

const SEVERITIES: AllergySeverity[] = ['Mild', 'Moderate', 'Severe', 'Life-threatening'];

const severityColor: Record<AllergySeverity, string> = {
  Mild: colors.green,
  Moderate: colors.amber,
  Severe: '#FF6B35',
  'Life-threatening': colors.red,
};

export default function AllergiesScreen() {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Allergy | null>(null);
  const [allergen, setAllergen] = useState('');
  const [reaction, setReaction] = useState('');
  const [severity, setSeverity] = useState<AllergySeverity>('Moderate');

  useFocusEffect(
    useCallback(() => {
      loadProfile().then((p) => setAllergies(p.allergies));
    }, []),
  );

  async function persist(updated: Allergy[]) {
    const profile = await loadProfile();
    await saveProfile({ ...profile, allergies: updated });
    setAllergies(updated);
  }

  function openAdd() {
    setEditing(null);
    setAllergen('');
    setReaction('');
    setSeverity('Moderate');
    setModalVisible(true);
  }

  function openEdit(a: Allergy) {
    setEditing(a);
    setAllergen(a.allergen);
    setReaction(a.reaction);
    setSeverity(a.severity);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!allergen.trim()) {
      Alert.alert('Required', 'Please enter the allergen.');
      return;
    }
    let updated: Allergy[];
    if (editing) {
      updated = allergies.map((a) =>
        a.id === editing.id
          ? { ...a, allergen: allergen.trim(), reaction: reaction.trim(), severity }
          : a,
      );
    } else {
      updated = [
        ...allergies,
        { id: generateId(), allergen: allergen.trim(), reaction: reaction.trim(), severity },
      ];
    }
    await persist(updated);
    setModalVisible(false);
  }

  async function handleDelete(id: string) {
    Alert.alert('Remove Allergy', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await persist(allergies.filter((a) => a.id !== id));
          setModalVisible(false);
        },
      },
    ]);
  }

  // Sort life-threatening to top
  const sorted = [...allergies].sort((a, b) => {
    const order: Record<AllergySeverity, number> = {
      'Life-threatening': 0, Severe: 1, Moderate: 2, Mild: 3,
    };
    return order[a.severity] - order[b.severity];
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={sorted}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="warning-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No allergies added</Text>
            <Text style={styles.emptyHint}>Add food, medication, or environmental allergies</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => openEdit(item)}>
            <View style={[styles.severityBar, { backgroundColor: severityColor[item.severity] }]} />
            <View style={styles.itemContent}>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>{item.allergen}</Text>
                <View style={[styles.badge, { backgroundColor: severityColor[item.severity] + '33' }]}>
                  <Text style={[styles.badgeText, { color: severityColor[item.severity] }]}>
                    {item.severity}
                  </Text>
                </View>
              </View>
              {item.reaction ? (
                <Text style={styles.itemReaction}>{item.reaction}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Ionicons name="add-circle-outline" size={20} color={colors.red} />
            <Text style={styles.addBtnText}>Add Allergy</Text>
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
              <Text style={styles.modalTitle}>{editing ? 'Edit Allergy' : 'Add Allergy'}</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.done}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.fieldLabel}>Allergen *</Text>
              <TextInput
                style={styles.input}
                value={allergen}
                onChangeText={setAllergen}
                placeholder="e.g. Penicillin, Peanuts, Latex"
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />

              <Text style={styles.fieldLabel}>Reaction / Symptoms</Text>
              <TextInput
                style={styles.input}
                value={reaction}
                onChangeText={setReaction}
                placeholder="e.g. Anaphylaxis, hives, difficulty breathing"
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={styles.fieldLabel}>Severity</Text>
              <View style={styles.severityRow}>
                {SEVERITIES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.severityChip,
                      severity === s && { borderColor: severityColor[s], backgroundColor: severityColor[s] + '22' },
                    ]}
                    onPress={() => setSeverity(s)}
                  >
                    <Text
                      style={[
                        styles.severityChipText,
                        severity === s && { color: severityColor[s], fontWeight: '700' },
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {editing && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(editing.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.red} />
                  <Text style={styles.deleteBtnText}>Remove This Allergy</Text>
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
    overflow: 'hidden',
    marginBottom: 10,
    paddingRight: 14,
    paddingVertical: 14,
  },
  severityBar: { width: 4, alignSelf: 'stretch', marginRight: 12 },
  itemContent: { flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  itemReaction: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
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
  severityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  severityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  severityChipText: { color: colors.textSecondary, fontSize: 14 },
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
