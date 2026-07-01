export interface PersonalInfo {
  firstName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  age: string;
  bloodType: string;
  height: string;
  weight: string;
  photoUri: string;
}

export interface Diagnosis {
  id: string;
  name: string;
  notes: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

export type AllergySeverity = 'Mild' | 'Moderate' | 'Severe' | 'Life-threatening';

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: AllergySeverity;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface FirstResponderNotes {
  communicationNeeds: string;
  triggers: string;
  calmingStrategies: string;
  doList: string;
  dontList: string;
  additionalNotes: string;
}

export interface EmergencyProfile {
  personal: PersonalInfo;
  diagnoses: Diagnosis[];
  medications: Medication[];
  allergies: Allergy[];
  emergencyContacts: EmergencyContact[];
  firstResponderNotes: FirstResponderNotes;
}

// Live session captured during AMBER flow (OPQRST)
export interface OPQRSTSession {
  timestamp: string;
  symptoms: string[];       // S — Signs/Symptoms
  lastOralIntake: string;   // L — Last oral intake
  onset: string;            // O — Onset
  bodyRegions: string[];    // R — Region
  quality: string;          // Q — Quality
  provocation: string[];    // P — Provocation/Palliation
  severity: number | null;  // S — Severity (0–10)
}

export const defaultOPQRSTSession: OPQRSTSession = {
  timestamp: '',
  symptoms: [],
  lastOralIntake: '',
  onset: '',
  bodyRegions: [],
  quality: '',
  provocation: [],
  severity: null,
};

export const defaultProfile: EmergencyProfile = {
  personal: {
    firstName: '',
    lastName: '',
    preferredName: '',
    dateOfBirth: '',
    age: '',
    bloodType: '',
    height: '',
    weight: '',
    photoUri: '',
  },
  diagnoses: [],
  medications: [],
  allergies: [],
  emergencyContacts: [],
  firstResponderNotes: {
    communicationNeeds: '',
    triggers: '',
    calmingStrategies: '',
    doList: '',
    dontList: '',
    additionalNotes: '',
  },
};

export type RootStackParamList = {
  Home: undefined;
  EmergencyProfile: undefined;
  TalkNow: undefined;
  BodyMap: { returnTo: 'OPQRST'; currentRegions: string[] };
  OPQRST: { initialRegions?: string[] };
  ResponderSummary: { session: OPQRSTSession | null };
  CaregiverPIN: undefined;
  EditMenu: undefined;
  PersonalInfo: undefined;
  Diagnoses: undefined;
  Medications: undefined;
  Allergies: undefined;
  EmergencyContacts: undefined;
  FirstResponderNotes: undefined;
};
