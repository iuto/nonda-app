import React from 'react';
import { MedicationLog } from '../types/medication';
import { calculateDiffMinutes, timeToMinutes, minutesToTime } from '../utils/recommendation';
import { TrendingUp, Clock } from 'lucide-react';

interface RhythmChartProps {
  logs: MedicationLog[];
  averageTakenTime: string | null;
}

export const RhythmChart: React.FC<RhythmChartProps> = ({ logs, averageTakenTime }) => {
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
        <p className="text-sm font-bold text-slate-700">服薬リズム推移グラフ</p>
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

  // グラフの上下レンジ（最低でも±40分を確保し、余裕を持たせる）
  const rawMax = Math.max(Math.abs(maxDiff), Math.abs(minDiff), 40);
  const limitDiff = Math.ceil((rawMax + 10) / 15) * 15; // 15分刻み

  // SVGの寸法設定
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 65;
  const padRight = 35;
  const padTop = 38;
  const padBottom = 48;
  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;
  const yCenter = padTop + chartHeight / 2;

  // X座標計算
  const getX = (index: number) => {
    if (points.length <= 1) return padLeft + chartWidth / 2;
    return padLeft + (index / (points.length - 1)) * chartWidth;
  };

  // Y座標計算 (diff > 0: 遅め = 上側, diff < 0: 早め = 下側)
  const getY = (diff: number) => {
    return yCenter - (diff / limitDiff) * (chartHeight / 2);
  };

  // プロット点とパスの生成
  const plottedTakenPoints = points
    .map((p, i) => (p.isTaken && p.diff !== null ? { ...p, x: getX(i), y: getY(p.diff) } : null))
    .filter((p): p is (typeof points[0] & { x: number; y: number }) => p !== null);

  // 折れ線パス
  let linePath = '';
  let areaPath = '';

  if (plottedTakenPoints.length > 0) {
    linePath = plottedTakenPoints.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    // グラデーション塗りつぶし領域（基準線または最下部まで）
    const firstPoint = plottedTakenPoints[0];
    const lastPoint = plottedTakenPoints[plottedTakenPoints.length - 1];
    areaPath = `${linePath} L ${lastPoint.x} ${padTop + chartHeight} L ${firstPoint.x} ${padTop + chartHeight} Z`;
  }

  // 補助線の時刻算出
  const avgMins = timeToMinutes(averageTakenTime);
  const topTimeLabel = minutesToTime(avgMins + limitDiff);
  const bottomTimeLabel = minutesToTime(avgMins - limitDiff);

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-xs space-y-3">
      {/* グラフヘッダー */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <TrendingUp className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">服薬リズム推移</h2>
        </div>
        <div className="flex items-center space-x-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
          <Clock className="w-3 h-3 text-emerald-600 mr-0.5" />
          <span>いつもの時間: {averageTakenTime} (±30分以内は問題なし)</span>
        </div>
      </div>

      {/* SVGチャートエリア */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 md:h-56 select-none"
        >
          <defs>
            {/* エリアグラデーション */}
            <linearGradient id="rhythmAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="80%" stopColor="#10b981" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            {/* シャドウフィルター */}
            <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* ±30分以内（問題なしエリア）の許容帯域 */}
          <rect
            x={padLeft}
            y={getY(30)}
            width={chartWidth}
            height={getY(-30) - getY(30)}
            fill="#10b981"
            fillOpacity="0.05"
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
            strokeOpacity="0.35"
          />
          <line
            x1={padLeft}
            y1={getY(-30)}
            x2={svgWidth - padRight}
            y2={getY(-30)}
            stroke="#10b981"
            strokeDasharray="2 3"
            strokeWidth="1"
            strokeOpacity="0.35"
          />
          <text
            x={svgWidth - padRight - 6}
            y={getY(30) + 11}
            textAnchor="end"
            fill="#059669"
            fontSize="9.5"
            fontWeight="700"
            fillOpacity="0.75"
          >
            30分以内 (問題なし)
          </text>

          {/* 上部補助線 (+limitDiff) */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={svgWidth - padRight}
            y2={padTop}
            stroke="#e2e8f0"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={padLeft - 8}
            y={padTop + 4}
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
            y1={padTop + chartHeight}
            x2={svgWidth - padRight}
            y2={padTop + chartHeight}
            stroke="#e2e8f0"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={padLeft - 8}
            y={padTop + chartHeight + 4}
            textAnchor="end"
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="600"
          >
            {bottomTimeLabel}
          </text>

          {/* エリア塗りつぶし */}
          {areaPath && (
            <path d={areaPath} fill="url(#rhythmAreaGrad)" />
          )}

          {/* 折れ線 */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 日付の垂直グリッド・プロット点 */}
          {points.map((p, i) => {
            const x = getX(i);
            const isTaken = p.isTaken && p.diff !== null && p.takenTime;
            const y = isTaken ? getY(p.diff!) : yCenter;

            // ズレに応じた色 (30分以内なら問題なし = 緑)
            const absDiff = isTaken ? Math.abs(p.diff!) : 0;
            const pointColor = !isTaken
              ? '#cbd5e1'
              : absDiff <= 30
              ? '#10b981'
              : absDiff <= 60
              ? '#0d9488'
              : '#f59e0b';

            return (
              <g key={p.date}>
                {/* 垂直グリッド線 */}
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + chartHeight}
                  stroke={p.isToday ? '#10b981' : '#f1f5f9'}
                  strokeWidth={p.isToday ? '1.5' : '1'}
                  strokeDasharray={p.isToday ? '2 2' : 'none'}
                  strokeOpacity={p.isToday ? '0.6' : '1'}
                />

                {/* プロット点 */}
                {isTaken ? (
                  <>
                    {/* 外枠 */}
                    <circle
                      cx={x}
                      cy={y}
                      r="6.5"
                      fill="#ffffff"
                      stroke={pointColor}
                      strokeWidth="2.5"
                    />
                    {/* 内芯 */}
                    <circle
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill={pointColor}
                    />

                    {/* 時刻バッジ（ダークピル） */}
                    <g filter="url(#badgeShadow)">
                      <rect
                        x={x - 24}
                        y={y - 25}
                        width="48"
                        height="17"
                        rx="5"
                        fill="#0f172a"
                      />
                      <text
                        x={x}
                        y={y - 13}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10.5"
                        fontWeight="700"
                        fontFamily="monospace"
                      >
                        {p.takenTime}
                      </text>
                    </g>
                  </>
                ) : (
                  /* 未服用の点 */
                  <circle
                    cx={x}
                    cy={yCenter}
                    r="4"
                    fill="#f1f5f9"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* X軸日付ラベル */}
                <text
                  x={x}
                  y={padTop + chartHeight + 20}
                  textAnchor="middle"
                  fill={p.isToday ? '#059669' : '#334155'}
                  fontSize="11"
                  fontWeight={p.isToday ? '700' : '600'}
                >
                  {p.dateLabel}
                </text>
                <text
                  x={x}
                  y={padTop + chartHeight + 33}
                  textAnchor="middle"
                  fill={p.isToday ? '#059669' : '#64748b'}
                  fontSize="10"
                  fontWeight="600"
                >
                  ({p.dayOfWeek})
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
