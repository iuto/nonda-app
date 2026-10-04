import React from 'react';
import { MedicationLog, AppSettings, BleedingLevel, CustomMedicationItem } from '../types/medication';
import { getDeviationStatus, calculateAverageTakenTime, calculateDiffMinutes } from '../utils/recommendation';
import { Calendar, Clock, ArrowLeft, Edit2, Pill, Activity, Sparkles, FileText } from 'lucide-react';

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
  let perfectCount = 0;

  if (recentDaysCount > 0 && averageTakenTime) {
    const sumDiff = recentTakenLogs.reduce((sum, l) => {
      const diff = Math.abs(calculateDiffMinutes(averageTakenTime, l.takenTime!));
      return sum + diff;
    }, 0);
    averageDiffMinutes = Math.round(sumDiff / recentDaysCount);
    perfectCount = recentTakenLogs.filter((l) => {
      const diff = Math.abs(calculateDiffMinutes(averageTakenTime, l.takenTime!));
      return diff <= 25;
    }).length;
  }

  const perfectRate = recentDaysCount > 0 ? Math.round((perfectCount / recentDaysCount) * 100) : 100;
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
        return { label: '体調: レベル1', bgClass: 'bg-orange-100 text-orange-800 border-orange-300' };
      case 'moderate':
        return { label: '体調: レベル2', bgClass: 'bg-orange-400 text-white border-orange-500' };
      case 'heavy':
        return { label: '体調: レベル3', bgClass: 'bg-orange-500 text-white border-orange-600' };
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* 画面ヘッダー */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToMain}
          className="text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center space-x-1.5 hover:bg-emerald-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>メインへ戻る</span>
        </button>
        <h2 className="text-base md:text-lg font-bold text-slate-800">
          詳細・服薬履歴
        </h2>
        <div className="w-20"></div>
      </div>

      {/* サマリーカード */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-emerald-100/90 shadow-sm shadow-emerald-500/5 grid grid-cols-3 gap-2.5 md:gap-4">
        {/* ① 普段飲む時間カード */}
        <div className="relative overflow-hidden rounded-2xl p-3 md:p-4 bg-gradient-to-b from-emerald-50/90 via-emerald-50/30 to-white border border-emerald-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] md:text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
              <span className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 stroke-[2.4]" />
              </span>
              <span className="truncate">普段飲む時間</span>
            </span>
          </div>

          <div className="my-1 text-center">
            {averageTakenTime ? (
              <div className="flex items-baseline justify-center space-x-0.5">
                <span className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">
                  {averageTakenTime}
                </span>
                <span className="text-[10px] md:text-xs font-bold text-emerald-700">頃</span>
              </div>
            ) : (
              <span className="text-sm md:text-base font-bold text-slate-400">記録なし</span>
            )}
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-emerald-100/70 text-center">
            <span className="text-[10px] md:text-[11px] font-medium text-emerald-700/80 truncate block">
              {recentDaysCount > 0 ? `直近${recentDaysCount}日間の平均服薬時刻` : '直近の平均服薬時刻'}
            </span>
          </div>
        </div>

        {/* ② 飲む時間のズレ & ペース維持率カード */}
        <div className="relative overflow-hidden rounded-2xl p-3 md:p-4 bg-gradient-to-b from-teal-50/90 via-teal-50/30 to-white border border-teal-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] md:text-xs font-bold text-teal-800 flex items-center space-x-1.5">
              <span className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 stroke-[2.4]" />
              </span>
              <span className="truncate">飲む時間のズレ</span>
            </span>
            {recentDaysCount > 0 && averageTakenTime && (
              <span className="hidden sm:inline-block text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200/60 shadow-xs">
                維持率 {perfectRate}%
              </span>
            )}
          </div>

          <div className="my-1 text-center">
            {recentDaysCount === 0 || !averageTakenTime ? (
              <span className="text-sm md:text-base font-bold text-slate-400">記録なし</span>
            ) : averageDiffMinutes === 0 ? (
              <span className="text-lg md:text-2xl font-black text-teal-800">ほぼピッタリ</span>
            ) : (
              <div className="flex items-baseline justify-center space-x-0.5">
                <span className="text-[10px] md:text-xs font-bold text-teal-700 mr-0.5">約</span>
                <span className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">
                  {averageDiffMinutes}
                </span>
                <span className="text-[10px] md:text-xs font-bold text-teal-700">分</span>
              </div>
            )}
          </div>

          {/* ミニ進捗バー & サブテキスト */}
          <div className="mt-1.5 pt-1.5 border-t border-teal-100/70 space-y-1">
            <div className="flex items-center justify-between text-[10px] md:text-[11px] text-teal-700/80 font-medium">
              <span className="truncate">直近の平均差</span>
              <span className="font-bold text-teal-800 text-[10px] md:text-[11px] shrink-0">
                {recentDaysCount > 0 && averageTakenTime ? `±${averageDiffMinutes}分` : '-'}
              </span>
            </div>
            {recentDaysCount > 0 && averageTakenTime && (
              <div className="w-full bg-teal-100/80 h-1 md:h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${perfectRate}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ③ 体調メモ・症状カード */}
        <div className="relative overflow-hidden rounded-2xl p-3 md:p-4 bg-gradient-to-b from-amber-50/90 via-orange-50/30 to-white border border-amber-200/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] md:text-xs font-bold text-amber-900 flex items-center space-x-1.5">
              <span className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <FileText className="w-3 h-3 md:w-3.5 md:h-3.5 stroke-[2.4]" />
              </span>
              <span className="truncate">体調メモ・症状</span>
            </span>
          </div>

          <div className="my-1 text-center">
            <div className="flex items-baseline justify-center space-x-0.5">
              <span className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">
                {bleedingDaysCount}
              </span>
              <span className="text-[10px] md:text-xs font-bold text-amber-800">日</span>
            </div>
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-amber-100/80 text-center">
            <span className="text-[10px] md:text-[11px] font-medium text-amber-800/80 truncate block">
              記録をつけた合計日数
            </span>
          </div>
        </div>
      </div>

      {/* 本日の体調メモ入力カード */}
      {todayLog && onSetNote && (
        <div className="bg-white rounded-3xl p-5 border border-amber-200/90 shadow-sm space-y-3 ring-1 ring-amber-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/70">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">本日の体調メモを記録</h3>
                <p className="text-[10px] text-slate-400">頭痛、吐き気、だるさなど気になった体調をリアルタイム保存</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/80">
              {formatDateLabel(todayLog.date)}
            </span>
          </div>
          <textarea
            value={todayLog.note || ''}
            onChange={(e) => onSetNote(e.target.value)}
            placeholder="本日の体調や症状をメモ（例: 朝から軽い頭痛、少し胃の不快感あり）"
            rows={2}
            className="w-full text-xs p-3 rounded-2xl bg-amber-50/40 border border-amber-200/70 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
          />
        </div>
      )}

      {/* 凡例ガイド */}
      <div className="bg-white/80 rounded-2xl p-3.5 border border-emerald-100 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-slate-700">凡例:</span>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block mr-1.5"></span>いつもの時間 (±25分)</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block mr-1.5"></span>少し早め/遅め</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block mr-1.5"></span>体調変化記録</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block mr-1.5"></span>💊 追加薬あり</span>
        </div>
      </div>

      {/* 日別ログ＆ズレ可視化リスト */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          服薬履歴・体調ログ
        </h3>

        {sortedLogs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 text-xs border border-emerald-100">
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
                  className={`bg-white rounded-2xl p-4 border shadow-xs transition-all space-y-3 ${
                    bleedingBadge || hasNote ? 'border-orange-200 ring-1 ring-orange-100' : 'border-slate-100 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-sm text-slate-800">
                        {formatDateLabel(log.date)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {bleedingBadge && (
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 shadow-xs ${bleedingBadge.bgClass}`}>
                          <Activity className="w-3 h-3" />
                          <span>{bleedingBadge.label}</span>
                        </span>
                      )}

                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${status.colorClass}`}>
                        {status.label}
                      </span>
                      <button
                        onClick={() => onEditLog(log)}
                        className="text-slate-400 hover:text-emerald-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        title="変更"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1 text-xs text-slate-600 bg-slate-50 rounded-xl p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>服薬時刻: <strong className="text-emerald-800 text-sm font-bold">{log.takenTime || '未服用'}</strong></span>
                      </div>
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
                            <div key={itemId} className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-emerald-800 font-semibold">
                              <span className="flex items-center space-x-1">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{itemName}</span>
                              </span>
                              <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md text-[11px]">
                                {time} 服用済み
                              </span>
                            </div>
                          );
                        });
                      }

                      if (isExtraTaken) {
                        return (
                          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-emerald-800 font-semibold">
                            <span className="flex items-center space-x-1">
                              <Pill className="w-3.5 h-3.5 text-emerald-600" />
                              <span>朝食後の追加薬</span>
                            </span>
                            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md text-[11px]">
                              {log.extraTakenTime} 服用済み
                            </span>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>

                  {/* 体調メモ表示 */}
                  {hasNote && (
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 space-y-1">
                      <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-[11px]">
                        <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>体調メモ</span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap pl-5 font-medium leading-relaxed">
                        {log.note}
                      </p>
                    </div>
                  )}

                  {isTaken && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>状態</span>
                        <span className={`font-bold ${status.textColor}`}>{status.label}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          status.level === 'perfect'
                            ? 'bg-emerald-500 w-full'
                            : status.level === 'minor'
                            ? 'bg-teal-500 w-3/4'
                            : 'bg-amber-400 w-1/2'
                        }`}></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
