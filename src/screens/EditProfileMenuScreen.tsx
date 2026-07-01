import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import SectionRow from '../components/SectionRow';
import { loadProfile } from '../storage/storage';
import { EmergencyProfile, RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditMenu'>;

export default function EditProfileMenuScreen() {
  const navigation = useNavigation<Nav>();
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadProfile().then(setProfile);
    }, []),
  );

  const p = profile?.personal;
  const personalSubtitle =
    p && (p.firstName || p.lastName)
      ? [p.firstName, p.lastName].filter(Boolean).join(' ')
      : 'Not set';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Caregiver mode notice */}
        <View style={styles.modeBanner}>
          <Ionicons name="lock-open" size={16} color={colors.amberLight} />
          <Text style={styles.modeBannerText}>
            Caregiver Mode — changes here update what first responders see.
          </Text>
        </View>

        {/* RED tier — life-safety */}
        <TierLabel color={colors.red} label="⚠️  LIFE-SAFETY (shown first to responders)" />
        <View style={styles.group}>
          <SectionRow
            icon="warning-outline"
            label="Allergies"
            count={profile?.allergies.length}
            subtitle={profile?.allergies.map((a) => a.allergen).join(', ') || 'None added'}
            onPress={() => navigation.navigate('Allergies')}
          />
          <SectionRow
            icon="document-text-outline"
            label="First Responder Notes"
            subtitle="DO NOT list, triggers, calming strategies"
            onPress={() => navigation.navigate('FirstResponderNotes')}
          />
        </View>

        {/* AMBER tier — medical */}
        <TierLabel color={colors.amber} label="💊  MEDICAL" />
        <View style={styles.group}>
          <SectionRow
            icon="flask-outline"
            label="Medications"
            count={profile?.medications.length}
            subtitle={profile?.medications.map((m) => m.name).join(', ') || 'None added'}
            onPress={() => navigation.navigate('Medications')}
          />
          <SectionRow
            icon="medical-outline"
            label="Diagnoses & Conditions"
            count={profile?.diagnoses.length}
            subtitle={profile?.diagnoses.map((d) => d.name).join(', ') || 'None added'}
            onPress={() => navigation.navigate('Diagnoses')}
          />
        </View>

        {/* GREEN tier — communication & contacts */}
        <TierLabel color={colors.green} label="🗣️  COMMUNICATION & CONTACTS" />
        <View style={styles.group}>
          <SectionRow
            icon="person-outline"
            label="Personal Info"
            subtitle={personalSubtitle}
            onPress={() => navigation.navigate('PersonalInfo')}
          />
          <SectionRow
            icon="call-outline"
            label="Emergency Contacts"
            count={profile?.emergencyContacts.length}
            subtitle={
              profile?.emergencyContacts.find((c) => c.isPrimary)?.name ||
              profile?.emergencyContacts[0]?.name ||
              'None added'
            }
            onPress={() => navigation.navigate('EmergencyContacts')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TierLabel({ color, label }: { color: string; label: string }) {
  return (
    <Text style={[tierStyles.label, { color }]}>{label}</Text>
  );
}

const tierStyles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, paddingHorizontal: 16, marginTop: 20, marginBottom: 6 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: 16, paddingBottom: 48 },
  modeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: colors.amberDim,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  modeBannerText: { color: colors.amberLight, fontSize: 13, flex: 1, lineHeight: 18 },
  group: {
    marginBottom: 4,
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
});
