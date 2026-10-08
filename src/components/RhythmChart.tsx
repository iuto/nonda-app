import React, { useState } from 'react';
import { MedicationLog } from '../types/medication';
import { calculateDiffMinutes, timeToMinutes, minutesToTime } from '../utils/recommendation';
import { TrendingUp, Clock, BarChart2 } from 'lucide-react';

interface RhythmChartProps {
  logs: MedicationLog[];
  averageTakenTime: string | null;
}

export const RhythmChart: React.FC<RhythmChartProps> = ({ logs, averageTakenTime }) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 直近最大7日分を抽出し、古い順（左から右へ時系列順）に並べる
  const recentLogs = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  // 1件も記録がない場合
  if (recentLogs.length === 0 || !averageTakenTime) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-slate-700">服薬リズム推移</p>
        <p className="text-xs text-slate-400 mt-1">
          服薬を記録すると、ここに日々の服薬リズムの推移がグラフで表示されます。
        </p>
      </div>
    );
  }

  // ログデータをプロット用に変換
  const todayStr = new Date().toISOString().split('T')[0];

  const points = recentLogs.map((log) => {
    const isTaken = !!log.takenTime;
    const diff = isTaken ? calculateDiffMinutes(averageTakenTime, log.takenTime!) : null;

    // 日付ラベル (例: 10/5(月))
    const [y, m, d] = log.date.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()];
    const isToday = log.date === todayStr;
    const dateLabel = `${Number(m)}/${Number(d)}`;

    return {
      date: log.date,
      dateLabel,
      dayOfWeek,
      isToday,
      isTaken,
      takenTime: log.takenTime,
      diff,
    };
  });

  // 服薬したデータのみのズレ幅を計算
  const takenPoints = points.filter((p) => p.isTaken && p.diff !== null);
  const diffs = takenPoints.map((p) => p.diff!);

  const maxDiff = diffs.length > 0 ? Math.max(...diffs, 0) : 0;
  const minDiff = diffs.length > 0 ? Math.min(...diffs, 0) : 0;

  // グラフの上下レンジ（最低でも±45分を確保し、視認性を高める）
  const rawMax = Math.max(Math.abs(maxDiff), Math.abs(minDiff), 45);
  const limitDiff = Math.ceil((rawMax + 10) / 15) * 15; // 15分刻み

  // SVGの寸法設定（線とテキストが絶対に重ならないよう明確に領域を分離）
  const svgWidth = 600;
  const svgHeight = 250;
  const padLeft = 65;
  const padRight = 35;
  const plotTop = 50;   // グラフ描画エリア上端（時刻ピルはy=10〜28に独立配置）
  const plotBottom = 190; // グラフ描画エリア下端（日付はy=205〜240に独立配置）
  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = plotBottom - plotTop;
  const yCenter = plotTop + chartHeight / 2;

  // X座標計算
  const getX = (index: number) => {
    if (points.length <= 1) return padLeft + chartWidth / 2;
    return padLeft + (index / (points.length - 1)) * chartWidth;
  };

  // Y座標計算 (diff > 0: 遅め = 上側, diff < 0: 早め = 下側)
  const getY = (diff: number) => {
    return yCenter - (diff / limitDiff) * (chartHeight / 2);
  };

  // プロット点
  const plottedTakenPoints = points
    .map((p, i) => (p.isTaken && p.diff !== null ? { ...p, x: getX(i), y: getY(p.diff) } : null))
    .filter((p): p is (typeof points[0] & { x: number; y: number }) => p !== null);

  // 滑らかな三次ベジェ曲線（スプライン）パス生成（折れ線のカクカクをなくし優しく表現）
  let smoothLinePath = '';
  let smoothAreaPath = '';

  if (plottedTakenPoints.length > 0) {
    if (plottedTakenPoints.length === 1) {
      smoothLinePath = `M ${plottedTakenPoints[0].x} ${plottedTakenPoints[0].y}`;
    } else {
      smoothLinePath = `M ${plottedTakenPoints[0].x} ${plottedTakenPoints[0].y}`;
      for (let i = 0; i < plottedTakenPoints.length - 1; i++) {
        const p0 = plottedTakenPoints[i];
        const p1 = plottedTakenPoints[i + 1];
        const dx = p1.x - p0.x;
        const cp1x = p0.x + dx / 2;
        const cp1y = p0.y;
        const cp2x = p0.x + dx / 2;
        const cp2y = p1.y;
        smoothLinePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      }
    }

    const firstPoint = plottedTakenPoints[0];
    const lastPoint = plottedTakenPoints[plottedTakenPoints.length - 1];
    smoothAreaPath = `${smoothLinePath} L ${lastPoint.x} ${plotBottom} L ${firstPoint.x} ${plotBottom} Z`;
  }

  // 補助線の時刻算出
  const avgMins = timeToMinutes(averageTakenTime);
  const topTimeLabel = minutesToTime(avgMins + limitDiff);
  const bottomTimeLabel = minutesToTime(avgMins - limitDiff);

  // 選択中の日付データ（初期値は直近の日付）
  const activeDate = selectedDate || (points.length > 0 ? points[points.length - 1].date : null);
  const activePoint = points.find((p) => p.date === activeDate);

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-xs space-y-3">
      {/* グラフヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <TrendingUp className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">服薬リズム推移</h2>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md">
            緑帯: ±30分以内（問題なし）
          </span>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {/* 表示切替（折れ線 / 棒グラフ） */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs">
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                chartType === 'line'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              折れ線
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center space-x-1 ${
                chartType === 'bar'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>日別</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/60">
            <Clock className="w-3 h-3 text-emerald-600 mr-0.5" />
            <span>基準: {averageTakenTime}</span>
          </div>
        </div>
      </div>

      {/* SVGチャートエリア */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 md:h-64 select-none"
        >
          <defs>
            {/* エリアグラデーション */}
            <linearGradient id="rhythmAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
              <stop offset="85%" stopColor="#10b981" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            {/* バーグラデーション */}
            <linearGradient id="barGradEmerald" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="barGradAmber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* ±30分以内（問題なしエリア）の許容背景帯 */}
          <rect
            x={padLeft}
            y={getY(30)}
            width={chartWidth}
            height={getY(-30) - getY(30)}
            fill="#10b981"
            fillOpacity="0.06"
            rx="4"
          />
          <line
            x1={padLeft}
            y1={getY(30)}
            x2={svgWidth - padRight}
            y2={getY(30)}
            stroke="#10b981"
            strokeDasharray="2 3"
            strokeWidth="1"
            strokeOpacity="0.3"
          />
          <line
            x1={padLeft}
            y1={getY(-30)}
            x2={svgWidth - padRight}
            y2={getY(-30)}
            stroke="#10b981"
            strokeDasharray="2 3"
            strokeWidth="1"
            strokeOpacity="0.3"
          />

          {/* 上部補助線 (+limitDiff) */}
          <line
            x1={padLeft}
            y1={plotTop}
            x2={svgWidth - padRight}
            y2={plotTop}
            stroke="#f1f5f9"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={padLeft - 8}
            y={plotTop + 4}
            textAnchor="end"
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="600"
          >
            {topTimeLabel}
          </text>

          {/* 基準線 (いつもの時間) */}
          <line
            x1={padLeft}
            y1={yCenter}
            x2={svgWidth - padRight}
            y2={yCenter}
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeWidth="1.5"
            strokeOpacity="0.75"
          />
          <text
            x={padLeft - 8}
            y={yCenter + 4}
            textAnchor="end"
            fill="#059669"
            fontSize="11"
            fontFamily="monospace"
            fontWeight="700"
          >
            {averageTakenTime}
          </text>

          {/* 下部補助線 (-limitDiff) */}
          <line
            x1={padLeft}
            y1={plotBottom}
            x2={svgWidth - padRight}
            y2={plotBottom}
            stroke="#f1f5f9"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={padLeft - 8}
            y={plotBottom + 4}
            textAnchor="end"
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="600"
          >
            {bottomTimeLabel}
          </text>

          {/* グラフ描画（折れ線モード） */}
          {chartType === 'line' && (
            <>
              {smoothAreaPath && (
                <path d={smoothAreaPath} fill="url(#rhythmAreaGrad)" />
              )}
              {smoothLinePath && (
                <path
                  d={smoothLinePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </>
          )}

          {/* 各日の縦グリッド線・棒・プロット点・上部時刻ピル */}
          {points.map((p, i) => {
            const x = getX(i);
            const isTaken = p.isTaken && p.diff !== null && p.takenTime;
            const y = isTaken ? getY(p.diff!) : yCenter;
            const isSelected = p.date === activeDate;

            // ズレに応じた配色
            const absDiff = isTaken ? Math.abs(p.diff!) : 0;
            const isWithin30 = absDiff <= 30;
            const pointColor = !isTaken
              ? '#cbd5e1'
              : isWithin30
              ? '#10b981'
              : absDiff <= 60
              ? '#0d9488'
              : '#f59e0b';

            const textColor = !isTaken
              ? '#94a3b8'
              : isWithin30
              ? '#047857'
              : absDiff <= 60
              ? '#0f766e'
              : '#b45309';

            return (
              <g
                key={p.date}
                className="cursor-pointer"
                onClick={() => setSelectedDate(p.date)}
              >
                {/* 縦ガイド線 */}
                <line
                  x1={x}
                  y1={plotTop - 10}
                  x2={x}
                  y2={plotBottom}
                  stroke={isSelected ? '#10b981' : p.isToday ? '#a7f3d0' : '#f1f5f9'}
                  strokeWidth={isSelected ? '1.5' : '1'}
                  strokeDasharray={isSelected || p.isToday ? '2 2' : 'none'}
                />

                {/* ① 上部独立配置の服薬時刻ピル（線と絶対に重ならないエリア y=10〜28） */}
                {isTaken ? (
                  <g>
                    <rect
                      x={x - 22}
                      y={10}
                      width={44}
                      height={18}
                      rx="5"
                      fill={isSelected ? '#ecfdf5' : '#ffffff'}
                      stroke={pointColor}
                      strokeWidth={isSelected ? '1.8' : '1.2'}
                    />
                    <text
                      x={x}
                      y={23}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      {p.takenTime}
                    </text>
                  </g>
                ) : (
                  <text
                    x={x}
                    y={23}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    -
                  </text>
                )}

                {/* ② 棒グラフモード時のバー描画 */}
                {chartType === 'bar' && isTaken && (
                  (() => {
                    const barTop = Math.min(y, yCenter);
                    const barHeight = Math.max(Math.abs(y - yCenter), 6);
                    return (
                      <rect
                        x={x - 7}
                        y={barTop}
                        width={14}
                        height={barHeight}
                        rx="4"
                        fill={isWithin30 ? 'url(#barGradEmerald)' : 'url(#barGradAmber)'}
                        opacity={isSelected ? 1 : 0.85}
                      />
                    );
                  })()
                )}

                {/* ③ プロット点（折れ線モード、または未服用） */}
                {chartType === 'line' && (
                  isTaken ? (
                    <>
                      {/* 外枠（クリック選択時は強調） */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 7.5 : 6}
                        fill="#ffffff"
                        stroke={pointColor}
                        strokeWidth={isSelected ? 3 : 2.5}
                      />
                      {/* 内芯 */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 3.5 : 2.5}
                        fill={pointColor}
                      />
                    </>
                  ) : (
                    <circle
                      cx={x}
                      cy={yCenter}
                      r="3.5"
                      fill="#f1f5f9"
                      stroke="#94a3b8"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                    />
                  )
                )}

                {/* ④ X軸日付ラベル（y=205〜240） */}
                <text
                  x={x}
                  y={plotBottom + 20}
                  textAnchor="middle"
                  fill={p.isToday ? '#059669' : isSelected ? '#0f172a' : '#334155'}
                  fontSize="11"
                  fontWeight={p.isToday || isSelected ? '700' : '600'}
                >
                  {p.dateLabel}
                </text>
                <text
                  x={x}
                  y={plotBottom + 33}
                  textAnchor="middle"
                  fill={p.isToday ? '#059669' : isSelected ? '#0f172a' : '#64748b'}
                  fontSize="10"
                  fontWeight={p.isToday || isSelected ? '700' : '500'}
                >
                  ({p.dayOfWeek})
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* タップした日の詳細インサイトバナー */}
      {activePoint && (
        <div className="bg-slate-50/90 rounded-xl px-3.5 py-2 border border-slate-200/60 flex items-center justify-between text-xs transition-all">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">
              {activePoint.dateLabel} ({activePoint.dayOfWeek})
              {activePoint.isToday && <span className="text-emerald-700 ml-1">今日</span>}
            </span>
            <span className="text-slate-400">|</span>
            {activePoint.isTaken ? (
              <span className="font-mono font-bold text-slate-900">
                {activePoint.takenTime} 服用
              </span>
            ) : (
              <span className="text-slate-400 font-medium">未服用</span>
            )}
          </div>

          <div>
            {activePoint.isTaken && activePoint.diff !== null ? (
              Math.abs(activePoint.diff) <= 30 ? (
                <span className="font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md font-mono">
                  {activePoint.diff === 0 ? 'ピッタリ (問題なし)' : `${Math.abs(activePoint.diff)}分差 (問題なし)`}
                </span>
              ) : (
                <span className="font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md font-mono">
                  {activePoint.diff > 0 ? `+${activePoint.diff}分 (遅め)` : `${activePoint.diff}分 (早め)`}
                </span>
              )
            ) : (
              <span className="text-slate-400 text-[11px]">記録なし</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
