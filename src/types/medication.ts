export interface MedicationLog {
  id: string;
  date: string; // YYYY-MM-DD
  targetTime: string; // HH:mm
  takenTime: string | null; // HH:mm (1回目/定時)
  takenAt: string | null; // ISO timestamp
  diffMinutes: number | null; // targetTimeとの差分（分）
  hasBleeding?: boolean; // 副作用：出血の有無
  extraTakenTime?: string | null; // 副作用時の朝食後追加薬の服用時刻
  extraTakenAt?: string | null;
  note?: string;
}

export interface AppSettings {
  medicationName: string;
  targetTime: string;
  toleranceMinutes: number;
  remainingPills: number; // 現在の薬の残数 (個/錠)
  alertThreshold: number; // 残量警告アラートを出す個数 (デフォルト: 10)
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
