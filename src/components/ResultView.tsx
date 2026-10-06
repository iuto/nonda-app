import React from 'react';
import { MedicationLog, AppSettings, BleedingLevel, CustomMedicationItem } from '../types/medication';
import { getDeviationStatus, calculateAverageTakenTime, calculateDiffMinutes } from '../utils/recommendation';
import { RhythmChart } from './RhythmChart';
import { Clock, ArrowLeft, Edit2, Pill, Activity, Sparkles, FileText } from 'lucide-react';

interface ResultViewProps {
  logs: MedicationLog[];
  settings?: AppSettings;
  todayLog?: MedicationLog;
  onBackToMain: () => void;
  onEditLog: (log: MedicationLog) => void;
  onSetNote?: (note: string) => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  logs,
  settings,
  todayLog,
  onBackToMain,
  onEditLog,
  onSetNote,
}) => {
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  const takenLogs = logs.filter((l) => l.takenTime !== null);

  // 直近最大7日分の服薬実績ログ
  const recentTakenLogs = [...takenLogs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  const recentDaysCount = recentTakenLogs.length;

  const averageTakenTime = calculateAverageTakenTime(logs, 7);

  let averageDiffMinutes = 0;

  if (recentDaysCount > 0 && averageTakenTime) {
    const sumDiff = recentTakenLogs.reduce((sum, l) => {
      const diff = Math.abs(calculateDiffMinutes(averageTakenTime, l.takenTime!));
      return sum + diff;
    }, 0);
    averageDiffMinutes = Math.round(sumDiff / recentDaysCount);
  }

  const bleedingDaysCount = logs.filter((l) => (l.bleedingLevel && l.bleedingLevel !== 'none') || l.hasBleeding || (l.note && l.note.trim() !== '')).length;

  const formatDateLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()];
    return `${Number(m)}/${Number(d)} (${dayOfWeek})`;
  };

  const getBleedingBadge = (level: BleedingLevel | undefined, legacyHasBleeding?: boolean) => {
    const activeLevel = level ?? (legacyHasBleeding ? 'light' : 'none');
    switch (activeLevel) {
      case 'light':
        return { label: '体調: レベル1', bgClass: 'bg-orange-50 text-orange-700 border-orange-200/80' };
      case 'moderate':
        return { label: '体調: レベル2', bgClass: 'bg-orange-500 text-white border-orange-600' };
      case 'heavy':
        return { label: '体調: レベル3', bgClass: 'bg-rose-500 text-white border-rose-600' };
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* 画面ヘッダー (Linear / Vercel風) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/60">
        <div>
          <button
            onClick={onBackToMain}
            className="group inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2 space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>ホームへ戻る</span>
          </button>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            服薬ログ・インサイト
          </h1>
        </div>
      </div>

      {/* サマリーKPIカード (Modern Bento Grid: 余計な注釈テキストを全廃) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {/* ① 普段飲む時間 */}
        <div className="group relative bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 tracking-wide">普段飲む時間</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            {averageTakenTime ? (
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-mono">
                  {averageTakenTime}
                </span>
                <span className="text-xs font-bold text-slate-400">頃</span>
              </div>
            ) : (
              <span className="text-base font-bold text-slate-400">記録なし</span>
            )}
          </div>
        </div>

        {/* ② 飲む時間のズレ */}
        <div className="group relative bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 tracking-wide">飲む時間のズレ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            {recentDaysCount === 0 || !averageTakenTime ? (
              <span className="text-base font-bold text-slate-400">記録なし</span>
            ) : averageDiffMinutes <= 30 ? (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-2xl md:text-3xl font-black text-emerald-600 tracking-tight">
                  問題なし
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-mono">
                  {averageDiffMinutes === 0 ? 'ピッタリ (30分以内)' : `約${averageDiffMinutes}分ズレ (30分以内)`}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <div className="flex items-baseline space-x-0.5">
                  <span className="text-xs font-bold text-amber-500 mr-0.5">約</span>
                  <span className="text-2xl md:text-3xl font-black text-amber-600 tracking-tight font-mono">
                    {averageDiffMinutes}
                  </span>
                  <span className="text-xs font-bold text-amber-500">分ズレ</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70 font-mono">
                  普段よりズレあり
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ③ 体調記録日数 */}
        <div className="group relative bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 hover:border-amber-300 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 tracking-wide">体調記録日数</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-mono">
                {bleedingDaysCount}
              </span>
              <span className="text-xs font-bold text-slate-400">日</span>
            </div>
          </div>
        </div>
      </div>

      {/* 服薬リズム推移グラフ */}
      <RhythmChart logs={logs} averageTakenTime={averageTakenTime} />

      {/* 本日の体調メモ入力カード (Craft / Notion風) */}
      {todayLog && onSetNote && (
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-xs space-y-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200/60">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">本日の体調メモ</h3>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100/90 border border-slate-200/60 px-2.5 py-1 rounded-lg">
              {formatDateLabel(todayLog.date)}
            </span>
          </div>
          <textarea
            value={todayLog.note || ''}
            onChange={(e) => onSetNote(e.target.value)}
            placeholder="本日の体調や気になる症状をメモ（例: 朝から軽い頭痛、少し胃の不快感あり）"
            rows={2}
            className="w-full text-xs p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-400 transition-all resize-none leading-relaxed"
          />
        </div>
      )}

      {/* 服薬ログ一覧セクションヘッダー (余計な凡例を全廃) */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            服薬ログ一覧
          </h2>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full font-mono">
            {sortedLogs.length}件
          </span>
        </div>
      </div>

      {/* 服薬履歴カードリスト (Linear / Apple Health風) */}
      {sortedLogs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200/80">
          まだ服薬履歴がありません。「のんだ！」ボタンを押して記録をスタートしましょう！
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sortedLogs.map((log) => {
            const isTaken = !!log.takenTime;
            const diff = (isTaken && averageTakenTime) ? calculateDiffMinutes(averageTakenTime, log.takenTime!) : null;
            const status = isTaken ? getDeviationStatus(diff) : getDeviationStatus(null);
            const bleedingBadge = getBleedingBadge(log.bleedingLevel, log.hasBleeding);
            const isExtraTaken = !!log.extraTakenTime;
            const hasNote = !!(log.note && log.note.trim() !== '');

            return (
              <div
                key={log.id}
                className={`bg-white rounded-2xl p-4 border shadow-xs hover:shadow-md transition-all space-y-3 ${
                  bleedingBadge || hasNote
                    ? 'border-amber-200/80 ring-1 ring-amber-50'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      !isTaken
                        ? 'bg-slate-300'
                        : status.level === 'perfect'
                        ? 'bg-emerald-500 ring-2 ring-emerald-100'
                        : status.level === 'minor'
                        ? 'bg-teal-500 ring-2 ring-teal-100'
                        : 'bg-amber-500 ring-2 ring-amber-100'
                    }`} />
                    <span className="font-bold text-sm text-slate-900 tracking-tight">
                      {formatDateLabel(log.date)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {bleedingBadge && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border flex items-center space-x-1 ${bleedingBadge.bgClass}`}>
                        <Activity className="w-3 h-3" />
                        <span>{bleedingBadge.label}</span>
                      </span>
                    )}

                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${status.colorClass}`}>
                      {status.label}
                    </span>
                    <button
                      onClick={() => onEditLog(log)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                      title="変更"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/80 rounded-xl px-3 py-2 border border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500">服薬時刻:</span>
                    <strong className={`font-mono font-bold text-sm ${isTaken ? 'text-slate-900' : 'text-slate-400 font-normal italic'}`}>
                      {log.takenTime || '未服用'}
                    </strong>
                  </div>

                  {isTaken && diff !== null && (
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {diff === 0 ? 'ピッタリ' : (diff > 0 ? `+${diff}分` : `${diff}分`)}
                    </span>
                  )}
                </div>

                {/* 追加のお薬・サプリログ */}
                {(() => {
                  const entries = Object.entries(log.customLogs || {});
                  if (entries.length > 0) {
                    return entries.map(([itemId, time]) => {
                      if (!time) return null;
                      const itemObj = settings?.customItems?.find((i: CustomMedicationItem) => i.id === itemId);
                      const savedName = log.customItemNames?.[itemId];
                      const itemName = itemObj ? itemObj.name : (savedName || (itemId === 'extra-1' ? '朝食後の追加薬' : '追加のお薬・サプリ'));
                      return (
                        <div key={itemId} className="flex items-center justify-between text-xs text-emerald-900 bg-emerald-50/60 rounded-xl px-3 py-1.5 border border-emerald-100/60">
                          <span className="flex items-center space-x-1.5 font-medium">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>{itemName}</span>
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-700">
                            {time} 服用
                          </span>
                        </div>
                      );
                    });
                  }

                  if (isExtraTaken) {
                    return (
                      <div className="flex items-center justify-between text-xs text-emerald-900 bg-emerald-50/60 rounded-xl px-3 py-1.5 border border-emerald-100/60">
                        <span className="flex items-center space-x-1.5 font-medium">
                          <Pill className="w-3 h-3 text-emerald-600" />
                          <span>朝食後の追加薬</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-700">
                          {log.extraTakenTime} 服用
                        </span>
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* 体調メモ表示 */}
                {hasNote && (
                  <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-2.5 space-y-1">
                    <div className="flex items-center space-x-1.5 text-amber-800 font-bold text-xs">
                      <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>体調メモ</span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap pl-4 font-normal leading-relaxed">
                      {log.note}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

