import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import type { Activity, SportFilter } from '../types';
import { useLocale } from '../hooks/useLocale';
import { getSportLabel } from '../core/sports';

interface CumulativeDistanceChartProps {
  activities: Activity[];
  filter: SportFilter;
}

interface MonthlyDistance {
  month: string;
  gained: number;
  total: number;
}

interface ChartPoint extends MonthlyDistance {
  x: number;
  y: number;
}

function buildMonthlyData(activities: Activity[]): MonthlyDistance[] {
  const validActivities = activities
    .filter(
      (activity) =>
        activity.distance > 0 &&
        Number.isFinite(new Date(activity.start_date_local).getTime())
    )
    .sort(
      (a, b) =>
        new Date(a.start_date_local).getTime() -
        new Date(b.start_date_local).getTime()
    );
  if (validActivities.length === 0) return [];

  const distanceByMonth = new Map<string, number>();
  for (const activity of validActivities) {
    const date = new Date(activity.start_date_local);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    distanceByMonth.set(
      month,
      (distanceByMonth.get(month) ?? 0) + activity.distance / 1000
    );
  }

  const firstDate = new Date(validActivities[0].start_date_local);
  const lastDate = new Date(
    validActivities[validActivities.length - 1].start_date_local
  );
  const cursor = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
  const end = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
  const data: MonthlyDistance[] = [];
  let total = 0;

  while (cursor <= end) {
    const month = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    const gained = distanceByMonth.get(month) ?? 0;
    total += gained;
    data.push({
      month,
      gained: Number(gained.toFixed(1)),
      total: Number(total.toFixed(1)),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return data;
}

function formatAxisMonth(month: string, locale: string): string {
  const [year, monthNumber] = month.split('-');
  return locale === 'zh'
    ? `${year.slice(2)}.${monthNumber}`
    : `${Number(monthNumber)}/${year.slice(2)}`;
}

function formatFullMonth(month: string, locale: string): string {
  const [year, monthNumber] = month.split('-');
  return locale === 'zh'
    ? `${year} 年 ${Number(monthNumber)} 月`
    : `${Number(monthNumber)}/${year}`;
}

function formatYAxis(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
}

export function CumulativeDistanceChart({
  activities,
  filter,
}: CumulativeDistanceChartProps) {
  const { locale } = useLocale();
  const data = useMemo(() => buildMonthlyData(activities), [activities]);
  const gradientId = `distance-${useId().replace(/:/g, '')}`;
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(800);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = data[data.length - 1]?.total ?? 0;
  const range =
    data.length > 0
      ? `${data[0].month.replace('-', '.')} — ${data[data.length - 1].month.replace('-', '.')}`
      : '--';
  const sportLabel =
    filter === 'all'
      ? locale === 'zh'
        ? '全部运动'
        : 'All activities'
      : getSportLabel(filter, locale);

  useEffect(() => {
    const element = chartRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setChartWidth(Math.max(280, Math.round(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const height = chartWidth < 640 ? 220 : 280;
  const plot = { left: 48, right: 10, top: 10, bottom: 28 };
  const plotWidth = chartWidth - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const yStep = Math.max(100, Math.ceil(total / 4 / 100) * 100);
  const yMaximum = yStep * 4;
  const points: ChartPoint[] = data.map((item, index) => ({
    ...item,
    x:
      plot.left +
      (data.length === 1 ? plotWidth : (index / (data.length - 1)) * plotWidth),
    y: plot.top + plotHeight - (item.total / yMaximum) * plotHeight,
  }));
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');
  const areaPath = points.length
    ? `${linePath} L${points[points.length - 1].x},${plot.top + plotHeight} L${points[0].x},${plot.top + plotHeight} Z`
    : '';
  const tickCount = chartWidth < 430 ? 4 : 7;
  const visibleTickCount = Math.min(tickCount, data.length);
  const xTickIndexes = Array.from({ length: visibleTickCount }, (_, index) =>
    Math.round((index / Math.max(1, visibleTickCount - 1)) * (data.length - 1))
  );
  const hovered = hoveredIndex === null ? null : points[hoveredIndex];

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (data.length === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const localX =
      ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * chartWidth;
    const ratio = Math.min(
      1,
      Math.max(0, (localX - plot.left) / Math.max(1, plotWidth))
    );
    setHoveredIndex(Math.round(ratio * (data.length - 1)));
  };

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-xs tracking-wider text-[var(--color-muted)] uppercase">
            {locale === 'zh' ? '时间 × 累计里程' : 'Time × Cumulative distance'}
          </p>
          <h2 className="text-lg font-bold">
            {locale === 'zh' ? '里程积累' : 'Distance Journey'}
          </h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {sportLabel} · {range}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-[var(--color-accent)] sm:text-3xl">
            {Math.round(total).toLocaleString()}
            <span className="ml-1 text-sm font-normal text-[var(--color-muted)]">
              km
            </span>
          </p>
          <p className="text-[10px] tracking-wider text-[var(--color-muted)] uppercase">
            {locale === 'zh' ? '历史累计' : 'All-time total'}
          </p>
        </div>
      </div>

      <div ref={chartRef} className="relative h-[220px] w-full sm:h-[280px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
            {locale === 'zh' ? '暂无里程数据' : 'No distance data'}
          </div>
        ) : (
          <>
            <svg
              className="block h-full w-full touch-none"
              viewBox={`0 0 ${chartWidth} ${height}`}
              role="img"
              aria-label={
                locale === 'zh'
                  ? `累计里程 ${Math.round(total)} 公里`
                  : `${Math.round(total)} kilometres accumulated`
              }
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoveredIndex(null)}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-accent)"
                    stopOpacity="0.42"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-accent)"
                    stopOpacity="0.02"
                  />
                </linearGradient>
              </defs>

              {Array.from({ length: 5 }, (_, index) => {
                const value = yStep * index;
                const y = plot.top + plotHeight - (index / 4) * plotHeight;
                return (
                  <g key={value}>
                    <line
                      x1={plot.left}
                      y1={y}
                      x2={chartWidth - plot.right}
                      y2={y}
                      stroke="var(--color-border)"
                      strokeDasharray="3 5"
                      opacity="0.55"
                    />
                    <text
                      x={plot.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill="var(--color-muted)"
                      fontSize="10"
                    >
                      {formatYAxis(value)}
                    </text>
                  </g>
                );
              })}

              <path d={areaPath} fill={`url(#${gradientId})`} />
              <path
                d={linePath}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {xTickIndexes.map((index) => (
                <text
                  key={`${data[index].month}-${index}`}
                  x={points[index].x}
                  y={height - 8}
                  textAnchor={
                    index === 0
                      ? 'start'
                      : index === data.length - 1
                        ? 'end'
                        : 'middle'
                  }
                  fill="var(--color-muted)"
                  fontSize="10"
                >
                  {formatAxisMonth(data[index].month, locale)}
                </text>
              ))}

              {hovered && (
                <>
                  <line
                    x1={hovered.x}
                    y1={plot.top}
                    x2={hovered.x}
                    y2={plot.top + plotHeight}
                    stroke="var(--color-accent)"
                    strokeDasharray="3 4"
                    opacity="0.45"
                  />
                  <circle
                    cx={hovered.x}
                    cy={hovered.y}
                    r="4"
                    fill="var(--color-accent)"
                    stroke="var(--color-card)"
                    strokeWidth="2"
                  />
                </>
              )}
            </svg>

            {hovered && (
              <div
                className="pointer-events-none absolute z-10 min-w-32 -translate-x-1/2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs shadow-xl"
                style={{
                  left: `${(hovered.x / chartWidth) * 100}%`,
                  top: Math.max(0, hovered.y - 68),
                }}
              >
                <p className="mb-1 text-[var(--color-muted)]">
                  {formatFullMonth(hovered.month, locale)}
                </p>
                <p className="font-mono font-bold text-[var(--color-accent)]">
                  {hovered.total.toLocaleString()} km
                </p>
                <p className="text-[var(--color-muted)]">
                  +{hovered.gained.toLocaleString()} km
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
