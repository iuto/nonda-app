import { useState, useEffect } from 'react';
import { AppSettings, MedicationLog, BleedingLevel } from './types/medication';
import {
  loadLogs,
  loadSettings,
  saveLogs,
  saveSettings,
  getTodayDateString,
  getOrCreateLogForDate,
} from './utils/storage';
import { calculateDiffMinutes } from './utils/recommendation';
import { Header } from './components/Header';
import { MainView } from './components/MainView';
import { ResultView } from './components/ResultView';
import { TimeEditModal } from './components/TimeEditModal';

export function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [logs, setLogs] = useState<MedicationLog[]>(loadLogs);
  const [currentTab, setCurrentTab] = useState<'main' | 'result'>('main');

  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<MedicationLog | null>(null);

  const todayDateStr = getTodayDateString(0);
  const todayLog = getOrCreateLogForDate(todayDateStr, settings.targetTime, logs);

  useEffect(() => {
    const exists = logs.some((l) => l.date === todayDateStr);
    if (!exists) {
      const updated = [todayLog, ...logs];
      setLogs(updated);
      saveLogs(updated);
    }
  }, [todayDateStr, logs, todayLog]);

  const updatePills = (delta: number) => {
    const newCount = Math.max(0, settings.remainingPills + delta);
    const newSettings = { ...settings, remainingPills: newCount };
    setSettings(newSettings);
    saveSettings(newSettings);
    // 薬の残数が変化したらアラート消去フラグをリセットして再表示可能に
    setIsAlertDismissed(false);
  };

  // 服薬「飲んだ！」アクション（設定された目標時間との実際のズレ分を計算）
  const handleTakeNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const takenTimeStr = `${hh}:${mm}`;

    // 設定目標時刻との差分（分）を正確に算出
    const diffMinutes = calculateDiffMinutes(settings.targetTime, takenTimeStr);

    const updatedLog: MedicationLog = {
      ...todayLog,
      targetTime: settings.targetTime,
      takenTime: takenTimeStr,
      takenAt: now.toISOString(),
      diffMinutes: diffMinutes,
    };

    const newLogs = logs.map((l) => (l.date === todayDateStr ? updatedLog : l));
    setLogs(newLogs);
    saveLogs(newLogs);

    // 薬を飲んだらアラートを再表示できるようにリセット
    setIsAlertDismissed(false);

    if (!todayLog.takenTime) {
      updatePills(-1);
    }
  };

  const handleCancelTake = () => {
    if (todayLog.takenTime) {
      updatePills(1);
    }

    const updatedLog: MedicationLog = {
      ...todayLog,
      takenTime: null,
      takenAt: null,
      diffMinutes: null,
    };

    const newLogs = logs.map((l) => (l.date === todayDateStr ? updatedLog : l));
    setLogs(newLogs);
    saveLogs(newLogs);
  };

  const handleSetBleedingLevel = (dateStr: string, level: BleedingLevel) => {
    const targetLog = logs.find((l) => l.date === dateStr) || getOrCreateLogForDate(dateStr, settings.targetTime, logs);
    const updatedLog: MedicationLog = {
      ...targetLog,
      bleedingLevel: level,
      hasBleeding: level !== 'none',
    };

    const exists = logs.some((l) => l.date === dateStr);
    const newLogs = exists
      ? logs.map((l) => (l.date === dateStr ? updatedLog : l))
      : [updatedLog, ...logs];

    setLogs(newLogs);
    saveLogs(newLogs);
  };

  const handleSetNote = (dateStr: string, note: string) => {
    const targetLog = logs.find((l) => l.date === dateStr) || getOrCreateLogForDate(dateStr, settings.targetTime, logs);
    const updatedLog: MedicationLog = {
      ...targetLog,
      note,
    };

    const exists = logs.some((l) => l.date === dateStr);
    const newLogs = exists
      ? logs.map((l) => (l.date === dateStr ? updatedLog : l))
      : [updatedLog, ...logs];

    setLogs(newLogs);
    saveLogs(newLogs);
  };

  const handleSetRemainingPills = (count: number) => {
    const newSettings = { ...settings, remainingPills: Math.max(0, count) };
    setSettings(newSettings);
    saveSettings(newSettings);
    setIsAlertDismissed(false);
  };

  const handleSaveTime = (
    dateStr: string,
    takenTime: string | null,
    bleedingLevel?: BleedingLevel,
    extraTakenTime?: string | null,
    note?: string
  ) => {
    const targetLog = logs.find((l) => l.date === dateStr) || getOrCreateLogForDate(dateStr, settings.targetTime, logs);

    // 変更前の服用状態と変更後の服用状態の差分をチェックして残り薬数を連動更新
    const wasTaken = !!targetLog.takenTime;
    const willBeTaken = takenTime !== null;

    if (!wasTaken && willBeTaken) {
      updatePills(-1);
    } else if (wasTaken && !willBeTaken) {
      updatePills(1);
    }

    let updatedLog: MedicationLog;

    const finalLevel = bleedingLevel ?? targetLog.bleedingLevel ?? (targetLog.hasBleeding ? 'light' : 'none');
    const finalNote = note !== undefined ? note : targetLog.note;

    if (takenTime === null) {
      updatedLog = {
        ...targetLog,
        takenTime: null,
        takenAt: null,
        diffMinutes: null,
        bleedingLevel: finalLevel,
        hasBleeding: finalLevel !== 'none',
        extraTakenTime: extraTakenTime !== undefined ? extraTakenTime : targetLog.extraTakenTime,
        note: finalNote,
      };
    } else {
      // 実際に指定された時間での偏差を算出
      const diffMinutes = calculateDiffMinutes(settings.targetTime, takenTime);
      updatedLog = {
        ...targetLog,
        targetTime: settings.targetTime,
        takenTime: takenTime,
        takenAt: new Date().toISOString(),
        diffMinutes: diffMinutes,
        bleedingLevel: finalLevel,
        hasBleeding: finalLevel !== 'none',
        extraTakenTime: extraTakenTime !== undefined ? extraTakenTime : targetLog.extraTakenTime,
        note: finalNote,
      };
    }

    const exists = logs.some((l) => l.date === dateStr);
    const newLogs = exists
      ? logs.map((l) => (l.date === dateStr ? updatedLog : l))
      : [updatedLog, ...logs];

    setLogs(newLogs);
    saveLogs(newLogs);
  };

  const handleAddCustomItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newItem = { id: `item-${Date.now()}`, name: trimmed };
    const currentItems = settings.customItems || [{ id: 'extra-1', name: '朝食後の追加薬' }];
    const newSettings = { ...settings, customItems: [...currentItems, newItem] };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleDeleteCustomItem = (itemId: string) => {
    const currentItems = settings.customItems || [{ id: 'extra-1', name: '朝食後の追加薬' }];
    const newItems = currentItems.filter((item) => item.id !== itemId);
    const newSettings = { ...settings, customItems: newItems };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleToggleCustomItem = (itemId: string) => {
    const targetLog = logs.find((l) => l.date === todayDateStr) || getOrCreateLogForDate(todayDateStr, settings.targetTime, logs);
    const currentCustomLogs = targetLog.customLogs || {};

    const isTaken = !!currentCustomLogs[itemId] || (itemId === 'extra-1' && !!targetLog.extraTakenTime);

    let newCustomLogs = { ...currentCustomLogs };
    let extraTakenTime = targetLog.extraTakenTime;

    const currentItems = settings.customItems || [{ id: 'extra-1', name: '朝食後の追加薬' }];
    const itemObj = currentItems.find((i) => i.id === itemId);
    const itemName = itemObj ? itemObj.name : (itemId === 'extra-1' ? '朝食後の追加薬' : '追加のお薬・サプリ');

    let newCustomItemNames = { ...(targetLog.customItemNames || {}) };

    if (isTaken) {
      delete newCustomLogs[itemId];
      if (itemId === 'extra-1') {
        extraTakenTime = null;
      }
    } else {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const takenTimeStr = `${hh}:${mm}`;
      newCustomLogs[itemId] = takenTimeStr;
      newCustomItemNames[itemId] = itemName;
      if (itemId === 'extra-1') {
        extraTakenTime = takenTimeStr;
      }
    }

    const updatedLog: MedicationLog = {
      ...targetLog,
      extraTakenTime,
      customLogs: newCustomLogs,
      customItemNames: newCustomItemNames,
    };

    const exists = logs.some((l) => l.date === todayDateStr);
    const newLogs = exists
      ? logs.map((l) => (l.date === todayDateStr ? updatedLog : l))
      : [updatedLog, ...logs];

    setLogs(newLogs);
    saveLogs(newLogs);
  };

  const handleOpenEditForLog = (log: MedicationLog) => {
    setEditingLog(log);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      <main className="flex-1 pb-10">
        {currentTab === 'main' ? (
          <MainView
            todayLog={todayLog}
            settings={settings}
            isAlertDismissed={isAlertDismissed}
            onDismissAlert={() => setIsAlertDismissed(true)}
            onTakeNow={handleTakeNow}
            onCancelTake={handleCancelTake}
            onSetBleedingLevel={(level) => handleSetBleedingLevel(todayDateStr, level)}
            onToggleCustomItem={handleToggleCustomItem}
            onAddCustomItem={handleAddCustomItem}
            onDeleteCustomItem={handleDeleteCustomItem}
            onSetRemainingPills={handleSetRemainingPills}
            onOpenEditModal={() => handleOpenEditForLog(todayLog)}
            onOpenResult={() => setCurrentTab('result')}
          />
        ) : (
          <ResultView
            logs={logs}
            settings={settings}
            todayLog={todayLog}
            onBackToMain={() => setCurrentTab('main')}
            onEditLog={handleOpenEditForLog}
            onSetNote={(note) => handleSetNote(todayDateStr, note)}
          />
        )}
      </main>

      <TimeEditModal
        isOpen={isEditModalOpen}
        log={editingLog}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveTime}
      />
    </div>
  );
}

export default App;
