import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { EmergencyProfile } from '../types';

const CHANNEL_ID = 'emergency';
const NOTIFICATION_ID = 'ice-lockscreen';

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Emergency Information',
      description: 'Displays your emergency info on the lock screen.',
      importance: Notifications.AndroidImportance.MAX,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: null,
      enableVibrate: false,
      showBadge: false,
    });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    // Simulator: skip permission prompt, just return true for testing
    return true;
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function buildNotificationBody(profile: EmergencyProfile): { title: string; body: string } {
  const { personal, diagnoses, allergies, medications, emergencyContacts, firstResponderNotes } = profile;

  const name =
    personal.preferredName ||
    [personal.firstName, personal.lastName].filter(Boolean).join(' ') ||
    'Unknown';

  const lines: string[] = [];

  const details: string[] = [];
  if (personal.dateOfBirth) details.push(`DOB: ${personal.dateOfBirth}`);
  if (personal.bloodType) details.push(`Blood Type: ${personal.bloodType}`);
  if (details.length) lines.push(details.join('  |  '));

  if (diagnoses.length) {
    lines.push(`Conditions: ${diagnoses.map((d) => d.name).join(', ')}`);
  }

  const critical = allergies.filter((a) => a.severity === 'Life-threatening');
  const other = allergies.filter((a) => a.severity !== 'Life-threatening');
  if (critical.length) {
    lines.push(`⚠️ LIFE-THREATENING ALLERGIES: ${critical.map((a) => a.allergen).join(', ')}`);
  }
  if (other.length) {
    lines.push(`Allergies: ${other.map((a) => a.allergen).join(', ')}`);
  }

  if (medications.length) {
    lines.push(`Medications: ${medications.map((m) => `${m.name} ${m.dosage}`.trim()).join(', ')}`);
  }

  const primary = emergencyContacts.find((c) => c.isPrimary) ?? emergencyContacts[0];
  if (primary) {
    lines.push(`Emergency Contact: ${primary.name} (${primary.relationship}) — ${primary.phone}`);
  }
  if (emergencyContacts.length > 1) {
    const rest = emergencyContacts.filter((c) => c.id !== primary?.id);
    lines.push(`Also contact: ${rest.map((c) => `${c.name} ${c.phone}`).join(', ')}`);
  }

  if (firstResponderNotes.communicationNeeds) {
    lines.push(`Communication: ${firstResponderNotes.communicationNeeds}`);
  }
  if (firstResponderNotes.calmingStrategies) {
    lines.push(`Calming: ${firstResponderNotes.calmingStrategies}`);
  }
  if (firstResponderNotes.additionalNotes) {
    lines.push(`Notes: ${firstResponderNotes.additionalNotes}`);
  }

  return {
    title: `🚨 ICE — ${name}`,
    body: lines.join('\n') || 'Open the app to add emergency information.',
  };
}

export async function activateLockScreen(profile: EmergencyProfile): Promise<void> {
  await deactivateLockScreen();
  const { title, body } = buildNotificationBody(profile);

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title,
      body,
      sticky: true,
      autoDismiss: false,
      priority: 'max',
      color: '#FF3B30',
      ...(Platform.OS === 'android' && { android: { channelId: CHANNEL_ID } }),
    },
    trigger: null,
  });
}

export async function deactivateLockScreen(): Promise<void> {
  await Notifications.dismissNotificationAsync(NOTIFICATION_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => {});
}
