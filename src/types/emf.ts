export interface SensorReading {
  x: number; // in µT
  y: number; // in µT
  z: number; // in µT
  magnitude: number; // in µT
  deltaMagnitude: number; // |magnitude - baseline| in µT
  milliGauss: number; // delta in mG (1 µT = 10 mG)
  level: 1 | 2 | 3 | 4 | 5; // LED stage
  timestamp: number;
}

export interface LedDefinition {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  subLabel: string;
  minMg: number;
  colorName: string;
  offColor: string;
  onColor: string;
  glowColor: string;
  textColor: string;
}

export const K2_LED_CONFIG: LedDefinition[] = [
  {
    level: 1,
    label: '1.5',
    subLabel: 'Normal',
    minMg: 0,
    colorName: 'green-dark',
    offColor: '#0b3d1f',
    onColor: '#00e676',
    glowColor: 'rgba(0, 230, 118, 0.85)',
    textColor: '#00e676',
  },
  {
    level: 2,
    label: '2.5',
    subLabel: 'Low',
    minMg: 1.5,
    colorName: 'green-light',
    offColor: '#1e3d0a',
    onColor: '#76ff03',
    glowColor: 'rgba(118, 255, 3, 0.85)',
    textColor: '#76ff03',
  },
  {
    level: 3,
    label: '10',
    subLabel: 'Caution',
    minMg: 2.5,
    colorName: 'yellow',
    offColor: '#423c03',
    onColor: '#ffea00',
    glowColor: 'rgba(255, 234, 0, 0.85)',
    textColor: '#ffea00',
  },
  {
    level: 4,
    label: '20',
    subLabel: 'High',
    minMg: 10,
    colorName: 'orange',
    offColor: '#422204',
    onColor: '#ff9100',
    glowColor: 'rgba(255, 145, 0, 0.85)',
    textColor: '#ff9100',
  },
  {
    level: 5,
    label: '20+',
    subLabel: 'Extreme',
    minMg: 20,
    colorName: 'red',
    offColor: '#420707',
    onColor: '#ff1744',
    glowColor: 'rgba(255, 23, 68, 0.95)',
    textColor: '#ff1744',
  },
];

export function getLedLevel(milliGauss: number): 1 | 2 | 3 | 4 | 5 {
  if (milliGauss >= 20.0) return 5;
  if (milliGauss >= 10.0) return 4;
  if (milliGauss >= 2.5) return 3;
  if (milliGauss >= 1.5) return 2;
  return 1;
}
