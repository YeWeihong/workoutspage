import type { PrimarySportType, SportFilter } from './types';

export const PRIMARY_SPORTS: ReadonlyArray<{
  type: PrimarySportType;
  icon: string;
  color: string;
  zh: string;
  en: string;
}> = [
  { type: 'Run', icon: '🏃', color: '#f97316', zh: '跑步', en: 'Run' },
  { type: 'Ride', icon: '🚴', color: '#3b82f6', zh: '骑行', en: 'Ride' },
  { type: 'Hike', icon: '🥾', color: '#22c55e', zh: '徒步', en: 'Hike' },
];

export function normalizeSportType(type: string): string {
  switch (type.toLowerCase()) {
    case 'run':
    case 'running':
    case 'virtualrun':
      return 'Run';
    case 'ride':
    case 'cycling':
      return 'Ride';
    case 'hike':
    case 'hiking':
    case 'mountaineering':
      return 'Hike';
    case 'walk':
    case 'walking':
      return 'Walk';
    case 'swim':
    case 'swimming':
      return 'Swim';
    default:
      return type;
  }
}

export function getSportIcon(type: string): string {
  const icons: Record<string, string> = {
    Run: '🏃',
    Ride: '🚴',
    Hike: '🥾',
    Walk: '🚶',
    Swim: '🏊',
  };
  return icons[normalizeSportType(type)] ?? '📌';
}

export function getSportColor(type: string): string {
  const colors: Record<string, string> = {
    Run: '#f97316',
    Ride: '#3b82f6',
    Hike: '#22c55e',
    Walk: '#14b8a6',
    Swim: '#06b6d4',
  };
  return colors[normalizeSportType(type)] ?? '#a855f7';
}

export function getSportLabel(type: string, locale: 'zh' | 'en'): string {
  const normalized = normalizeSportType(type);
  const sport = PRIMARY_SPORTS.find((item) => item.type === normalized);
  if (sport) return sport[locale];

  const labels: Record<string, { zh: string; en: string }> = {
    Walk: { zh: '步行', en: 'Walk' },
    Swim: { zh: '游泳', en: 'Swim' },
  };
  return labels[normalized]?.[locale] ?? normalized;
}

export function matchesSportFilter(
  activityType: string,
  filter: SportFilter
): boolean {
  return filter === 'all' || normalizeSportType(activityType) === filter;
}
