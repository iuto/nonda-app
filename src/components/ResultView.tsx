import React from 'react';
import { MedicationLog, AppSettings } from '../types/medication';
import { getDeviationStatus } from '../utils/recommendation';
import { Calendar, Clock, ArrowLeft, Edit2, Droplet, Pill } from 'lucide-react';

interface ResultViewProps {
  logs: MedicationLog[];
  settings?: AppSettings;
  onBackToMain: () => void;
  onEditLog: (log: MedicationLog) => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  logs,
  onBackToMain,
  onEditLog,
}) => {
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  const takenLogs = logs.filter((l) => l.takenTime !== null && l.diffMinutes !== null);
  const totalTaken = takenLogs.length;

  let averageDiffMinutes = 0;
  let perfectCount = 0;

  if (totalTaken > 0) {
    const sumDiff = takenLogs.reduce((sum, l) => sum + Math.abs(l.diffMinutes || 0), 0);
    averageDiffMinutes = Math.round(sumDiff / totalTaken);
    perfectCount = takenLogs.filter((l) => Math.abs(l.diffMinutes || 0) <= 30).length;
  }

  const perfectRate = totalTaken > 0 ? Math.round((perfectCount / totalTaken) * 100) : 0;
  const bleedingDaysCount = logs.filter((l) => l.hasBleeding).length;

  const formatDateLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()];
    return `${Number(m)}/${Number(d)} (${dayOfWeek})`;
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
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm grid grid-cols-3 gap-4">
        <div className="bg-emerald-50/80 rounded-2xl p-4 text-center space-y-0.5 border border-emerald-100">
          <p className="text-xs font-semibold text-emerald-700">平均ズレ時間</p>
          <p className="text-2xl md:text-3xl font-black text-emerald-950">
            ±{averageDiffMinutes}<span className="text-xs font-bold text-emerald-700">分</span>
          </p>
          <p className="text-[10px] md:text-xs text-emerald-600">目標との平均偏差</p>
        </div>

        <div className="bg-emerald-50/80 rounded-2xl p-4 text-center space-y-0.5 border border-emerald-100">
          <p className="text-xs font-semibold text-emerald-700">定刻服用率</p>
          <p className="text-2xl md:text-3xl font-black text-emerald-950">
            {perfectRate}<span className="text-xs font-bold text-emerald-700">%</span>
          </p>
          <p className="text-[10px] md:text-xs text-emerald-600">±30分以内の割合</p>
        </div>

        <div className="bg-rose-50/80 rounded-2xl p-4 text-center space-y-0.5 border border-rose-100">
          <p className="text-xs font-semibold text-rose-700">出血があった日</p>
          <p className="text-2xl md:text-3xl font-black text-rose-950">
            {bleedingDaysCount}<span className="text-xs font-bold text-rose-700">日</span>
          </p>
          <p className="text-[10px] md:text-xs text-rose-600">副作用の記録合計</p>
        </div>
      </div>

      {/* 凡例ガイド */}
      <div className="bg-white/80 rounded-2xl p-3.5 border border-emerald-100 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-slate-700">凡例:</span>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block mr-1.5"></span>時間通り</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block mr-1.5"></span>🩸 出血あり</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block mr-1.5"></span>💊 追加薬あり</span>
        </div>
      </div>

      {/* 日別ログ＆ズレ可視化リスト */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          服薬履歴・副作用ログ
        </h3>

        {sortedLogs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 text-xs border border-emerald-100">
            まだ服薬履歴がありません。「飲んだ！」ボタンを押して記録をスタートしましょう！
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {sortedLogs.map((log) => {
              const isTaken = !!log.takenTime;
              const status = isTaken ? getDeviationStatus(log.diffMinutes) : getDeviationStatus(null);
              const diff = log.diffMinutes || 0;
              const absDiff = Math.abs(diff);
              const barWidthPercent = isTaken ? Math.min(100, Math.max(8, (absDiff / 120) * 100)) : 0;
              const hasBleeding = !!log.hasBleeding;
              const isExtraTaken = !!log.extraTakenTime;

              return (
                <div
                  key={log.id}
                  className={`bg-white rounded-2xl p-4 border shadow-xs transition-all space-y-3 ${
                    hasBleeding ? 'border-rose-200 ring-1 ring-rose-100' : 'border-slate-100 hover:border-emerald-200'
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
                      {/* 出血ありバッジ */}
                      {hasBleeding && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white flex items-center space-x-1 shadow-xs">
                          <Droplet className="w-3 h-3 fill-current" />
                          <span>出血</span>
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
                        <span>目標: <strong className="text-slate-700">{log.targetTime}</strong></span>
                      </div>
                      <div>
                        {isTaken ? (
                          <span>定時服用: <strong className="text-emerald-800 text-sm font-bold">{log.takenTime}</strong></span>
                        ) : (
                          <span className="text-slate-400 italic">未服用</span>
                        )}
                      </div>
                    </div>

                    {/* 追加薬の服用状況 */}
                    {isExtraTaken && (
                      <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-emerald-800 font-semibold">
                        <span className="flex items-center space-x-1">
                          <Pill className="w-3.5 h-3.5 text-emerald-600" />
                          <span>朝食後の追加薬</span>
                        </span>
                        <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md text-[11px]">
                          {log.extraTakenTime} 服用済み
                        </span>
                      </div>
                    )}
                  </div>

                  {isTaken && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>偏差</span>
                        <span>
                          {diff === 0 ? 'ピッタリ' : `${diff > 0 ? '+' : ''}${diff}分`}
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            status.level === 'perfect'
                              ? 'bg-emerald-500'
                              : status.level === 'minor'
                              ? 'bg-teal-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${barWidthPercent}%` }}
                        ></div>
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
