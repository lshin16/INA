import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmergencyProfile, defaultProfile } from '../types';

const PROFILE_KEY = '@ice_emergency_profile';

export async function loadProfile(): Promise<EmergencyProfile> {
  try {
    const json = await AsyncStorage.getItem(PROFILE_KEY);
    if (!json) return defaultProfile;
    const parsed = JSON.parse(json) as Partial<EmergencyProfile>;
    // Merge with defaults so new fields don't break old saves
    return {
      ...defaultProfile,
      ...parsed,
      personal: { ...defaultProfile.personal, ...(parsed.personal ?? {}) },
      firstResponderNotes: {
        ...defaultProfile.firstResponderNotes,
        ...(parsed.firstResponderNotes ?? {}),
      },
    };
  } catch {
    return defaultProfile;
  }
}

export async function saveProfile(profile: EmergencyProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
