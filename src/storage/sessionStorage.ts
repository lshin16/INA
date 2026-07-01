import AsyncStorage from '@react-native-async-storage/async-storage';
import { OPQRSTSession, defaultOPQRSTSession } from '../types';

const SESSION_KEY = '@ice_opqrst_session';

export async function loadSession(): Promise<OPQRSTSession> {
  try {
    const json = await AsyncStorage.getItem(SESSION_KEY);
    return json ? { ...defaultOPQRSTSession, ...JSON.parse(json) } : defaultOPQRSTSession;
  } catch {
    return defaultOPQRSTSession;
  }
}

export async function saveSession(session: OPQRSTSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
