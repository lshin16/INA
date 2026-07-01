import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Speech from 'expo-speech';
import { saveSession } from '../storage/sessionStorage';
import { OPQRSTSession, RootStackParamList } from '../types';
import { colors, MIN_TARGET, generateId } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OPQRST'>;
type Route = RouteProp<RootStackParamList, 'OPQRST'>;

// ── Step definitions ─────────────────────────────────────────────────────────

const SYMPTOM_OPTIONS = [
  { id: 'pain', label: 'In Pain', emoji: '🤕' },
  { id: 'dizzy', label: 'Dizzy', emoji: '😵' },
  { id: 'nausea', label: 'Sick / Nausea', emoji: '🤢' },
  { id: 'breathing', label: "Can't Breathe", emoji: '😮‍💨' },
  { id: 'fell', label: 'Fell / Injured', emoji: '🩹' },
  { id: 'scared', label: 'Scared', emoji: '😨' },
  { id: 'confused', label: 'Confused', emoji: '😵‍💫' },
  { id: 'other', label: 'Something Else', emoji: '🙋' },
];

const INTAKE_OPTIONS = [
  { id: 'just-now', label: 'Just now', emoji: '🕐' },
  { id: 'hour-ago', label: 'About 1 hour ago', emoji: '🕑' },
  { id: 'few-hours', label: 'A few hours ago', emoji: '🕓' },
  { id: 'not-sure', label: 'Not sure', emoji: '🤷' },
];

const ONSET_OPTIONS = [
  { id: 'just-now', label: 'Just now', emoji: '⚡' },
  { id: 'minutes-ago', label: 'Minutes ago', emoji: '🕐' },
  { id: 'this-morning', label: 'Earlier today', emoji: '☀️' },
  { id: 'while-ago', label: 'A while ago', emoji: '📅' },
  { id: 'not-sure', label: 'Not sure', emoji: '🤷' },
];

const QUALITY_OPTIONS = [
  { id: 'sharp', label: 'Sharp / Stabbing', emoji: '⚡' },
  { id: 'dull', label: 'Dull / Aching', emoji: '😔' },
  { id: 'burning', label: 'Burning', emoji: '🔥' },
  { id: 'pressure', label: 'Pressure / Squeezing', emoji: '🫁' },
  { id: 'throbbing', label: 'Throbbing', emoji: '💓' },
  { id: 'cramping', label: 'Cramping', emoji: '〰️' },
];

const PROVOCATION_OPTIONS = [
  { id: 'worse-moving', label: 'Worse moving', emoji: '🚶' },
  { id: 'worse-breathing', label: 'Worse breathing', emoji: '😮‍💨' },
  { id: 'worse-pressing', label: 'Worse when pressed', emoji: '👉' },
  { id: 'better-still', label: 'Better lying still', emoji: '🛏️' },
  { id: 'better-moving', label: 'Better moving', emoji: '🏃' },
  { id: 'no-change', label: 'No change', emoji: '↔️' },
];

// Faces for 0–10 severity
const FACES = [
  { score: 0, emoji: '😄', label: 'No pain', color: colors.sev0 },
  { score: 1, emoji: '🙂', label: '1', color: colors.sev0 },
  { score: 2, emoji: '😊', label: '2', color: colors.sev0 },
  { score: 3, emoji: '😐', label: '3', color: colors.sev3 },
  { score: 4, emoji: '😕', label: '4', color: colors.sev3 },
  { score: 5, emoji: '😟', label: '5', color: colors.sev5 },
  { score: 6, emoji: '😣', label: '6', color: colors.sev5 },
  { score: 7, emoji: '😢', label: '7', color: colors.sev8 },
  { score: 8, emoji: '😭', label: '8', color: colors.sev8 },
  { score: 9, emoji: '😫', label: '9', color: colors.sev10 },
  { score: 10, emoji: '🤯', label: 'Worst', color: colors.sev10 },
];

const TOTAL_STEPS = 7;

const STEP_TITLES: Record<number, string> = {
  0: "What's happening?",
  1: 'Last ate or drank?',
  2: 'When did this start?',
  3: 'Where does it hurt?',
  4: 'What does the pain feel like?',
  5: 'Better or worse with anything?',
  6: 'How bad is it?',
};

export default function OPQRSTScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const initialRegions = route.params?.initialRegions ?? [];

  const [step, setStep] = useState(0);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [lastOralIntake, setLastOralIntake] = useState('');
  const [onset, setOnset] = useState('');
  const [bodyRegions] = useState<string[]>(initialRegions);
  const [quality, setQuality] = useState('');
  const [provocation, setProvocation] = useState<string[]>([]);
  const [severity, setSeverity] = useState<number | null>(null);

  // Speak step question on mount and step change
  useEffect(() => {
    const title = STEP_TITLES[step];
    if (title) {
      setTimeout(() => Speech.speak(title, { rate: 0.85 }), 300);
    }
  }, [step]);

  function toggleMulti<T>(val: T, arr: T[], setter: (v: T[]) => void) {
    Vibration.vibrate(25);
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function selectSingle(val: string, setter: (v: string) => void) {
    Vibration.vibrate(25);
    setter(val);
  }

  function canAdvance(): boolean {
    if (step === 0) return symptoms.length > 0;
    if (step === 6) return severity !== null;
    return true; // all other steps are skippable per spec
  }

  function handleNext() {
    if (step === 3) {
      // Body map step — navigate away
      navigation.navigate('BodyMap', { returnTo: 'OPQRST', currentRegions: bodyRegions });
      return;
    }
    if (step === TOTAL_STEPS - 1) {
      handleFinish();
      return;
    }
    setStep((s) => s + 1);
  }

  async function handleFinish() {
    const session: OPQRSTSession = {
      timestamp: new Date().toISOString(),
      symptoms,
      lastOralIntake,
      onset,
      bodyRegions,
      quality,
      provocation,
      severity,
    };
    await saveSession(session);
    navigation.navigate('ResponderSummary', { session });
  }

  function handleSkip() {
    if (step === TOTAL_STEPS - 1) {
      handleFinish();
      return;
    }
    setStep((s) => s + 1);
  }

  const isLastStep = step === TOTAL_STEPS - 1;
  const stepLabel = `Step ${step + 1} of ${TOTAL_STEPS}`;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Progress header */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <View style={styles.stepHeader}>
        <Text style={styles.stepCounter}>{stepLabel}</Text>
        <TouchableOpacity onPress={handleSkip} accessibilityRole="button" accessibilityLabel="Skip this step">
          <Text style={styles.skipText}>Skip →</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.question}>{STEP_TITLES[step]}</Text>

      <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <ChoiceGrid
            options={SYMPTOM_OPTIONS}
            selected={symptoms}
            multiSelect
            onToggle={(id) => toggleMulti(id, symptoms, setSymptoms)}
          />
        )}

        {step === 1 && (
          <ChoiceGrid
            options={INTAKE_OPTIONS}
            selected={lastOralIntake ? [lastOralIntake] : []}
            onToggle={(id) => selectSingle(id, setLastOralIntake)}
          />
        )}

        {step === 2 && (
          <ChoiceGrid
            options={ONSET_OPTIONS}
            selected={onset ? [onset] : []}
            onToggle={(id) => selectSingle(id, setOnset)}
          />
        )}

        {step === 3 && (
          <View style={styles.bodyMapStep}>
            <Text style={styles.bodyMapHint}>
              {bodyRegions.length > 0
                ? `Areas selected: ${bodyRegions.join(', ')}`
                : 'No areas selected yet'}
            </Text>
            <TouchableOpacity
              style={styles.openBodyMapBtn}
              onPress={() =>
                navigation.navigate('BodyMap', { returnTo: 'OPQRST', currentRegions: bodyRegions })
              }
              accessibilityRole="button"
            >
              <Text style={styles.openBodyMapEmoji}>🫀</Text>
              <Text style={styles.openBodyMapLabel}>Open Body Map</Text>
              <Text style={styles.openBodyMapHint}>Tap where it hurts</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 4 && (
          <ChoiceGrid
            options={QUALITY_OPTIONS}
            selected={quality ? [quality] : []}
            onToggle={(id) => selectSingle(id, setQuality)}
          />
        )}

        {step === 5 && (
          <ChoiceGrid
            options={PROVOCATION_OPTIONS}
            selected={provocation}
            multiSelect
            onToggle={(id) => toggleMulti(id, provocation, setProvocation)}
          />
        )}

        {step === 6 && (
          <View style={styles.facesSection}>
            <Text style={styles.facesHint}>Tap the face that matches how bad it feels</Text>
            <View style={styles.facesGrid}>
              {FACES.map((face) => (
                <TouchableOpacity
                  key={face.score}
                  style={[
                    styles.faceBtn,
                    severity === face.score && { borderColor: face.color, backgroundColor: face.color + '33' },
                  ]}
                  onPress={() => {
                    Vibration.vibrate(25);
                    setSeverity(face.score);
                    Speech.stop();
                    Speech.speak(`${face.score}, ${face.label}`, { rate: 0.9 });
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: severity === face.score }}
                  accessibilityLabel={`Pain level ${face.score}: ${face.label}`}
                >
                  <Text style={styles.faceEmoji}>{face.emoji}</Text>
                  <Text style={[styles.faceScore, { color: face.color }]}>{face.score}</Text>
                  {face.score === 0 && <Text style={styles.faceTag}>None</Text>}
                  {face.score === 10 && <Text style={styles.faceTag}>Worst</Text>}
                </TouchableOpacity>
              ))}
            </View>
            {severity !== null && (
              <View style={[styles.severitySelected, { borderColor: FACES[severity].color }]}>
                <Text style={styles.severityEmoji}>{FACES[severity].emoji}</Text>
                <Text style={[styles.severityScore, { color: FACES[severity].color }]}>
                  {severity} / 10 — {FACES[severity].label}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Navigation footer */}
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep((s) => s - 1)}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canAdvance() && step !== 3 && styles.nextBtnDisabled]}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={isLastStep ? 'See responder summary' : 'Next step'}
        >
          <Text style={styles.nextBtnText}>
            {step === 3
              ? 'Continue →'
              : isLastStep
              ? '🚨 See Summary'
              : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Shared chip grid ──────────────────────────────────────────────────────────

interface Option {
  id: string;
  label: string;
  emoji: string;
}

function ChoiceGrid({
  options,
  selected,
  multiSelect = false,
  onToggle,
}: {
  options: Option[];
  selected: string[];
  multiSelect?: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <View style={gridStyles.wrap}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <TouchableOpacity
            key={opt.id}
            style={[gridStyles.chip, isSelected && gridStyles.chipSelected]}
            onPress={() => {
              Speech.stop();
              Speech.speak(opt.label, { rate: 0.9 });
              onToggle(opt.id);
            }}
            activeOpacity={0.7}
            accessibilityRole={multiSelect ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={opt.label}
          >
            <Text style={gridStyles.chipEmoji}>{opt.emoji}</Text>
            <Text style={[gridStyles.chipLabel, isSelected && gridStyles.chipLabelSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const gridStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: {
    width: '47%',
    minHeight: MIN_TARGET,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 6,
  },
  chipSelected: { backgroundColor: colors.amberDim, borderColor: colors.amber },
  chipEmoji: { fontSize: 30 },
  chipLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  chipLabelSelected: { color: colors.amberLight, fontWeight: '800' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  progressBar: { height: 4, backgroundColor: colors.surface },
  progressFill: { height: 4, backgroundColor: colors.amber },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stepCounter: { color: colors.textTertiary, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  skipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  question: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 30,
  },
  stepContent: { paddingHorizontal: 20, paddingBottom: 20 },

  bodyMapStep: { alignItems: 'center', gap: 16 },
  bodyMapHint: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  openBodyMapBtn: {
    backgroundColor: colors.redDim,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.red,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    width: '100%',
    minHeight: 160,
    justifyContent: 'center',
  },
  openBodyMapEmoji: { fontSize: 56 },
  openBodyMapLabel: { color: colors.redLight, fontSize: 20, fontWeight: '800' },
  openBodyMapHint: { color: colors.textSecondary, fontSize: 13 },

  facesSection: { gap: 16 },
  facesHint: { color: colors.textSecondary, fontSize: 15, textAlign: 'center' },
  facesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  faceBtn: {
    width: 56,
    minHeight: 70,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 2,
  },
  faceEmoji: { fontSize: 28 },
  faceScore: { fontSize: 13, fontWeight: '800' },
  faceTag: { fontSize: 9, color: colors.textTertiary, fontWeight: '600' },
  severitySelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    marginTop: 8,
  },
  severityEmoji: { fontSize: 36 },
  severityScore: { fontSize: 20, fontWeight: '800' },

  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  backBtn: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: MIN_TARGET,
    justifyContent: 'center',
  },
  backBtnText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  nextBtn: {
    flex: 1,
    backgroundColor: colors.amber,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: MIN_TARGET,
    justifyContent: 'center',
  },
  nextBtnDisabled: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
