import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { loadProfile } from '../storage/storage';
import { EmergencyProfile, OPQRSTSession, RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Route = RouteProp<RootStackParamList, 'ResponderSummary'>;

// Maps raw IDs back to display labels
const SYMPTOM_LABELS: Record<string, string> = {
  pain: 'In Pain', dizzy: 'Dizzy', nausea: 'Sick / Nausea', breathing: "Can't Breathe",
  fell: 'Fell / Injured', scared: 'Scared', confused: 'Confused', other: 'Something Else',
};
const INTAKE_LABELS: Record<string, string> = {
  'just-now': 'Just now', 'hour-ago': 'About 1 hour ago',
  'few-hours': 'A few hours ago', 'not-sure': 'Not sure',
};
const ONSET_LABELS: Record<string, string> = {
  'just-now': 'Just now', 'minutes-ago': 'Minutes ago',
  'this-morning': 'Earlier today', 'while-ago': 'A while ago', 'not-sure': 'Not sure',
};
const QUALITY_LABELS: Record<string, string> = {
  sharp: 'Sharp / Stabbing', dull: 'Dull / Aching', burning: 'Burning',
  pressure: 'Pressure / Squeezing', throbbing: 'Throbbing', cramping: 'Cramping',
};
const PROVOCATION_LABELS: Record<string, string> = {
  'worse-moving': 'Worse moving', 'worse-breathing': 'Worse breathing',
  'worse-pressing': 'Worse when pressed', 'better-still': 'Better lying still',
  'better-moving': 'Better moving', 'no-change': 'No change',
};

function label(map: Record<string, string>, id: string) {
  return map[id] ?? id;
}

function severityFace(n: number): string {
  return ['😄','🙂','😊','😐','😕','😟','😣','😢','😭','😫','🤯'][Math.min(n, 10)];
}

function buildShareText(profile: EmergencyProfile, session: OPQRSTSession | null): string {
  const name = profile.personal.preferredName ||
    [profile.personal.firstName, profile.personal.lastName].filter(Boolean).join(' ') || 'Unknown';

  const lines: string[] = [`=== EMERGENCY INFO — ${name} ===`];

  if (session) {
    lines.push('\n— CURRENT SYMPTOMS (OPQRST) —');
    if (session.symptoms.length) lines.push(`Signs: ${session.symptoms.map((s) => label(SYMPTOM_LABELS, s)).join(', ')}`);
    if (session.bodyRegions.length) lines.push(`Region: ${session.bodyRegions.join(', ')}`);
    if (session.quality) lines.push(`Quality: ${label(QUALITY_LABELS, session.quality)}`);
    if (session.severity !== null) lines.push(`Severity: ${session.severity}/10 ${severityFace(session.severity)}`);
    if (session.onset) lines.push(`Onset: ${label(ONSET_LABELS, session.onset)}`);
    if (session.provocation.length) lines.push(`Provocation: ${session.provocation.map((p) => label(PROVOCATION_LABELS, p)).join(', ')}`);
    if (session.lastOralIntake) lines.push(`Last ate/drank: ${label(INTAKE_LABELS, session.lastOralIntake)}`);
  }

  lines.push('\n— MEDICAL PROFILE (SAMPLE) —');
  const critical = profile.allergies.filter((a) => a.severity === 'Life-threatening');
  if (critical.length) lines.push(`⚠️ LIFE-THREATENING ALLERGIES: ${critical.map((a) => `${a.allergen} (${a.reaction})`).join(', ')}`);
  if (profile.medications.length) lines.push(`Medications: ${profile.medications.map((m) => `${m.name} ${m.dosage}`).join(', ')}`);
  if (profile.diagnoses.length) lines.push(`Conditions: ${profile.diagnoses.map((d) => d.name).join(', ')}`);
  if (profile.personal.bloodType) lines.push(`Blood Type: ${profile.personal.bloodType}`);
  if (profile.personal.dateOfBirth) lines.push(`DOB: ${profile.personal.dateOfBirth}`);
  if (profile.firstResponderNotes.communicationNeeds) lines.push(`Communication: ${profile.firstResponderNotes.communicationNeeds}`);
  const primary = profile.emergencyContacts.find((c) => c.isPrimary) ?? profile.emergencyContacts[0];
  if (primary) lines.push(`Emergency Contact: ${primary.name} (${primary.relationship}) ${primary.phone}`);

  return lines.join('\n');
}

export default function ResponderSummaryScreen() {
  const route = useRoute<Route>();
  const { session } = route.params;
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfile().then(setProfile);
      return () => { Speech.stop(); };
    }, []),
  );

  async function handleShare() {
    if (!profile) return;
    await Share.share({ message: buildShareText(profile, session) });
  }

  function handleReadAloud() {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    if (!profile) return;
    setSpeaking(true);
    Speech.speak(buildShareText(profile, session), {
      rate: 0.8,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  if (!profile) return null;

  const name = profile.personal.preferredName ||
    [profile.personal.firstName, profile.personal.lastName].filter(Boolean).join(' ') || 'Unknown';

  const criticalAllergies = profile.allergies.filter((a) => a.severity === 'Life-threatening');
  const primaryContact = profile.emergencyContacts.find((c) => c.isPrimary) ?? profile.emergencyContacts[0];
  const ts = session?.timestamp ? new Date(session.timestamp).toLocaleTimeString() : null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionBtn, speaking && styles.actionBtnStop]}
          onPress={handleReadAloud}
          accessibilityRole="button"
          accessibilityLabel={speaking ? 'Stop reading' : 'Read aloud'}
        >
          <Ionicons name={speaking ? 'stop-circle' : 'volume-high'} size={20} color="#fff" />
          <Text style={styles.actionBtnText}>{speaking ? 'Stop' : 'Read Aloud'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnShare]}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share emergency card"
        >
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Share Card</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Identity */}
        <View style={styles.idCard}>
          <Text style={styles.idName}>{name}</Text>
          <View style={styles.idRow}>
            {profile.personal.dateOfBirth ? <Chip label={`DOB: ${profile.personal.dateOfBirth}`} /> : null}
            {profile.personal.bloodType ? <Chip label={`Blood: ${profile.personal.bloodType}`} color={colors.red} /> : null}
            {ts ? <Chip label={`Reported: ${ts}`} color={colors.amber} /> : null}
          </View>
        </View>

        {/* ── LIVE OPQRST (top per spec) ─────────────────────────── */}
        {session && (
          <>
            <SectionHeader label="CURRENT SYMPTOMS" color={colors.amber} />

            {session.symptoms.length > 0 && (
              <Row label="Signs / Symptoms" value={session.symptoms.map((s) => label(SYMPTOM_LABELS, s)).join(', ')} />
            )}
            {session.bodyRegions.length > 0 && (
              <Row label="Location" value={session.bodyRegions.join(', ')} urgent />
            )}
            {session.quality && (
              <Row label="Quality" value={label(QUALITY_LABELS, session.quality)} />
            )}
            {session.severity !== null && (
              <Row
                label="Severity"
                value={`${session.severity}/10  ${severityFace(session.severity)}`}
                urgent={session.severity >= 7}
              />
            )}
            {session.onset && (
              <Row label="Onset" value={label(ONSET_LABELS, session.onset)} />
            )}
            {session.provocation.length > 0 && (
              <Row label="Provocation" value={session.provocation.map((p) => label(PROVOCATION_LABELS, p)).join(', ')} />
            )}
            {session.lastOralIntake && (
              <Row label="Last Ate / Drank" value={label(INTAKE_LABELS, session.lastOralIntake)} />
            )}
          </>
        )}

        {/* ── STATIC SAMPLE (below per spec) ───────────────────── */}
        <SectionHeader label="MEDICAL PROFILE" color={colors.red} />

        {criticalAllergies.length > 0 ? (
          criticalAllergies.map((a) => (
            <View key={a.id} style={styles.criticalRow}>
              <Text style={styles.criticalLabel}>⚠️ LIFE-THREATENING ALLERGY</Text>
              <Text style={styles.criticalValue}>{a.allergen}</Text>
              {a.reaction ? <Text style={styles.criticalReaction}>Reaction: {a.reaction}</Text> : null}
            </View>
          ))
        ) : (
          <Row label="Allergies" value="None recorded" />
        )}

        {profile.allergies.filter((a) => a.severity !== 'Life-threatening').length > 0 && (
          <Row
            label="Other Allergies"
            value={profile.allergies
              .filter((a) => a.severity !== 'Life-threatening')
              .map((a) => `${a.allergen} (${a.severity})`)
              .join(', ')}
          />
        )}

        {profile.medications.length > 0 ? (
          <Row
            label="Medications"
            value={profile.medications.map((m) => `${m.name} ${m.dosage} ${m.frequency}`.trim()).join('\n')}
          />
        ) : (
          <Row label="Medications" value="None recorded" />
        )}

        {profile.diagnoses.length > 0 ? (
          <Row label="Conditions" value={profile.diagnoses.map((d) => d.name).join(', ')} />
        ) : (
          <Row label="Conditions" value="None recorded" />
        )}

        {profile.firstResponderNotes.communicationNeeds ? (
          <Row label="Communication" value={profile.firstResponderNotes.communicationNeeds} />
        ) : null}

        {profile.firstResponderNotes.triggers ? (
          <Row label="Triggers / Avoid" value={profile.firstResponderNotes.triggers} />
        ) : null}

        {profile.firstResponderNotes.calmingStrategies ? (
          <Row label="Calming Strategies" value={profile.firstResponderNotes.calmingStrategies} />
        ) : null}

        {profile.firstResponderNotes.dontList ? (
          <Row label="DO NOT" value={profile.firstResponderNotes.dontList} urgent />
        ) : null}

        {profile.firstResponderNotes.doList ? (
          <Row label="Helpful Approaches" value={profile.firstResponderNotes.doList} />
        ) : null}

        {profile.firstResponderNotes.additionalNotes ? (
          <Row label="Additional Notes" value={profile.firstResponderNotes.additionalNotes} />
        ) : null}

        <SectionHeader label="EMERGENCY CONTACTS" color={colors.green} />

        {profile.emergencyContacts.length > 0 ? (
          profile.emergencyContacts.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${c.phone}`)}
              accessibilityRole="button"
              accessibilityLabel={`Call ${c.name}`}
            >
              <View>
                <Text style={styles.contactName}>{c.name}{c.isPrimary ? ' ★' : ''}</Text>
                <Text style={styles.contactDetail}>{c.relationship} · {c.phone}</Text>
              </View>
              <View style={styles.callChip}>
                <Ionicons name="call" size={16} color={colors.greenLight} />
                <Text style={styles.callText}>Call</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Row label="Contacts" value="None recorded — ask caregiver" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <View style={[hStyles.wrap, { borderBottomColor: color }]}>
      <Text style={[hStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

function Row({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <View style={rowStyles.wrap}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, urgent && rowStyles.urgent]}>{value || 'Not recorded — ask caregiver'}</Text>
    </View>
  );
}

function Chip({ label, color = colors.textTertiary }: { label: string; color?: string }) {
  return (
    <View style={[chipStyles.wrap, { borderColor: color }]}>
      <Text style={[chipStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const hStyles = StyleSheet.create({
  wrap: { borderBottomWidth: 2, marginTop: 20, marginBottom: 10, paddingBottom: 4 },
  text: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
});
const rowStyles = StyleSheet.create({
  wrap: { marginBottom: 10, backgroundColor: colors.surface, borderRadius: 10, padding: 12 },
  label: { fontSize: 11, color: colors.textTertiary, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  value: { fontSize: 15, color: colors.text, lineHeight: 22 },
  urgent: { color: colors.redLight, fontWeight: '700' },
});
const chipStyles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: 12, fontWeight: '600' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.amberDim,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  actionBtnStop: { backgroundColor: colors.redDim, borderColor: colors.red },
  actionBtnShare: { backgroundColor: colors.greenDim, borderColor: colors.green },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 48 },
  idCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  idName: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 10 },
  idRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  criticalRow: {
    backgroundColor: colors.redDim,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.red,
  },
  criticalLabel: { color: colors.redLight, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  criticalValue: { color: '#FFB3AB', fontSize: 18, fontWeight: '800' },
  criticalReaction: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  contactName: { color: colors.text, fontSize: 15, fontWeight: '700' },
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
  callText: { color: colors.greenLight, fontSize: 13, fontWeight: '700' },
});
