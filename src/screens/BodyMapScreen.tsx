import React, { useState } from 'react';
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
import { RootStackParamList } from '../types';
import { colors, MIN_TARGET } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BodyMap'>;
type Route = RouteProp<RootStackParamList, 'BodyMap'>;

// Front and back body regions as defined in the spec
const FRONT_REGIONS = [
  { id: 'head', label: 'Head', speakText: 'Head' },
  { id: 'face', label: 'Face', speakText: 'Face' },
  { id: 'neck', label: 'Neck', speakText: 'Neck' },
  { id: 'left-shoulder', label: 'L. Shoulder', speakText: 'Left shoulder' },
  { id: 'right-shoulder', label: 'R. Shoulder', speakText: 'Right shoulder' },
  { id: 'left-chest', label: 'L. Chest', speakText: 'Left chest' },
  { id: 'right-chest', label: 'R. Chest', speakText: 'Right chest' },
  { id: 'stomach', label: 'Stomach', speakText: 'Stomach and abdomen' },
  { id: 'left-arm', label: 'L. Arm', speakText: 'Left arm' },
  { id: 'right-arm', label: 'R. Arm', speakText: 'Right arm' },
  { id: 'left-hand', label: 'L. Hand', speakText: 'Left hand' },
  { id: 'right-hand', label: 'R. Hand', speakText: 'Right hand' },
  { id: 'hips', label: 'Hips / Pelvis', speakText: 'Hips and pelvis' },
  { id: 'left-leg', label: 'L. Leg', speakText: 'Left leg' },
  { id: 'right-leg', label: 'R. Leg', speakText: 'Right leg' },
  { id: 'left-foot', label: 'L. Foot', speakText: 'Left foot' },
  { id: 'right-foot', label: 'R. Foot', speakText: 'Right foot' },
];

const BACK_REGIONS = [
  { id: 'back-head', label: 'Back of Head', speakText: 'Back of head' },
  { id: 'back-neck', label: 'Back of Neck', speakText: 'Back of neck' },
  { id: 'upper-back', label: 'Upper Back', speakText: 'Upper back' },
  { id: 'lower-back', label: 'Lower Back', speakText: 'Lower back' },
  { id: 'left-back-shoulder', label: 'L. Shoulder', speakText: 'Left shoulder blade' },
  { id: 'right-back-shoulder', label: 'R. Shoulder', speakText: 'Right shoulder blade' },
  { id: 'left-buttock', label: 'L. Buttock', speakText: 'Left buttock' },
  { id: 'right-buttock', label: 'R. Buttock', speakText: 'Right buttock' },
  { id: 'left-back-leg', label: 'L. Back of Leg', speakText: 'Back of left leg' },
  { id: 'right-back-leg', label: 'R. Back of Leg', speakText: 'Back of right leg' },
];

export default function BodyMapScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { returnTo, currentRegions } = route.params;

  const [view, setView] = useState<'front' | 'back'>('front');
  const [selected, setSelected] = useState<Set<string>>(new Set(currentRegions));

  const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS;

  function toggleRegion(region: { id: string; label: string; speakText: string }) {
    Vibration.vibrate(25);
    Speech.stop();
    Speech.speak(region.speakText, { rate: 0.9 });

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(region.id)) {
        next.delete(region.id);
      } else {
        next.add(region.id);
      }
      return next;
    });
  }

  function handleDone() {
    const selectedLabels = [...FRONT_REGIONS, ...BACK_REGIONS]
      .filter((r) => selected.has(r.id))
      .map((r) => r.label);

    navigation.navigate('OPQRST', { initialRegions: selectedLabels });
  }

  const selectedCount = selected.size;
  const selectedLabels = [...FRONT_REGIONS, ...BACK_REGIONS]
    .filter((r) => selected.has(r.id))
    .map((r) => r.label);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Front / Back toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'front' && styles.toggleBtnActive]}
          onPress={() => setView('front')}
          accessibilityRole="button"
          accessibilityState={{ selected: view === 'front' }}
        >
          <Text style={[styles.toggleText, view === 'front' && styles.toggleTextActive]}>
            Front
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'back' && styles.toggleBtnActive]}
          onPress={() => setView('back')}
          accessibilityRole="button"
          accessibilityState={{ selected: view === 'back' }}
        >
          <Text style={[styles.toggleText, view === 'back' && styles.toggleTextActive]}>
            Back
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.instruction}>
        Tap where it hurts — each tap will say the name aloud
      </Text>

      <ScrollView contentContainerStyle={styles.grid}>
        {regions.map((region) => {
          const isSelected = selected.has(region.id);
          return (
            <TouchableOpacity
              key={region.id}
              style={[
                styles.regionBtn,
                isSelected && styles.regionBtnSelected,
              ]}
              onPress={() => toggleRegion(region)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={region.speakText}
            >
              <Text style={[styles.regionLabel, isSelected && styles.regionLabelSelected]}>
                {region.label}
              </Text>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected summary + Done */}
      <View style={styles.footer}>
        {selectedCount > 0 && (
          <Text style={styles.selectedSummary} numberOfLines={2}>
            Selected: {selectedLabels.join(', ')}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.doneBtn, selectedCount === 0 && styles.doneBtnSkip]}
          onPress={handleDone}
          accessibilityRole="button"
          accessibilityLabel={selectedCount > 0 ? `Done, ${selectedCount} area selected` : 'Skip body map'}
        >
          <Text style={styles.doneBtnText}>
            {selectedCount > 0 ? `Done — ${selectedCount} area${selectedCount !== 1 ? 's' : ''} selected` : 'Skip (no pain location)'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  toggleRow: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: colors.amber },
  toggleText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  toggleTextActive: { color: '#fff', fontWeight: '800' },
  instruction: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  grid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },
  regionBtn: {
    width: '30%',
    minHeight: MIN_TARGET,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 4,
  },
  regionBtnSelected: {
    backgroundColor: colors.redDim,
    borderColor: colors.red,
  },
  regionLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  regionLabelSelected: { color: colors.redLight, fontWeight: '800' },
  checkmark: { color: colors.redLight, fontSize: 16, fontWeight: '800' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  selectedSummary: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  doneBtn: {
    backgroundColor: colors.amber,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: MIN_TARGET,
    justifyContent: 'center',
  },
  doneBtnSkip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
