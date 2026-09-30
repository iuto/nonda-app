import React, { useState } from 'react';
import { CheckCircle2, Clock, Sparkles, Edit3, RotateCcw, Droplet, Pill, AlertTriangle, Plus, Check } from 'lucide-react';
import { AppSettings, MedicationLog } from '../types/medication';
import { calculateNextRecommendation, getDeviationStatus } from '../utils/recommendation';

interface MainViewProps {
  logs: MedicationLog[];
  todayLog: MedicationLog;
  settings: AppSettings;
  onTakeNow: () => void;
  onCancelTake: () => void;
  onToggleBleeding: () => void;
  onTakeExtra: () => void;
  onCancelTakeExtra: () => void;
  onSetRemainingPills: (count: number) => void;
  onOpenEditModal: () => void;
  onOpenResult: () => void;
}

export const MainView: React.FC<MainViewProps> = ({
  logs,
  todayLog,
  settings,
  onTakeNow,
  onCancelTake,
  onToggleBleeding,
  onTakeExtra,
  onCancelTakeExtra,
  onSetRemainingPills,
  onOpenEditModal,
}) => {
  const [isEditingPills, setIsEditingPills] = useState(false);
  const [inputPills, setInputPills] = useState(String(settings.remainingPills));

  const today = new Date();
  const dateFormatted = today.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const isTaken = !!todayLog.takenTime;
  const deviation = isTaken ? getDeviationStatus(todayLog.diffMinutes) : null;
  const recommendation = calculateNextRecommendation(logs, todayLog, settings.targetTime);
  const hasBleeding = !!todayLog.hasBleeding;
  const isExtraTaken = !!todayLog.extraTakenTime;

  const isLowPills = settings.remainingPills <= settings.alertThreshold;

  const handleSavePills = () => {
    const val = parseInt(inputPills, 10);
    if (!isNaN(val)) {
      onSetRemainingPills(val);
    }
    setIsEditingPills(false);
  };

  const handleAddQuickPills = (addCount: number) => {
    onSetRemainingPills(settings.remainingPills + addCount);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-5">
      {/* ⚠️ 残薬警告カード (シンプルに「薬の残りがあと〇個になりました！」のみ) */}
      {isLowPills && (
        <div className="bg-amber-500 text-white rounded-3xl p-4 md:p-5 shadow-md shadow-amber-500/20 border-2 border-amber-300 flex items-center justify-center space-x-3 text-center animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-6 h-6 text-white shrink-0" />
          <p className="font-black text-base md:text-lg tracking-tight">
            薬の残りがあと <span className="text-xl md:text-2xl underline decoration-2">{settings.remainingPills}個</span> になりました！
          </p>
        </div>
      )}

      {/* 今日の日付と目標服薬時間 */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold">
          <span>{dateFormatted}</span>
          <span className="text-emerald-400">|</span>
          <span>目標 {todayLog.targetTime}</span>
        </div>
      </div>

      {/* 【最重要・主役】服薬アクションカード */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border-2 border-emerald-200/80 flex flex-col items-center justify-center text-center space-y-5">
        {!isTaken ? (
          <>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                本日の服用がまだ完了していません
              </span>
            </div>

            {/* 超大型「飲んだ！」主役ボタン */}
            <button
              onClick={onTakeNow}
              className="w-full h-36 md:h-44 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-black text-4xl md:text-5xl shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-4 border-4 border-white ring-4 ring-emerald-100"
            >
              <CheckCircle2 className="w-14 h-14 md:w-16 md:h-16" />
              <span>飲んだ！</span>
            </button>

            {/* 時間を指定して記録 */}
            <button
              onClick={onOpenEditModal}
              className="text-xs text-slate-500 hover:text-emerald-700 flex items-center space-x-1.5 py-1 px-3 rounded-xl hover:bg-emerald-50 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>時間を指定して記録</span>
            </button>
          </>
        ) : (
          <>
            {/* 服用完了時 */}
            <div className="flex flex-col items-center space-y-3 py-1">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-center space-x-2">
                  <span className="text-4xl font-black text-emerald-950">
                    {todayLog.takenTime}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    服用済み
                  </span>
                </div>
                {deviation && (
                  <div>
                    <span className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full border ${deviation.colorClass}`}>
                      <Clock className="w-3 h-3 mr-1" />
                      {deviation.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 操作ボタン */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-100 w-full">
              <button
                onClick={onOpenEditModal}
                className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>服薬時間を変更</span>
              </button>

              <button
                onClick={onCancelTake}
                className="text-xs font-semibold text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>間違えて押した（取り消す）</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 💊 薬の残数管理・補充カード */}
      <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">薬の残り個数</p>
              <p className="text-[11px] text-slate-500">飲んだ分だけ自動で減ります</p>
            </div>
          </div>

          {!isEditingPills ? (
            <div className="flex items-center space-x-2">
              <span className={`text-base font-black px-3 py-1 rounded-xl border ${
                isLowPills ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-950 border-emerald-200'
              }`}>
                あと {settings.remainingPills} 個
              </span>
              <button
                onClick={() => {
                  setInputPills(String(settings.remainingPills));
                  setIsEditingPills(true);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                title="数字を編集"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5">
              <input
                type="number"
                value={inputPills}
                onChange={(e) => setInputPills(e.target.value)}
                className="w-16 px-2 py-1 text-center font-bold text-sm rounded-lg border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                min="0"
              />
              <span className="text-xs text-slate-600">個</span>
              <button
                onClick={handleSavePills}
                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">新しい薬をもらってきたら:</span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handleAddQuickPills(14)}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition-colors flex items-center space-x-0.5 text-[11px]"
            >
              <Plus className="w-3 h-3" />
              <span>14個追加</span>
            </button>
            <button
              onClick={() => handleAddQuickPills(28)}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition-colors flex items-center space-x-0.5 text-[11px]"
            >
              <Plus className="w-3 h-3" />
              <span>28個追加</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🩸 副作用・出血の記録 */}
      <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              hasBleeding ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-400'
            }`}>
              <Droplet className="w-4 h-4 fill-current" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">副作用・出血の記録</p>
              <p className="text-[11px] text-slate-500">今日、出血の症状はありましたか？</p>
            </div>
          </div>

          <button
            onClick={onToggleBleeding}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 ${
              hasBleeding
                ? 'bg-rose-500 text-white border border-rose-600 shadow-rose-200'
                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>{hasBleeding ? '出血あり (記録中)' : 'なし'}</span>
          </button>
        </div>

        <div className="pt-2 border-t border-rose-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Pill className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-bold text-slate-700">朝食後の追加薬</p>
          </div>

          {!isExtraTaken ? (
            <button
              onClick={onTakeExtra}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>飲んだ！</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                {todayLog.extraTakenTime} 服用済み
              </span>
              <button
                onClick={onCancelTakeExtra}
                className="text-[11px] text-slate-400 hover:text-rose-600 underline"
              >
                取り消す
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 明日は何時頃飲んだほうがいい？ */}
      <div className="bg-white/90 rounded-2xl p-4 border border-emerald-100/80 text-slate-700 shadow-xs flex items-center justify-between px-5">
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-600">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>明日の目安時間</span>
        </div>
        <div>
          {recommendation.hasData && recommendation.recommendedTime ? (
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-emerald-900">
                {recommendation.recommendedTime}
              </span>
              <span className="text-xs text-slate-500">頃</span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              データがないため表示できません
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
