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

/**
 * 服薬実績ログから直近数日（最大recentLimit日分）の平均服用時刻（HH:mm）を算出（円周平均で日付跨ぎにも対応）
 */
export function calculateAverageTakenTime(logs: MedicationLog[], recentLimit: number = 7): string | null {
  const sortedTakenLogs = [...logs]
    .filter((l) => !!l.takenTime)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, recentLimit);

  if (sortedTakenLogs.length === 0) return null;

  const takenTimes = sortedTakenLogs.map((l) => l.takenTime!);

  let sinSum = 0;
  let cosSum = 0;

  for (const t of takenTimes) {
    const mins = timeToMinutes(t);
    const rad = (mins / 1440) * 2 * Math.PI;
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  }

  let avgRad = Math.atan2(sinSum / takenTimes.length, cosSum / takenTimes.length);
  if (avgRad < 0) avgRad += 2 * Math.PI;

  const avgMinutes = Math.round((avgRad / (2 * Math.PI)) * 1440) % 1440;
  return minutesToTime(avgMinutes);
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

  if (absDiff <= 25) {
    return {
      level: 'perfect',
      label: 'いつもの時間',
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
      badgeBg: 'bg-emerald-500 text-white',
      textColor: 'text-emerald-700',
      borderClass: 'border-emerald-200'
    };
  }

  if (absDiff <= 60) {
    const dirLabel = diffMinutes > 0 ? `少し遅め (+${diffMinutes}分)` : `少し早め (${diffMinutes}分)`;
    return {
      level: 'minor',
      label: dirLabel,
      colorClass: 'bg-teal-50 text-teal-700 border-teal-200/70',
      badgeBg: 'bg-teal-500 text-white',
      textColor: 'text-teal-700',
      borderClass: 'border-teal-200'
    };
  }

  const dirLabel = diffMinutes > 0 ? `普段より遅め (+${diffMinutes}分)` : `普段より早め (${diffMinutes}分)`;
  return {
    level: 'moderate',
    label: dirLabel,
    colorClass: 'bg-amber-50 text-amber-700 border-amber-200/70',
    badgeBg: 'bg-amber-500 text-white',
    textColor: 'text-amber-700',
    borderClass: 'border-amber-200'
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
