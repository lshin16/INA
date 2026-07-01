import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { loadProfile } from '../storage/storage';
import { clearSession } from '../storage/sessionStorage';
import {
  setupNotificationChannel,
  requestNotificationPermissions,
  activateLockScreen,
} from '../utils/notifications';
import { EmergencyProfile, RootStackParamList } from '../types';
import { colors, MIN_TARGET } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadProfile().then((p) => {
        setProfile(p);
        // Re-post lock screen notification with latest profile on every focus
        setupNotificationChannel()
          .then(() => requestNotificationPermissions())
          .then((granted) => { if (granted) activateLockScreen(p); })
          .catch(() => {});
      });
    }, []),
  );

  const p = profile?.personal;
  const displayName =
    p?.preferredName || [p?.firstName, p?.lastName].filter(Boolean).join(' ') || null;
  const ageOrDob = p?.age ? `Age ${p.age}` : p?.dateOfBirth ? `DOB: ${p.dateOfBirth}` : null;

  async function handleAmber() {
    await clearSession();
    navigation.navigate('OPQRST', {});
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* "I communicate differently" banner — always visible */}
        <View
          style={styles.banner}
          accessible
          accessibilityRole="text"
          accessibilityLabel="I communicate differently. Please give me time. Ask yes or no questions. Use this app with me."
        >
          <Ionicons name="information-circle" size={18} color={colors.amberLight} />
          <Text style={styles.bannerText}>
            I communicate differently — give me time · ask yes/no · use this app with me
          </Text>
        </View>

        {/* Member identity */}
        <View style={styles.identity}>
          {p?.photoUri ? (
            <Image source={{ uri: p.photoUri }} style={styles.photo} accessible accessibilityLabel="Member photo" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={44} color={colors.textTertiary} />
            </View>
          )}
          <Text style={styles.name} accessibilityRole="header">
            {displayName ?? 'Set up your profile'}
          </Text>
          {ageOrDob ? <Text style={styles.subtitle}>{ageOrDob}</Text> : null}
        </View>

        {/* Stoplight buttons */}
        <View style={styles.stoplight}>
          {/* RED — Emergency medical info */}
          <StoplightButton
            color={colors.red}
            dimColor={colors.redDim}
            lightColor={colors.redLight}
            emoji="🚨"
            label="Emergency Info"
            sublabel="Show my medical info to a responder"
            accessibilityHint="Opens your emergency medical profile for first responders"
            onPress={() => navigation.navigate('EmergencyProfile')}
          />

          {/* AMBER — I need to tell you something */}
          <StoplightButton
            color={colors.amber}
            dimColor={colors.amberDim}
            lightColor={colors.amberLight}
            emoji="💬"
            label="I Need to Tell You Something"
            sublabel="Describe what's happening right now"
            accessibilityHint="Starts the symptom reporting wizard"
            onPress={handleAmber}
          />

          {/* GREEN — Talk with me now */}
          <StoplightButton
            color={colors.green}
            dimColor={colors.greenDim}
            lightColor={colors.greenLight}
            emoji="🗣️"
            label="Talk With Me Now"
            sublabel="Yes · No · Help · It Hurts · and more"
            accessibilityHint="Opens communication words that speak aloud"
            onPress={() => navigation.navigate('TalkNow')}
          />
        </View>

        {/* Caregiver access — small, intentionally not prominent */}
        <TouchableOpacity
          style={styles.caregiverBtn}
          onPress={() => navigation.navigate('CaregiverPIN')}
          accessibilityLabel="Caregiver setup mode"
          accessibilityHint="Requires PIN. Edit the emergency profile."
          accessibilityRole="button"
        >
          <Ionicons name="settings-outline" size={16} color={colors.textTertiary} />
          <Text style={styles.caregiverText}>Caregiver Setup</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

interface StoplightButtonProps {
  color: string;
  dimColor: string;
  lightColor: string;
  emoji: string;
  label: string;
  sublabel: string;
  accessibilityHint: string;
  onPress: () => void;
}

function StoplightButton({
  color,
  dimColor,
  lightColor,
  emoji,
  label,
  sublabel,
  accessibilityHint,
  onPress,
}: StoplightButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: dimColor, borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
    >
      <View style={[styles.buttonDot, { backgroundColor: color }]}>
        <Text style={styles.buttonEmoji}>{emoji}</Text>
      </View>
      <View style={styles.buttonContent}>
        <Text style={[styles.buttonLabel, { color: lightColor }]}>{label}</Text>
        <Text style={styles.buttonSublabel}>{sublabel}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32 },

  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.amberDim,
    borderRadius: 10,
    padding: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  bannerText: {
    flex: 1,
    color: colors.amberLight,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  identity: { alignItems: 'center', marginBottom: 36 },
  photo: { width: 100, height: 100, borderRadius: 50, marginBottom: 14 },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  name: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },

  stoplight: { gap: 14, marginBottom: 32 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    minHeight: MIN_TARGET + 20,
    gap: 16,
  },
  buttonDot: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  buttonEmoji: { fontSize: 26 },
  buttonContent: { flex: 1 },
  buttonLabel: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  buttonSublabel: { fontSize: 13, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },

  caregiverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    opacity: 0.6,
  },
  caregiverText: { color: colors.textTertiary, fontSize: 14 },
});
