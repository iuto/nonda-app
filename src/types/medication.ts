export type BleedingLevel = 'none' | 'light' | 'moderate' | 'heavy';

export interface CustomMedicationItem {
  id: string;
  name: string;
}

export interface MedicationLog {
  id: string;
  date: string; // YYYY-MM-DD
  targetTime: string; // HH:mm
  takenTime: string | null; // HH:mm (1回目/定時)
  takenAt: string | null; // ISO timestamp
  diffMinutes: number | null; // targetTimeとの差分（分）
  hasBleeding?: boolean; // 出血の有無 (旧互換用)
  bleedingLevel?: BleedingLevel; // 3段階の出血程度 ('none' | 'light' | 'moderate' | 'heavy')
  extraTakenTime?: string | null; // 朝食後追加薬の服用時刻 (互換用)
  extraTakenAt?: string | null;
  customLogs?: Record<string, string | null>; // itemId -> 服用時刻 (HH:mm)
  note?: string;
}

export interface AppSettings {
  medicationName: string;
  targetTime: string;
  toleranceMinutes: number;
  remainingPills: number;
  alertThreshold: number;
  customItems?: CustomMedicationItem[];
}

export type DeviationLevel = 'perfect' | 'minor' | 'moderate' | 'major' | 'missed';

export interface DeviationStatus {
  level: DeviationLevel;
  label: string;
  colorClass: string;
  badgeBg: string;
  textColor: string;
  borderClass: string;
}
