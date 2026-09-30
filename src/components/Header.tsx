import React from 'react';
import { BarChart2, Calendar } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface HeaderProps {
  currentTab: 'main' | 'result';
  setCurrentTab: (tab: 'main' | 'result') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-emerald-100/80 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* AppLogo */}
        <button
          onClick={() => setCurrentTab('main')}
          className="hover:opacity-90 transition-opacity text-left focus:outline-none"
        >
          <AppLogo size="md" />
        </button>

        {/* タブナビゲーション（設定ボタン削除済み） */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentTab('main')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              currentTab === 'main'
                ? 'bg-emerald-100/90 text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>今日</span>
          </button>

          <button
            onClick={() => setCurrentTab('result')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              currentTab === 'result'
                ? 'bg-emerald-100/90 text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>リザルト</span>
          </button>
        </div>
      </div>
    </header>
  );
};
