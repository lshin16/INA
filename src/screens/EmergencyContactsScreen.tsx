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
  Switch,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadProfile, saveProfile } from '../storage/storage';
import { EmergencyContact } from '../types';
import { colors, generateId } from '../utils/theme';

export default function EmergencyContactsScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfile().then((p) => setContacts(p.emergencyContacts));
    }, []),
  );

  async function persist(updated: EmergencyContact[]) {
    const profile = await loadProfile();
    await saveProfile({ ...profile, emergencyContacts: updated });
    setContacts(updated);
  }

  function openAdd() {
    setEditing(null);
    setName('');
    setRelationship('');
    setPhone('');
    setIsPrimary(contacts.length === 0);
    setModalVisible(true);
  }

  function openEdit(c: EmergencyContact) {
    setEditing(c);
    setName(c.name);
    setRelationship(c.relationship);
    setPhone(c.phone);
    setIsPrimary(c.isPrimary);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter the contact name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter a phone number.');
      return;
    }
    let updated: EmergencyContact[];
    if (editing) {
      updated = contacts.map((c) =>
        c.id === editing.id
          ? { ...c, name: name.trim(), relationship: relationship.trim(), phone: phone.trim(), isPrimary }
          : isPrimary ? { ...c, isPrimary: false } : c,
      );
    } else {
      const newContact: EmergencyContact = {
        id: generateId(),
        name: name.trim(),
        relationship: relationship.trim(),
        phone: phone.trim(),
        isPrimary,
      };
      updated = isPrimary
        ? [...contacts.map((c) => ({ ...c, isPrimary: false })), newContact]
        : [...contacts, newContact];
    }
    await persist(updated);
    setModalVisible(false);
  }

  async function handleDelete(id: string) {
    Alert.alert('Remove Contact', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await persist(contacts.filter((c) => c.id !== id));
          setModalVisible(false);
        },
      },
    ]);
  }

  const sorted = [...contacts].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={sorted}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="call-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No contacts added</Text>
            <Text style={styles.emptyHint}>Add family or friends first responders can call</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => openEdit(item)}>
            <View style={[styles.avatar, item.isPrimary && styles.avatarPrimary]}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.itemContent}>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                  </View>
                )}
              </View>
              <Text style={styles.itemDetail}>
                {item.relationship ? `${item.relationship} · ` : ''}{item.phone}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
            >
              <Ionicons name="call" size={18} color={colors.green} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Ionicons name="add-circle-outline" size={20} color={colors.red} />
            <Text style={styles.addBtnText}>Add Emergency Contact</Text>
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
              <Text style={styles.modalTitle}>{editing ? 'Edit Contact' : 'Add Contact'}</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.done}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Jane Smith"
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />

              <Text style={styles.fieldLabel}>Relationship</Text>
              <TextInput
                style={styles.input}
                value={relationship}
                onChangeText={setRelationship}
                placeholder="e.g. Mother, Spouse, Caregiver"
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={styles.fieldLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. (555) 000-1234"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Primary Contact</Text>
                  <Text style={styles.switchHint}>Call this person first</Text>
                </View>
                <Switch
                  value={isPrimary}
                  onValueChange={setIsPrimary}
                  trackColor={{ false: colors.surfaceAlt, true: colors.red }}
                  thumbColor="#fff"
                />
              </View>

              {editing && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(editing.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.red} />
                  <Text style={styles.deleteBtnText}>Remove This Contact</Text>
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarPrimary: { backgroundColor: colors.redDim },
  avatarText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  itemContent: { flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  primaryBadge: {
    backgroundColor: colors.redDim,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  primaryBadgeText: { color: colors.red, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  itemDetail: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.greenDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  switchLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  switchHint: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.red,
  },
  deleteBtnText: { color: colors.red, fontSize: 15, fontWeight: '600' },
});
