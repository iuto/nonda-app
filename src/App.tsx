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

  const handleTakeNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const takenTimeStr = `${hh}:${mm}`;

    const diff = calculateDiffMinutes(todayLog.targetTime, takenTimeStr);

    const updatedLog: MedicationLog = {
      ...todayLog,
      takenTime: takenTimeStr,
      takenAt: now.toISOString(),
      diffMinutes: diff,
    };

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

  // 副作用：出血の3段階程度を設定
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

  const handleTakeExtra = (dateStr: string) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const extraTimeStr = `${hh}:${mm}`;

    const targetLog = logs.find((l) => l.date === dateStr) || getOrCreateLogForDate(dateStr, settings.targetTime, logs);
    
    if (!targetLog.extraTakenTime) {
      updatePills(-1);
    }

    const updatedLog: MedicationLog = {
      ...targetLog,
      extraTakenTime: extraTimeStr,
      extraTakenAt: now.toISOString(),
    };

    const exists = logs.some((l) => l.date === dateStr);
    const newLogs = exists
      ? logs.map((l) => (l.date === dateStr ? updatedLog : l))
      : [updatedLog, ...logs];

    setLogs(newLogs);
    saveLogs(newLogs);
  };

  const handleCancelTakeExtra = (dateStr: string) => {
    const targetLog = logs.find((l) => l.date === dateStr) || getOrCreateLogForDate(dateStr, settings.targetTime, logs);
    
    if (targetLog.extraTakenTime) {
      updatePills(1);
    }

    const updatedLog: MedicationLog = {
      ...targetLog,
      extraTakenTime: null,
      extraTakenAt: null,
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
    extraTakenTime?: string | null
  ) => {
    const targetLog = logs.find((l) => l.date === dateStr) || getOrCreateLogForDate(dateStr, settings.targetTime, logs);

    let updatedLog: MedicationLog;

    const finalLevel = bleedingLevel ?? targetLog.bleedingLevel ?? (targetLog.hasBleeding ? 'light' : 'none');

    if (takenTime === null) {
      updatedLog = {
        ...targetLog,
        takenTime: null,
        takenAt: null,
        diffMinutes: null,
        bleedingLevel: finalLevel,
        hasBleeding: finalLevel !== 'none',
        extraTakenTime: extraTakenTime !== undefined ? extraTakenTime : targetLog.extraTakenTime,
      };
    } else {
      const diff = calculateDiffMinutes(targetLog.targetTime, takenTime);
      updatedLog = {
        ...targetLog,
        takenTime: takenTime,
        takenAt: new Date().toISOString(),
        diffMinutes: diff,
        bleedingLevel: finalLevel,
        hasBleeding: finalLevel !== 'none',
        extraTakenTime: extraTakenTime !== undefined ? extraTakenTime : targetLog.extraTakenTime,
      };
    }

    const exists = logs.some((l) => l.date === dateStr);
    const newLogs = exists
      ? logs.map((l) => (l.date === dateStr ? updatedLog : l))
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
            logs={logs}
            todayLog={todayLog}
            settings={settings}
            onTakeNow={handleTakeNow}
            onCancelTake={handleCancelTake}
            onSetBleedingLevel={(level) => handleSetBleedingLevel(todayDateStr, level)}
            onTakeExtra={() => handleTakeExtra(todayDateStr)}
            onCancelTakeExtra={() => handleCancelTakeExtra(todayDateStr)}
            onSetRemainingPills={handleSetRemainingPills}
            onOpenEditModal={() => handleOpenEditForLog(todayLog)}
            onOpenResult={() => setCurrentTab('result')}
          />
        ) : (
          <ResultView
            logs={logs}
            settings={settings}
            onBackToMain={() => setCurrentTab('main')}
            onEditLog={handleOpenEditForLog}
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
