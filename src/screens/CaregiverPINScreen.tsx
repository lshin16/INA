import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { colors, MIN_TARGET } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CaregiverPIN'>;

const PIN_KEY = '@ice_caregiver_pin';
const DEFAULT_PIN = '1234';

async function getStoredPIN(): Promise<string> {
  const pin = await AsyncStorage.getItem(PIN_KEY);
  return pin ?? DEFAULT_PIN;
}

async function setStoredPIN(pin: string): Promise<void> {
  await AsyncStorage.setItem(PIN_KEY, pin);
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'del'];

export default function CaregiverPINScreen() {
  const navigation = useNavigation<Nav>();
  const [entry, setEntry] = useState('');
  const [mode, setMode] = useState<'unlock' | 'setNew1' | 'setNew2'>('unlock');
  const [firstPIN, setFirstPIN] = useState('');
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PIN_KEY).then((pin) => {
      if (pin === null) {
        // First time — set a PIN
        setIsFirstLaunch(true);
        setMode('setNew1');
      }
    });
  }, []);

  function pressKey(key: string | null) {
    if (key === null) return;
    Vibration.vibrate(20);

    if (key === 'del') {
      setEntry((prev) => prev.slice(0, -1));
      return;
    }
    if (entry.length >= 4) return;
    const next = entry + key;
    setEntry(next);

    if (next.length === 4) {
      handleFourDigits(next);
    }
  }

  async function handleFourDigits(pin: string) {
    if (mode === 'unlock') {
      const stored = await getStoredPIN();
      if (pin === stored) {
        navigation.navigate('EditMenu');
      } else {
        triggerShake();
        setTimeout(() => setEntry(''), 600);
      }
    } else if (mode === 'setNew1') {
      setFirstPIN(pin);
      setMode('setNew2');
      setEntry('');
    } else if (mode === 'setNew2') {
      if (pin === firstPIN) {
        await setStoredPIN(pin);
        Alert.alert('PIN Set', 'Your caregiver PIN has been saved.', [
          { text: 'Enter Profile', onPress: () => navigation.navigate('EditMenu') },
        ]);
      } else {
        Alert.alert('PINs did not match', 'Please try again.');
        setMode('setNew1');
        setFirstPIN('');
        setEntry('');
      }
    }
  }

  function triggerShake() {
    setShake(true);
    Vibration.vibrate([0, 60, 60, 60]);
    setTimeout(() => setShake(false), 500);
  }

  async function handleForgotPIN() {
    Alert.alert(
      'Reset Caregiver PIN',
      'This will reset the PIN to 1234. You can change it after entering the profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to 1234',
          style: 'destructive',
          onPress: async () => {
            await setStoredPIN(DEFAULT_PIN);
            setEntry('');
            setMode('unlock');
            Alert.alert('PIN Reset', 'PIN reset to 1234.');
          },
        },
      ],
    );
  }

  const titleText =
    mode === 'setNew1'
      ? isFirstLaunch
        ? 'Create a Caregiver PIN'
        : 'Enter New PIN'
      : mode === 'setNew2'
      ? 'Confirm New PIN'
      : 'Caregiver Mode';

  const subtitleText =
    mode === 'setNew1'
      ? 'Choose a 4-digit PIN to protect profile editing'
      : mode === 'setNew2'
      ? 'Enter the same PIN again to confirm'
      : 'Enter PIN to edit the emergency profile';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={36} color={colors.amberLight} />
        </View>

        <Text style={styles.title}>{titleText}</Text>
        <Text style={styles.subtitle}>{subtitleText}</Text>

        {/* Dot display */}
        <View style={[styles.dots, shake && styles.dotsShake]}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.dot, i < entry.length && styles.dotFilled]}
            />
          ))}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {KEYS.map((key, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.key, key === null && styles.keyEmpty]}
              onPress={() => pressKey(key)}
              disabled={key === null}
              accessibilityRole="button"
              accessibilityLabel={key === 'del' ? 'Delete' : key ?? ''}
            >
              {key === 'del' ? (
                <Ionicons name="backspace-outline" size={24} color={colors.text} />
              ) : key !== null ? (
                <Text style={styles.keyText}>{key}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'unlock' && (
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={handleForgotPIN}
            accessibilityRole="button"
          >
            <Text style={styles.forgotText}>Forgot PIN?</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.amberDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.amber,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 36 },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 36 },
  dotsShake: { transform: [{ translateX: 8 }] },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.amber,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: colors.amber },
  keypad: {
    width: '100%',
    maxWidth: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  key: {
    width: 80,
    height: MIN_TARGET,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { fontSize: 24, fontWeight: '700', color: colors.text },
  forgotBtn: { marginTop: 24, paddingVertical: 8 },
  forgotText: { color: colors.textTertiary, fontSize: 14 },
});
