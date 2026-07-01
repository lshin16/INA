import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { loadProfile, saveProfile } from '../storage/storage';
import { FirstResponderNotes } from '../types';
import { colors } from '../utils/theme';

const EXAMPLES = {
  communicationNeeds: 'e.g. Non-verbal. Uses AAC device or picture cards. Responds best to simple, direct instructions. Do not interpret silence as understanding.',
  triggers: 'e.g. Loud noises, being touched unexpectedly, bright flashing lights, crowds of people.',
  calmingStrategies: 'e.g. Speak calmly and slowly. Allow space. Offer noise-canceling headphones if available. Do not restrain unless immediate danger.',
  doList: 'e.g. Stay calm and use a quiet voice\nGive clear, one-step instructions\nAllow extra time to respond\nKeep bystanders away',
  dontList: 'e.g. Do not shout or raise your voice\nDo not touch without warning\nDo not interpret non-responsiveness as defiance\nDo not use physical restraint',
  additionalNotes: 'e.g. May remove clothing when distressed. Has a service animal named Max. Parents are always reachable at numbers listed above.',
};

export default function FirstResponderNotesScreen() {
  const [notes, setNotes] = useState<FirstResponderNotes>({
    communicationNeeds: '',
    triggers: '',
    calmingStrategies: '',
    doList: '',
    dontList: '',
    additionalNotes: '',
  });

  useFocusEffect(
    useCallback(() => {
      loadProfile().then((p) => setNotes(p.firstResponderNotes));
    }, []),
  );

  function update(key: keyof FirstResponderNotes, value: string) {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const profile = await loadProfile();
    await saveProfile({ ...profile, firstResponderNotes: notes });
    Alert.alert('Saved', 'First responder notes updated.');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            These notes help first responders understand how to safely interact with you. Be as
            specific as possible.
          </Text>
        </View>

        <NoteField
          label="Communication Needs"
          icon="chatbubble-outline"
          value={notes.communicationNeeds}
          onChangeText={(v) => update('communicationNeeds', v)}
          placeholder={EXAMPLES.communicationNeeds}
        />

        <NoteField
          label="Triggers / What May Cause Distress"
          icon="alert-circle-outline"
          value={notes.triggers}
          onChangeText={(v) => update('triggers', v)}
          placeholder={EXAMPLES.triggers}
        />

        <NoteField
          label="Calming Strategies"
          icon="heart-outline"
          value={notes.calmingStrategies}
          onChangeText={(v) => update('calmingStrategies', v)}
          placeholder={EXAMPLES.calmingStrategies}
        />

        <NoteField
          label="DO — Helpful Approaches"
          icon="checkmark-circle-outline"
          iconColor={colors.green}
          value={notes.doList}
          onChangeText={(v) => update('doList', v)}
          placeholder={EXAMPLES.doList}
          hint="One item per line"
        />

        <NoteField
          label="DO NOT — Things to Avoid"
          icon="close-circle-outline"
          iconColor={colors.red}
          value={notes.dontList}
          onChangeText={(v) => update('dontList', v)}
          placeholder={EXAMPLES.dontList}
          hint="One item per line"
        />

        <NoteField
          label="Additional Notes"
          icon="document-text-outline"
          value={notes.additionalNotes}
          onChangeText={(v) => update('additionalNotes', v)}
          placeholder={EXAMPLES.additionalNotes}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Notes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function NoteField({
  label,
  icon,
  iconColor = colors.red,
  value,
  onChangeText,
  placeholder,
  hint,
}: {
  label: string;
  icon: string;
  iconColor?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  hint?: string;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <View style={fieldStyles.labelRow}>
        <Text style={[fieldStyles.icon, { color: iconColor }]}>●</Text>
        <Text style={fieldStyles.label}>{label}</Text>
      </View>
      {hint && <Text style={fieldStyles.hint}>{hint}</Text>}
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  icon: { fontSize: 10 },
  label: { color: colors.text, fontSize: 15, fontWeight: '700' },
  hint: { color: colors.textTertiary, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    lineHeight: 22,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  infoBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: colors.red,
  },
  infoText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  saveBtn: {
    backgroundColor: colors.red,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
