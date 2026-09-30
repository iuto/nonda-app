import { DeviationStatus, MedicationLog } from '../types/medication';

export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  let normalized = minutes % (24 * 60);
  if (normalized < 0) normalized += 24 * 60;
  
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function calculateDiffMinutes(targetTime: string, takenTime: string): number {
  const targetMins = timeToMinutes(targetTime);
  const takenMins = timeToMinutes(takenTime);
  
  let diff = takenMins - targetMins;
  if (diff > 12 * 60) diff -= 24 * 60;
  if (diff < -12 * 60) diff += 24 * 60;
  
  return diff;
}

export function getDeviationStatus(diffMinutes: number | null): DeviationStatus {
  if (diffMinutes === null) {
    return {
      level: 'missed',
      label: '未服用',
      colorClass: 'bg-slate-100 text-slate-500 border-slate-200',
      badgeBg: 'bg-slate-100',
      textColor: 'text-slate-600',
      borderClass: 'border-slate-300'
    };
  }

  const absDiff = Math.abs(diffMinutes);

  if (absDiff <= 30) {
    return {
      level: 'perfect',
      label: 'ほぼ時間通り',
      colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      badgeBg: 'bg-emerald-500 text-white',
      textColor: 'text-emerald-700',
      borderClass: 'border-emerald-300'
    };
  }

  if (absDiff <= 60) {
    return {
      level: 'minor',
      label: `少しズレ (${diffMinutes > 0 ? '+' : ''}${diffMinutes}分)`,
      colorClass: 'bg-teal-100 text-teal-800 border-teal-200',
      badgeBg: 'bg-teal-500 text-white',
      textColor: 'text-teal-700',
      borderClass: 'border-teal-300'
    };
  }

  return {
    level: 'moderate',
    label: `時間のズレ (${diffMinutes > 0 ? '+' : ''}${diffMinutes}分)`,
    colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeBg: 'bg-emerald-600 text-white',
    textColor: 'text-emerald-800',
    borderClass: 'border-emerald-200'
  };
}

export interface RecommendationResult {
  recommendedTime: string | null;
  hasData: boolean;
  message?: string;
}

/**
 * 明日の推奨服薬時間を計算
 * データがまだ存在しない場合は hasData: false を返す
 */
export function calculateNextRecommendation(
  logs: MedicationLog[],
  todayLog: MedicationLog | undefined,
  defaultTargetTime: string
): RecommendationResult {
  // 服薬実績のある全ログ
  const takenLogs = logs.filter((l) => l.takenTime !== null && l.diffMinutes !== null);

  // 実績データが1件もない場合
  if (takenLogs.length === 0) {
    return {
      recommendedTime: null,
      hasData: false,
      message: 'データがないため表示できません',
    };
  }

  const baseTargetMins = timeToMinutes(defaultTargetTime);

  // 今日まだ飲んでいない場合は直近の実績ログを参考にする
  const latestLog = (todayLog && todayLog.takenTime) ? todayLog : takenLogs[0];

  if (!latestLog || !latestLog.takenTime || latestLog.diffMinutes === null) {
    return {
      recommendedTime: defaultTargetTime,
      hasData: true,
    };
  }

  const diff = latestLog.diffMinutes;
  const absDiff = Math.abs(diff);

  if (absDiff <= 30) {
    return {
      recommendedTime: defaultTargetTime,
      hasData: true,
    };
  }

  if (diff > 0) {
    const recMins = baseTargetMins + Math.round(diff * 0.4);
    return {
      recommendedTime: minutesToTime(recMins),
      hasData: true,
    };
  }

  const recMins = baseTargetMins + Math.round(diff * 0.5);
  return {
    recommendedTime: minutesToTime(recMins),
    hasData: true,
  };
}
