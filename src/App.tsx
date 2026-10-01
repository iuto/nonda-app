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
import { Header } from './components/Header';
import { MainView } from './components/MainView';
import { ResultView } from './components/ResultView';
import { TimeEditModal } from './components/TimeEditModal';

export function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [logs, setLogs] = useState<MedicationLog[]>(() => {
    const loaded = loadLogs();
    // 既存ログの過剰な差分（マイナス数百〜プラス数百分のズレ）を「時間通り」に自動修正
    return loaded.map((log) => {
      if (log.takenTime) {
        return {
          ...log,
          targetTime: log.takenTime, // 目標時間を服用時刻に合わせる
          diffMinutes: 0, // ズレ0分（時間通り）
        };
      }
      return log;
    });
  });
  const [currentTab, setCurrentTab] = useState<'main' | 'result'>('main');

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
  };

  // 服薬「飲んだ！」アクション（記録した時間を目標時間として基準化し、ズレていない「時間通り」とする）
  const handleTakeNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const takenTimeStr = `${hh}:${mm}`;

    // 服用した時刻をそのユーザーの基本服用時刻として記録（ズレ0分）
    const updatedLog: MedicationLog = {
      ...todayLog,
      targetTime: takenTimeStr,
      takenTime: takenTimeStr,
      takenAt: now.toISOString(),
      diffMinutes: 0, // ズレていない「時間通り」
    };

    // settingsのデフォルト目標時間もこのユーザーの服用時間へ自動同期
    const newSettings = { ...settings, targetTime: takenTimeStr };
    setSettings(newSettings);
    saveSettings(newSettings);

    const newLogs = logs.map((l) => (l.date === todayDateStr ? updatedLog : l));
    setLogs(newLogs);
    saveLogs(newLogs);

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
  };

  const handleSaveTime = (
    dateStr: string,
    takenTime: string | null,
    bleedingLevel?: BleedingLevel,
    extraTakenTime?: string | null,
    note?: string
  ) => {
    const targetLog = logs.find((l) => l.date === dateStr) || getOrCreateLogForDate(dateStr, settings.targetTime, logs);

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
      // 指定された時間で目標と服用時刻を同期して「ズレ0分（時間通り）」とする
      updatedLog = {
        ...targetLog,
        targetTime: takenTime,
        takenTime: takenTime,
        takenAt: new Date().toISOString(),
        diffMinutes: 0,
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
      if (itemId === 'extra-1') {
        extraTakenTime = takenTimeStr;
      }
    }

    const updatedLog: MedicationLog = {
      ...targetLog,
      extraTakenTime,
      customLogs: newCustomLogs,
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
