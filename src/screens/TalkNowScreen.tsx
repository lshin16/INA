import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Speech from 'expo-speech';
import { RootStackParamList } from '../types';
import { colors, MIN_TARGET } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TalkNow'>;

interface CoreWord {
  emoji: string;
  word: string;
  speakText: string;
  color: string;
  dimColor: string;
  lightColor: string;
  goToBodyMap?: boolean;
}

const CORE_WORDS: CoreWord[] = [
  { emoji: '✅', word: 'Yes', speakText: 'Yes', color: colors.green, dimColor: colors.greenDim, lightColor: colors.greenLight },
  { emoji: '❌', word: 'No', speakText: 'No', color: colors.red, dimColor: colors.redDim, lightColor: colors.redLight },
  { emoji: '🤕', word: 'It Hurts', speakText: 'It hurts', color: colors.red, dimColor: colors.redDim, lightColor: colors.redLight, goToBodyMap: true },
  { emoji: '🆘', word: 'Help', speakText: 'Help me, please', color: colors.red, dimColor: colors.redDim, lightColor: colors.redLight },
  { emoji: '✋', word: 'Stop', speakText: 'Stop, please stop', color: colors.amber, dimColor: colors.amberDim, lightColor: colors.amberLight },
  { emoji: '😨', word: 'Scared', speakText: 'I am scared', color: colors.amber, dimColor: colors.amberDim, lightColor: colors.amberLight },
  { emoji: '⏳', word: 'Wait', speakText: 'Please wait', color: colors.amber, dimColor: colors.amberDim, lightColor: colors.amberLight },
  { emoji: '🤷', word: "Don't Understand", speakText: 'I do not understand', color: '#5E5CE6', dimColor: '#1C1B4B', lightColor: '#A5A3FF' },
];

export default function TalkNowScreen() {
  const navigation = useNavigation<Nav>();
  const lastSpoke = useRef<number>(0);

  function speak(word: CoreWord) {
    // Debounce: prevent double-fires
    const now = Date.now();
    if (now - lastSpoke.current < 400) return;
    lastSpoke.current = now;

    Vibration.vibrate(30);
    Speech.stop();
    Speech.speak(word.speakText, { rate: 0.85, pitch: 1.0 });

    if (word.goToBodyMap) {
      // Small delay so TTS starts before nav transition
      setTimeout(() => {
        navigation.navigate('BodyMap', { returnTo: 'OPQRST', currentRegions: [] });
      }, 600);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.hint}>
        <Text style={styles.hintText}>
          Tap a word — it will speak aloud. "It Hurts" opens the body map.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {CORE_WORDS.map((word) => (
          <TouchableOpacity
            key={word.word}
            style={[styles.wordBtn, { backgroundColor: word.dimColor, borderColor: word.color }]}
            onPress={() => speak(word)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={word.word}
            accessibilityHint={word.goToBodyMap ? 'Also opens the body map' : `Speaks aloud: ${word.speakText}`}
          >
            <Text style={styles.wordEmoji}>{word.emoji}</Text>
            <Text style={[styles.wordLabel, { color: word.lightColor }]}>{word.word}</Text>
            {word.goToBodyMap && (
              <View style={[styles.bodyMapBadge, { backgroundColor: word.color }]}>
                <Text style={styles.bodyMapBadgeText}>+ Body Map</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hint: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  hintText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  grid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  wordBtn: {
    width: '47%',
    minHeight: MIN_TARGET + 30,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  wordEmoji: { fontSize: 40 },
  wordLabel: { fontSize: 18, fontWeight: '800', textAlign: 'center', lineHeight: 22 },
  bodyMapBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  bodyMapBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
