import { useState, useEffect } from 'react';
import { AppSettings, MedicationLog } from './types/medication';
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

  // 残数更新ヘルパー
  const updatePills = (delta: number) => {
    const newCount = Math.max(0, settings.remainingPills + delta);
    const newSettings = { ...settings, remainingPills: newCount };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // 服薬「飲んだ！」アクション（残数 -1）
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

    // 未服用から服用済みになった場合のみ残数を-1
    if (!todayLog.takenTime) {
      updatePills(-1);
    }
  };

  // 服用を取り消す（残数 +1）
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

  // 副作用：出血のトグル切り替え
  const handleToggleBleeding = (dateStr: string) => {
    const targetLog = logs.find((l) => l.date === dateStr) || getOrCreateLogForDate(dateStr, settings.targetTime, logs);
    const updatedLog: MedicationLog = {
      ...targetLog,
      hasBleeding: !targetLog.hasBleeding,
    };

    const exists = logs.some((l) => l.date === dateStr);
    const newLogs = exists
      ? logs.map((l) => (l.date === dateStr ? updatedLog : l))
      : [updatedLog, ...logs];

    setLogs(newLogs);
    saveLogs(newLogs);
  };

  // 朝食後の追加薬「飲んだ！」アクション（残数 -1）
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

  // 朝食後の追加薬の取り消し（残数 +1）
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

  // 手動で残数を補充・編集
  const handleSetRemainingPills = (count: number) => {
    const newSettings = { ...settings, remainingPills: Math.max(0, count) };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleSaveTime = (
    dateStr: string,
    takenTime: string | null,
    hasBleeding?: boolean,
    extraTakenTime?: string | null
  ) => {
    const targetLog = logs.find((l) => l.date === dateStr) || getOrCreateLogForDate(dateStr, settings.targetTime, logs);

    let updatedLog: MedicationLog;

    if (takenTime === null) {
      updatedLog = {
        ...targetLog,
        takenTime: null,
        takenAt: null,
        diffMinutes: null,
        hasBleeding: hasBleeding ?? targetLog.hasBleeding,
        extraTakenTime: extraTakenTime !== undefined ? extraTakenTime : targetLog.extraTakenTime,
      };
    } else {
      const diff = calculateDiffMinutes(targetLog.targetTime, takenTime);
      updatedLog = {
        ...targetLog,
        takenTime: takenTime,
        takenAt: new Date().toISOString(),
        diffMinutes: diff,
        hasBleeding: hasBleeding ?? targetLog.hasBleeding,
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
            onToggleBleeding={() => handleToggleBleeding(todayDateStr)}
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
