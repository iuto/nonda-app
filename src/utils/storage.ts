import { AppSettings, MedicationLog } from '../types/medication';

const STORAGE_KEY_LOGS = 'medtime_logs_v1';
const STORAGE_KEY_SETTINGS = 'medtime_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  medicationName: '毎日の決まった薬',
  targetTime: '08:00',
  toleranceMinutes: 30,
  remainingPills: 14, // デフォルト残数
  alertThreshold: 10,  // デフォルト閾値 (10個以下でアラート)
  customItems: [
    { id: 'extra-1', name: '朝食後の追加薬' }
  ],
};

export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      customItems: parsed.customItems || DEFAULT_SETTINGS.customItems,
    };
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function loadLogs(): MedicationLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (!raw) {
      saveLogs([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    const cleanLogs = parsed.filter((l: MedicationLog) => !l.id.startsWith('demo-'));
    return cleanLogs;
  } catch (e) {
    console.error('Failed to load logs from localStorage', e);
    return [];
  }
}

export function saveLogs(logs: MedicationLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save logs to localStorage', e);
  }
}

export function getOrCreateLogForDate(dateStr: string, targetTime: string, logs: MedicationLog[]): MedicationLog {
  const existing = logs.find((l) => l.date === dateStr);
  if (existing) return existing;

  return {
    id: `log-${dateStr}-${Date.now()}`,
    date: dateStr,
    targetTime: targetTime,
    takenTime: null,
    takenAt: null,
    diffMinutes: null,
  };
}
