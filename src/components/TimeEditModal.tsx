import React, { useState, useEffect } from 'react';
import { MedicationLog, BleedingLevel } from '../types/medication';
import { X, Clock, Check, RotateCcw, Pill, Droplet } from 'lucide-react';

interface TimeEditModalProps {
  isOpen: boolean;
  log: MedicationLog | null;
  onClose: () => void;
  onSave: (
    date: string,
    takenTime: string | null,
    bleedingLevel?: BleedingLevel,
    extraTakenTime?: string | null
  ) => void;
}

export const TimeEditModal: React.FC<TimeEditModalProps> = ({
  isOpen,
  log,
  onClose,
  onSave,
}) => {
  const [time, setTime] = useState<string>('08:00');
  const [bleedingLevel, setBleedingLevel] = useState<BleedingLevel>('none');
  const [extraTime, setExtraTime] = useState<string>('');
  const [isExtraEnabled, setIsExtraEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (log) {
      if (log.takenTime) {
        setTime(log.takenTime);
      } else {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setTime(`${hh}:${mm}`);
      }
      setBleedingLevel(log.bleedingLevel ?? (log.hasBleeding ? 'light' : 'none'));
      if (log.extraTakenTime) {
        setExtraTime(log.extraTakenTime);
        setIsExtraEnabled(true);
      } else {
        setExtraTime('09:00');
        setIsExtraEnabled(false);
      }
    }
  }, [log]);

  if (!isOpen || !log) return null;

  const handleSetNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setTime(`${hh}:${mm}`);
  };

  const handleSave = () => {
    const finalExtraTime = isExtraEnabled ? extraTime : null;
    onSave(log.date, time, bleedingLevel, finalExtraTime);
    onClose();
  };

  const handleReset = () => {
    onSave(log.date, null, bleedingLevel, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-5 border border-emerald-100 animate-in fade-in zoom-in-95 duration-150">
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-800">
              服薬・副作用の記録
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            対象日: <span className="font-semibold text-slate-700">{log.date}</span>
          </p>

          {/* 定時服薬の時刻入力 */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              定時薬の服用時刻
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-center text-2xl font-bold p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={handleSetNow}
              className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors flex items-center justify-center space-x-1"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>「いま」の時刻を入力</span>
            </button>
          </div>

          {/* 出血の程度選択 (文字なし) */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              出血の症状の程度
            </label>
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => setBleedingLevel('none')}
                className={`py-2 rounded-xl text-xs font-bold border ${
                  bleedingLevel === 'none'
                    ? 'bg-slate-700 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                なし
              </button>
              <button
                type="button"
                onClick={() => setBleedingLevel('light')}
                className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center ${
                  bleedingLevel === 'light'
                    ? 'bg-rose-500 text-white border-rose-600'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <Droplet className="w-4 h-4 fill-current" />
              </button>
              <button
                type="button"
                onClick={() => setBleedingLevel('moderate')}
                className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-0.5 ${
                  bleedingLevel === 'moderate'
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                <Droplet className="w-3.5 h-3.5 fill-current" />
                <Droplet className="w-3.5 h-3.5 fill-current" />
              </button>
              <button
                type="button"
                onClick={() => setBleedingLevel('heavy')}
                className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center space-x-0.5 ${
                  bleedingLevel === 'heavy'
                    ? 'bg-rose-800 text-white border-rose-900'
                    : 'bg-rose-200 text-rose-900 border-rose-400'
                }`}
              >
                <Droplet className="w-3 h-3 fill-current" />
                <Droplet className="w-3 h-3 fill-current" />
                <Droplet className="w-3 h-3 fill-current" />
              </button>
            </div>
          </div>

          {/* 朝食後の追加薬設定 */}
          <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isExtraEnabled}
                onChange={(e) => setIsExtraEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-400 border-slate-300"
              />
              <Pill className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">
                朝食後の追加薬を服用した
              </span>
            </label>

            {isExtraEnabled && (
              <div className="pt-1 flex items-center justify-between">
                <span className="text-xs text-slate-500">追加薬の服用時刻:</span>
                <input
                  type="time"
                  value={extraTime}
                  onChange={(e) => setExtraTime(e.target.value)}
                  className="px-2 py-1 rounded-lg text-sm font-bold bg-white border border-emerald-200 text-emerald-950 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* フッターボタン群 */}
        <div className="pt-2 space-y-2">
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 flex items-center justify-center space-x-1.5 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>この内容で記録する</span>
          </button>

          {log.takenTime && (
            <button
              onClick={handleReset}
              className="w-full py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>服薬記録をキャンセル（未服用に戻す）</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
