import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { loadProfile, saveProfile } from '../storage/storage';
import { PersonalInfo } from '../types';
import { colors } from '../utils/theme';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

export default function PersonalInfoScreen() {
  const [info, setInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    preferredName: '',
    dateOfBirth: '',
    age: '',
    bloodType: '',
    height: '',
    weight: '',
    photoUri: '',
  });

  useFocusEffect(
    useCallback(() => {
      loadProfile().then((p) => setInfo(p.personal));
    }, []),
  );

  function update(key: keyof PersonalInfo, value: string) {
    setInfo((prev) => ({ ...prev, [key]: value }));
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled) {
      update('photoUri', result.assets[0].uri);
    }
  }

  async function handleSave() {
    const profile = await loadProfile();
    await saveProfile({ ...profile, personal: info });
    Alert.alert('Saved', 'Personal info updated.');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Photo */}
        <TouchableOpacity style={styles.photoSection} onPress={pickPhoto}>
          {info.photoUri ? (
            <Image source={{ uri: info.photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
            </View>
          )}
          <Text style={styles.photoLabel}>
            {info.photoUri ? 'Change Photo' : 'Add Photo (optional)'}
          </Text>
          <Text style={styles.photoHint}>Helps first responders identify you</Text>
        </TouchableOpacity>

        <Field label="First Name *" value={info.firstName} onChangeText={(v) => update('firstName', v)} placeholder="e.g. Alex" />
        <Field label="Last Name *" value={info.lastName} onChangeText={(v) => update('lastName', v)} placeholder="e.g. Johnson" />
        <Field
          label="Preferred Name / Call Me"
          value={info.preferredName}
          onChangeText={(v) => update('preferredName', v)}
          placeholder="What should responders call you?"
        />
        <Field
          label="Date of Birth"
          value={info.dateOfBirth}
          onChangeText={(v) => update('dateOfBirth', v)}
          placeholder="MM/DD/YYYY"
          keyboardType="numeric"
        />
        <Field
          label="Age"
          value={info.age}
          onChangeText={(v) => update('age', v)}
          placeholder="e.g. 24"
          keyboardType="numeric"
        />

        {/* Blood Type Picker */}
        <Text style={styles.label}>Blood Type</Text>
        <View style={styles.bloodTypeRow}>
          {BLOOD_TYPES.map((bt) => (
            <TouchableOpacity
              key={bt}
              style={[styles.bloodChip, info.bloodType === bt && styles.bloodChipSelected]}
              onPress={() => update('bloodType', bt)}
            >
              <Text
                style={[
                  styles.bloodChipText,
                  info.bloodType === bt && styles.bloodChipTextSelected,
                ]}
              >
                {bt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field
          label="Height"
          value={info.height}
          onChangeText={(v) => update('height', v)}
          placeholder={'e.g. 5\'8" or 172 cm'}
        />
        <Field
          label="Weight"
          value={info.weight}
          onChangeText={(v) => update('weight', v)}
          placeholder="e.g. 150 lbs or 68 kg"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Personal Info</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, multiline && fieldStyles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        autoCorrect={false}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 10, letterSpacing: 0.5 },
  photoSection: {
    alignItems: 'center',
    marginBottom: 28,
    paddingVertical: 8,
  },
  photo: { width: 96, height: 96, borderRadius: 48, marginBottom: 10 },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoLabel: { color: colors.red, fontSize: 15, fontWeight: '600' },
  photoHint: { color: colors.textTertiary, fontSize: 12, marginTop: 4 },
  bloodTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  bloodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bloodChipSelected: {
    backgroundColor: colors.redDim,
    borderColor: colors.red,
  },
  bloodChipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  bloodChipTextSelected: { color: colors.red },
  saveBtn: {
    backgroundColor: colors.red,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
