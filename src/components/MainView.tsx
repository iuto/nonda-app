import React, { useState } from 'react';
import { CheckCircle2, Clock, Edit3, RotateCcw, Pill, AlertTriangle, Plus, Check, Activity, Sparkles, Trash2 } from 'lucide-react';
import { AppSettings, MedicationLog, BleedingLevel } from '../types/medication';
import { getDeviationStatus } from '../utils/recommendation';

interface MainViewProps {
  todayLog: MedicationLog;
  settings: AppSettings;
  onTakeNow: () => void;
  onCancelTake: () => void;
  onSetBleedingLevel: (level: BleedingLevel) => void;
  onToggleCustomItem: (itemId: string) => void;
  onAddCustomItem: (name: string) => void;
  onDeleteCustomItem: (itemId: string) => void;
  onSetRemainingPills: (count: number) => void;
  onOpenEditModal: () => void;
  onOpenResult: () => void;
}

export const MainView: React.FC<MainViewProps> = ({
  todayLog,
  settings,
  onTakeNow,
  onCancelTake,
  onSetBleedingLevel,
  onToggleCustomItem,
  onAddCustomItem,
  onDeleteCustomItem,
  onSetRemainingPills,
  onOpenEditModal,
}) => {
  const [isEditingPills, setIsEditingPills] = useState(false);
  const [inputPills, setInputPills] = useState(String(settings.remainingPills));
  
  // 自由追加用ステート
  const [customAddCount, setCustomAddCount] = useState('30');
  const [isCustomAdding, setIsCustomAdding] = useState(false);

  // 新しいお薬・サプリの自由追加ステート
  const [newItemName, setNewItemName] = useState('');
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);

  const customItems = settings.customItems || [{ id: 'extra-1', name: '朝食後の追加薬' }];

  const today = new Date();
  const dateFormatted = today.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const isTaken = !!todayLog.takenTime;
  const deviation = isTaken ? getDeviationStatus(todayLog.diffMinutes) : null;
  
  const currentBleedingLevel: BleedingLevel = todayLog.bleedingLevel ?? (todayLog.hasBleeding ? 'light' : 'none');

  const isLowPills = settings.remainingPills <= settings.alertThreshold;

  const handleSavePills = () => {
    const val = parseInt(inputPills, 10);
    if (!isNaN(val)) {
      onSetRemainingPills(val);
    }
    setIsEditingPills(false);
  };

  const handleCustomAddPills = () => {
    const val = parseInt(customAddCount, 10);
    if (!isNaN(val) && val > 0) {
      onSetRemainingPills(settings.remainingPills + val);
    }
    setIsCustomAdding(false);
  };

  const handleAddNewItem = () => {
    if (newItemName.trim()) {
      onAddCustomItem(newItemName.trim());
      setNewItemName('');
      setIsAddingNewItem(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 md:px-6 py-6 space-y-5">
      {/* ⚠️ 残薬警告カード */}
      {isLowPills && (
        <div className="bg-amber-500 text-white rounded-2xl p-4 shadow-lg shadow-amber-500/15 border border-amber-400 flex items-center justify-center space-x-2.5 text-center animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 text-amber-100 shrink-0" />
          <p className="font-bold text-sm md:text-base tracking-tight">
            薬の残りがあと <span className="text-lg md:text-xl font-black underline decoration-2">{settings.remainingPills}個</span> になりました！
          </p>
        </div>
      )}

      {/* 今日の日付 */}
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold border border-emerald-200/50">
          <span>{dateFormatted}</span>
        </div>
      </div>

      {/* 【最重要・主役】服薬アクションカード */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-emerald-100/80 flex flex-col items-center justify-center text-center space-y-5">
        {!isTaken ? (
          <>
            <div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200/80 inline-block">
                本日の服用がまだ完了していません
              </span>
            </div>

            {/* 超大型「飲んだ！」主役ボタン */}
            <button
              onClick={onTakeNow}
              className="w-full h-36 md:h-40 rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white font-black text-4xl md:text-5xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 flex items-center justify-center space-x-3.5 border-2 border-white/80 ring-4 ring-emerald-50"
            >
              <CheckCircle2 className="w-12 h-12 md:w-14 md:h-14 stroke-[2.5]" />
              <span>のんだ！</span>
            </button>

            <button
              onClick={onOpenEditModal}
              className="text-xs font-medium text-slate-500 hover:text-emerald-700 flex items-center space-x-1.5 py-1 px-3 rounded-xl hover:bg-emerald-50 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>時間を指定して記録</span>
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center space-y-3 py-1">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-center space-x-2">
                  <span className="text-4xl font-black text-slate-800 tracking-tight">
                    {todayLog.takenTime}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
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

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-100 w-full">
              <button
                onClick={onOpenEditModal}
                className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/70 px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>服薬時間を変更</span>
              </button>

              <button
                onClick={onCancelTake}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>間違えて押した（取り消す）</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 🌿 体調・副作用の記録 ＆ 朝食後の追加薬 カード */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">体調・副作用の記録</p>
          </div>
        </div>

        <div className="bg-slate-100/80 p-1 rounded-2xl grid grid-cols-4 gap-1">
          <button
            onClick={() => onSetBleedingLevel('none')}
            className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center ${
              currentBleedingLevel === 'none'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            なし
          </button>

          <button
            onClick={() => onSetBleedingLevel('light')}
            className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1 ${
              currentBleedingLevel === 'light'
                ? 'bg-amber-400 text-white shadow-xs'
                : 'text-amber-600 hover:bg-amber-50/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full fill-current bg-current"></span>
          </button>

          <button
            onClick={() => onSetBleedingLevel('moderate')}
            className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1 ${
              currentBleedingLevel === 'moderate'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span className="w-2 h-2 rounded-full bg-current"></span>
          </button>

          <button
            onClick={() => onSetBleedingLevel('heavy')}
            className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1 ${
              currentBleedingLevel === 'heavy'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span className="w-2 h-2 rounded-full bg-current"></span>
          </button>
        </div>

        {/* 追加のお薬・サプリの記録エリア */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">追加のお薬・サプリの記録</span>
          </div>

          <div className="space-y-2">
            {customItems.map((item) => {
              const takenTime = (todayLog.customLogs && todayLog.customLogs[item.id]) 
                || (item.id === 'extra-1' ? todayLog.extraTakenTime : null);
              const isItemTaken = !!takenTime;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100/90"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{item.name}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {!isItemTaken ? (
                      <button
                        onClick={() => onToggleCustomItem(item.id)}
                        className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>のんだ！</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-xl">
                          {takenTime} 服用済み
                        </span>
                        <button
                          onClick={() => onToggleCustomItem(item.id)}
                          className="text-[11px] text-slate-400 hover:text-rose-600 underline transition-colors"
                        >
                          取り消す
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => onDeleteCustomItem(item.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded-lg transition-colors ml-0.5"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 新しいお薬・サプリの追加ボタン／フォーム */}
          <div className="pt-1">
            {!isAddingNewItem ? (
              <button
                onClick={() => setIsAddingNewItem(true)}
                className="w-full py-2 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-800 font-bold border border-emerald-200/50 transition-all flex items-center justify-center space-x-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>新しいお薬・サプリを追加</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 animate-in fade-in pt-1">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="名前（例: マルチビタミン、鉄分）"
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNewItem();
                  }}
                />
                <button
                  onClick={handleAddNewItem}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  追加
                </button>
                <button
                  onClick={() => {
                    setIsAddingNewItem(false);
                    setNewItemName('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1"
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 💊 薬の残数管理・補充カード (自由に自由な個数を＋追加可能) */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Pill className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800">薬の残り個数</p>
          </div>

          {!isEditingPills ? (
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-black px-3.5 py-1 rounded-xl border ${
                isLowPills ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}>
                あと {settings.remainingPills} 個
              </span>
              <button
                onClick={() => {
                  setInputPills(String(settings.remainingPills));
                  setIsEditingPills(true);
                }}
                className="text-xs font-semibold text-slate-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="数字を編集"
              >
                <Edit3 className="w-3.5 h-3.5" />
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

        {/* 自由個数追加 */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
          {!isCustomAdding ? (
            <button
              onClick={() => setIsCustomAdding(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200/80 transition-all shadow-xs flex items-center space-x-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ 薬を追加</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 animate-in fade-in">
              <span className="text-xs font-bold text-slate-600">+</span>
              <input
                type="number"
                value={customAddCount}
                onChange={(e) => setCustomAddCount(e.target.value)}
                className="w-16 px-2 py-1 text-center font-bold text-sm rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="個数"
                min="1"
                autoFocus
              />
              <span className="text-xs text-slate-600">個</span>
              <button
                onClick={handleCustomAddPills}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              >
                追加
              </button>
              <button
                onClick={() => setIsCustomAdding(false)}
                className="text-xs text-slate-400 hover:text-slate-600 px-1"
              >
                キャンセル
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
