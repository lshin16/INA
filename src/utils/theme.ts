// Muted, high-contrast accessible palette (WCAG 2.2 AA+ target)
// Low sensory load: no harsh pure-primary colors, calm darks
export const colors = {
  background: '#12120F',
  surface: '#1E1E1A',
  surfaceAlt: '#2A2A26',
  border: '#3C3C38',

  // Stoplight — desaturated to reduce aggression, still clearly distinct
  red: '#C0392B',
  redDim: '#3D1210',
  redLight: '#FF6B5B',

  amber: '#CA6F1E',
  amberDim: '#3D2409',
  amberLight: '#F0A050',

  green: '#1E8449',
  greenDim: '#0A2E1A',
  greenLight: '#52BE80',

  // Neutral
  text: '#F0EFE8',
  textSecondary: '#A09E98',
  textTertiary: '#6B6966',

  // Severity scale (pain faces)
  sev0: '#27AE60',
  sev3: '#F1C40F',
  sev5: '#E67E22',
  sev8: '#E74C3C',
  sev10: '#922B21',
};

export const generateId = (): string =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

// Minimum touch target per spec: 64–72px
export const MIN_TARGET = 68;
