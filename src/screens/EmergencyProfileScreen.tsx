import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { loadProfile } from '../storage/storage';
import { EmergencyProfile, RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EmergencyProfile'>;

export default function EmergencyProfileScreen() {
  const navigation = useNavigation<Nav>();
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfile().then(setProfile);
      return () => { Speech.stop(); };
    }, []),
  );

  function buildReadScript(p: EmergencyProfile): string {
    const lines: string[] = [];
    const name =
      p.personal.preferredName ||
      [p.personal.firstName, p.personal.lastName].filter(Boolean).join(' ');

    lines.push(`Emergency information for ${name || 'this person'}.`);

    const critical = p.allergies.filter((a) => a.severity === 'Life-threatening');
    if (critical.length) {
      lines.push(
        `CRITICAL: Life-threatening allergies: ${critical.map((a) => `${a.allergen}, reaction: ${a.reaction}`).join('. ')}.`,
      );
    }

    if (p.medications.length) {
      lines.push(`Medications: ${p.medications.map((m) => `${m.name} ${m.dosage} ${m.frequency}`).join('. ')}.`);
    }

    if (p.diagnoses.length) {
      lines.push(`Conditions: ${p.diagnoses.map((d) => d.name).join(', ')}.`);
    }

    if (p.firstResponderNotes.communicationNeeds) {
      lines.push(`Communication: ${p.firstResponderNotes.communicationNeeds}.`);
    }

    if (p.firstResponderNotes.calmingStrategies) {
      lines.push(`To help calm this person: ${p.firstResponderNotes.calmingStrategies}.`);
    }

    const primary = p.emergencyContacts.find((c) => c.isPrimary) ?? p.emergencyContacts[0];
    if (primary) {
      lines.push(`Emergency contact: ${primary.name}, ${primary.relationship}, phone: ${primary.phone}.`);
    }

    return lines.join(' ');
  }

  async function toggleReadAloud() {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    if (!profile) return;
    setSpeaking(true);
    Speech.speak(buildReadScript(profile), {
      rate: 0.85,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  if (!profile) return null;

  const p = profile;
  const name =
    p.personal.preferredName ||
    [p.personal.firstName, p.personal.lastName].filter(Boolean).join(' ') ||
    'Unknown';

  const criticalAllergies = p.allergies.filter((a) => a.severity === 'Life-threatening');
  const otherAllergies = p.allergies.filter((a) => a.severity !== 'Life-threatening');
  const primaryContact = p.emergencyContacts.find((c) => c.isPrimary) ?? p.emergencyContacts[0];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Read-aloud bar */}
      <TouchableOpacity
        style={[styles.readBar, speaking && styles.readBarActive]}
        onPress={toggleReadAloud}
        accessibilityRole="button"
        accessibilityLabel={speaking ? 'Stop reading aloud' : 'Read all aloud'}
      >
        <Ionicons
          name={speaking ? 'stop-circle' : 'volume-high'}
          size={20}
          color={speaking ? colors.redLight : colors.amberLight}
        />
        <Text style={[styles.readBarText, speaking && { color: colors.redLight }]}>
          {speaking ? 'Stop Reading' : 'Read Aloud for Responder'}
        </Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Identity header */}
        <View style={styles.idRow}>
          <View>
            <Text style={styles.nameText}>{name}</Text>
            {p.personal.dateOfBirth ? (
              <Text style={styles.idDetail}>DOB: {p.personal.dateOfBirth}</Text>
            ) : null}
            {p.personal.bloodType ? (
              <Text style={styles.idDetail}>Blood Type: {p.personal.bloodType}</Text>
            ) : null}
            {p.personal.age ? (
              <Text style={styles.idDetail}>Age: {p.personal.age}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.summaryBtn}
            onPress={() => navigation.navigate('ResponderSummary', { session: null })}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.amberLight} />
            <Text style={styles.summaryBtnText}>Full Card</Text>
          </TouchableOpacity>
        </View>

        {/* ── RED TIER — Life-safety ─────────────────────────── */}
        <TierHeader color={colors.red} label="⚠️  LIFE-SAFETY" />

        {criticalAllergies.length > 0 ? (
          criticalAllergies.map((a) => (
            <View key={a.id} style={[styles.card, styles.cardRed]}>
              <Text style={styles.cardRedTitle}>LIFE-THREATENING ALLERGY</Text>
              <Text style={styles.cardRedValue}>{a.allergen}</Text>
              {a.reaction ? <Text style={styles.cardDetail}>Reaction: {a.reaction}</Text> : null}
            </View>
          ))
        ) : (
          <EmptyRow label="No life-threatening allergies recorded" tier="red" />
        )}

        {p.firstResponderNotes.dontList ? (
          <View style={[styles.card, styles.cardRed]}>
            <Text style={styles.cardRedTitle}>DO NOT</Text>
            {p.firstResponderNotes.dontList
              .split('\n')
              .filter(Boolean)
              .map((item, i) => (
                <Text key={i} style={styles.cardRedValue}>• {item.replace(/^•\s*/, '')}</Text>
              ))}
          </View>
        ) : null}

        {/* ── AMBER TIER — Medical ───────────────────────────── */}
        <TierHeader color={colors.amber} label="💊  MEDICAL" />

        {otherAllergies.length > 0 && (
          <View style={[styles.card, styles.cardAmber]}>
            <Text style={styles.cardAmberTitle}>Allergies</Text>
            {otherAllergies.map((a) => (
              <Text key={a.id} style={styles.cardValue}>
                {a.allergen}
                {a.reaction ? ` — ${a.reaction}` : ''}{' '}
                <Text style={styles.severityTag}>({a.severity})</Text>
              </Text>
            ))}
          </View>
        )}

        {p.medications.length > 0 ? (
          <View style={[styles.card, styles.cardAmber]}>
            <Text style={styles.cardAmberTitle}>Medications</Text>
            {p.medications.map((m) => (
              <Text key={m.id} style={styles.cardValue}>
                {m.name}{m.dosage ? ` ${m.dosage}` : ''}{m.frequency ? ` · ${m.frequency}` : ''}
              </Text>
            ))}
          </View>
        ) : (
          <EmptyRow label="No medications recorded" tier="amber" />
        )}

        {p.diagnoses.length > 0 ? (
          <View style={[styles.card, styles.cardAmber]}>
            <Text style={styles.cardAmberTitle}>Conditions / Diagnoses</Text>
            {p.diagnoses.map((d) => (
              <View key={d.id}>
                <Text style={styles.cardValue}>{d.name}</Text>
                {d.notes ? <Text style={styles.cardDetail}>{d.notes}</Text> : null}
              </View>
            ))}
          </View>
        ) : (
          <EmptyRow label="No diagnoses recorded" tier="amber" />
        )}

        {/* ── GREEN TIER — Communication & Contacts ─────────── */}
        <TierHeader color={colors.green} label="🗣️  COMMUNICATION" />

        {p.firstResponderNotes.communicationNeeds ? (
          <View style={[styles.card, styles.cardGreen]}>
            <Text style={styles.cardGreenTitle}>How to Communicate</Text>
            <Text style={styles.cardValue}>{p.firstResponderNotes.communicationNeeds}</Text>
          </View>
        ) : (
          <EmptyRow label="No communication notes recorded" tier="green" />
        )}

        {p.firstResponderNotes.triggers ? (
          <View style={[styles.card, styles.cardGreen]}>
            <Text style={styles.cardGreenTitle}>Triggers / Avoid</Text>
            <Text style={styles.cardValue}>{p.firstResponderNotes.triggers}</Text>
          </View>
        ) : null}

        {p.firstResponderNotes.calmingStrategies ? (
          <View style={[styles.card, styles.cardGreen]}>
            <Text style={styles.cardGreenTitle}>Calming Strategies</Text>
            <Text style={styles.cardValue}>{p.firstResponderNotes.calmingStrategies}</Text>
          </View>
        ) : null}

        {p.firstResponderNotes.doList ? (
          <View style={[styles.card, styles.cardGreen]}>
            <Text style={styles.cardGreenTitle}>Helpful Approaches (DO)</Text>
            {p.firstResponderNotes.doList
              .split('\n')
              .filter(Boolean)
              .map((item, i) => (
                <Text key={i} style={styles.cardValue}>✓ {item.replace(/^[✓•]\s*/, '')}</Text>
              ))}
          </View>
        ) : null}

        {/* Emergency contacts */}
        {p.emergencyContacts.length > 0 ? (
          <View style={[styles.card, styles.cardGreen]}>
            <Text style={styles.cardGreenTitle}>Emergency Contacts</Text>
            {p.emergencyContacts.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${c.phone}`)}
                accessibilityRole="button"
                accessibilityLabel={`Call ${c.name}, ${c.relationship}, ${c.phone}`}
              >
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {c.name}{c.isPrimary ? ' ★' : ''}
                  </Text>
                  <Text style={styles.contactDetail}>{c.relationship} · {c.phone}</Text>
                </View>
                <View style={styles.callChip}>
                  <Ionicons name="call" size={16} color={colors.greenLight} />
                  <Text style={styles.callChipText}>Call</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <EmptyRow label="No emergency contacts recorded" tier="green" />
        )}

        {p.firstResponderNotes.additionalNotes ? (
          <View style={[styles.card, { borderLeftColor: colors.border, borderLeftWidth: 3, backgroundColor: colors.surface }]}>
            <Text style={[styles.cardGreenTitle, { color: colors.textSecondary }]}>Additional Notes</Text>
            <Text style={styles.cardValue}>{p.firstResponderNotes.additionalNotes}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function TierHeader({ color, label }: { color: string; label: string }) {
  return (
    <View style={[tierStyles.wrap, { borderBottomColor: color }]}>
      <Text style={[tierStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

function EmptyRow({ label, tier }: { label: string; tier: 'red' | 'amber' | 'green' }) {
  const color = tier === 'red' ? colors.redLight : tier === 'amber' ? colors.amberLight : colors.greenLight;
  return (
    <Text style={[tierStyles.empty, { color }]}>{label} — ask caregiver</Text>
  );
}

const tierStyles = StyleSheet.create({
  wrap: { borderBottomWidth: 2, marginBottom: 12, marginTop: 20, paddingBottom: 6 },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  empty: { fontSize: 13, fontStyle: 'italic', marginBottom: 10, paddingLeft: 4 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  readBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.amberDim,
    borderBottomWidth: 1,
    borderColor: colors.amber,
  },
  readBarActive: { backgroundColor: colors.redDim, borderColor: colors.red },
  readBarText: { color: colors.amberLight, fontSize: 15, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 48 },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  nameText: { fontSize: 26, fontWeight: '800', color: colors.text },
  idDetail: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  summaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.amberDim,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  summaryBtnText: { color: colors.amberLight, fontSize: 13, fontWeight: '700' },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  cardRed: { backgroundColor: colors.redDim, borderLeftColor: colors.red },
  cardAmber: { backgroundColor: colors.amberDim, borderLeftColor: colors.amber },
  cardGreen: { backgroundColor: colors.greenDim, borderLeftColor: colors.green },
  cardRedTitle: { color: colors.redLight, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  cardAmberTitle: { color: colors.amberLight, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  cardGreenTitle: { color: colors.greenLight, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  cardRedValue: { color: '#FFB3AB', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  cardValue: { color: colors.text, fontSize: 15, marginBottom: 4, lineHeight: 22 },
  cardDetail: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  severityTag: { color: colors.textTertiary, fontSize: 12 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  contactInfo: { flex: 1 },
  contactName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  contactDetail: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  callChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.greenDim,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.green,
  },
  callChipText: { color: colors.greenLight, fontSize: 13, fontWeight: '700' },
});
