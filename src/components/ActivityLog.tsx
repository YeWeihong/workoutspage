import { useState, useEffect, type FormEvent, type MouseEvent } from 'react';
import type { Activity } from '../types';
import { formatDuration, formatPace } from '../hooks/useActivities';
import { useLocale } from '../hooks/useLocale';
import {
  getSportIcon,
  getSportLabel,
  normalizeSportType,
} from '../core/sports';
import { commitActivityName } from '../core/githubActivityNames';

interface ActivityLogProps {
  activities: Activity[];
  years: number[];
  year: number | null;
  setYear: (y: number | null) => void;
  selectedActivity?: Activity | null;
  onSelectActivity?: (a: Activity | null) => void;
  adminMode?: boolean;
  onActivityRenamed?: (runId: number, name: string) => void;
}

const PAGE_SIZE = 16;

type DistanceFilter = 'all' | '10' | '20' | '40';

export function ActivityLog({
  activities,
  years,
  year,
  setYear,
  selectedActivity,
  onSelectActivity,
  adminMode = false,
  onActivityRenamed,
}: ActivityLogProps) {
  const { t, locale } = useLocale();
  const [page, setPage] = useState(0);
  const [distFilter, setDistFilter] = useState<DistanceFilter>('all');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [draftName, setDraftName] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [commitUrl, setCommitUrl] = useState<string | null>(null);

  const openNameEditor = (
    event: MouseEvent<HTMLButtonElement>,
    activity: Activity
  ) => {
    event.stopPropagation();
    setEditingActivity(activity);
    setDraftName(activity.name || getSportLabel(activity.type, locale));
    setGithubToken('');
    setSaveError('');
    setCommitUrl(null);
  };

  const saveActivityName = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingActivity || !draftName.trim() || !githubToken.trim()) return;
    setSavingName(true);
    setSaveError('');
    try {
      const url = await commitActivityName(
        editingActivity.run_id,
        draftName.trim(),
        githubToken.trim()
      );
      onActivityRenamed?.(editingActivity.run_id, draftName.trim());
      setCommitUrl(url);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
    } finally {
      setGithubToken('');
      setSavingName(false);
    }
  };

  const distFiltered = activities.filter((a) => {
    const km = a.distance / 1000;
    switch (distFilter) {
      case '10':
        return km >= 10 && km < 20;
      case '20':
        return km >= 20 && km < 40;
      case '40':
        return km >= 40;
      default:
        return true;
    }
  });

  const sorted = [...distFiltered].sort(
    (a, b) =>
      new Date(b.start_date_local).getTime() -
      new Date(a.start_date_local).getTime()
  );

  useEffect(() => {
    if (selectedActivity) {
      const idx = sorted.findIndex((a) => a.run_id === selectedActivity.run_id);
      if (idx >= 0) {
        setPage(Math.floor(idx / PAGE_SIZE));
      } else {
        setDistFilter('all');
      }
    }
    // `sorted` is in deps so the page refreshes when the list changes (year/filter switch)
    // even if the selected run_id stays the same — avoids stale closure. M6 fix.
  }, [selectedActivity?.run_id, sorted]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold">{t('activityLog')}</h2>
        <span className="text-sm text-[var(--color-muted)]">
          {t('showing')} {page * PAGE_SIZE + 1}-
          {Math.min((page + 1) * PAGE_SIZE, sorted.length)} {t('of')}{' '}
          {sorted.length}
        </span>
      </div>

      {/* Year tabs */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setYear(null);
            setPage(0);
          }}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${year === null ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
        >
          All
        </button>
        {years.map((y) => (
          <button
            key={y}
            onClick={() => {
              setYear(y);
              setPage(0);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${year === y ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Distance filter */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(
          [
            ['all', t('all')],
            ['10', '10km+'],
            ['20', '20km+'],
            ['40', '40km+'],
          ] as [DistanceFilter, string][]
        ).map(([val, label]) => (
          <button
            key={val}
            onClick={() => {
              setDistFilter(val);
              setPage(0);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${distFilter === val ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted)]">
              <th className="pb-3 font-medium">{t('date')}</th>
              <th className="pb-3 font-medium">{t('type')}</th>
              <th className="pb-3 font-medium">{t('name')}</th>
              <th className="pb-3 font-medium">{t('distance')}</th>
              <th className="pb-3 font-medium">{t('duration')}</th>
              <th className="pb-3 font-medium">
                {locale === 'zh' ? '配速 / 速度' : 'Pace / Speed'}
              </th>
              <th className="pb-3 font-medium">{t('hr')}</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((a) => (
              <tr
                key={a.run_id}
                onClick={() =>
                  onSelectActivity?.(
                    selectedActivity?.run_id === a.run_id ? null : a
                  )
                }
                className={`cursor-pointer border-b border-[var(--color-border)]/30 transition-colors ${
                  selectedActivity?.run_id === a.run_id
                    ? 'border-l-2 border-l-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'hover:bg-[var(--color-bg)]'
                }`}
              >
                <td className="py-3 whitespace-nowrap text-[var(--color-muted)]">
                  {a.start_date_local.slice(0, 16).replace('T', ' ')}
                </td>
                <td className="py-3 whitespace-nowrap">
                  <span className="text-[var(--color-muted)]">
                    {getSportIcon(a.type)} {getSportLabel(a.type, locale)}
                  </span>
                </td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span>{a.name || getSportLabel(a.type, locale)}</span>
                    {adminMode && (
                      <button
                        type="button"
                        onClick={(event) => openNameEditor(event, a)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--color-muted)] opacity-25 transition hover:bg-[var(--color-border)] hover:opacity-100"
                        title={
                          locale === 'zh' ? '修改活动名称' : 'Rename activity'
                        }
                        aria-label={
                          locale === 'zh' ? '修改活动名称' : 'Rename activity'
                        }
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 3.487a2.1 2.1 0 013 2.97L8.15 18.17 4 19l.83-4.15L16.862 3.487z"
                          />
                        </svg>
                      </button>
                    )}
                  </span>
                </td>
                <td className="py-3 font-mono font-medium">
                  {(a.distance / 1000).toFixed(1)}
                  <span className="ml-1 text-xs font-normal text-[var(--color-muted)]">
                    km
                  </span>
                </td>
                <td className="py-3 text-[var(--color-muted)]">
                  {formatDuration(a.moving_time)}
                </td>
                <td className="py-3 text-[var(--color-muted)]">
                  {normalizeSportType(a.type) === 'Ride'
                    ? `${(a.average_speed * 3.6).toFixed(1)} km/h`
                    : `${formatPace(a.average_speed)} /km`}
                </td>
                <td className="py-3 text-[var(--color-muted)]">
                  {a.average_heartrate ? Math.round(a.average_heartrate) : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
        >
          ←
        </button>
        <span className="text-sm text-[var(--color-muted)]">
          {t('page')} {page + 1} {t('pageOf')} {totalPages} {t('pages')}
        </span>
        <button
          onClick={() =>
            setPage((p) => Math.min(Math.max(totalPages - 1, 0), p + 1))
          }
          disabled={page >= totalPages - 1}
          className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
        >
          →
        </button>
      </div>

      {editingActivity && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-name-editor-title"
          onClick={() => !savingName && setEditingActivity(null)}
        >
          <form
            onSubmit={saveActivityName}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 id="activity-name-editor-title" className="font-bold">
                  {locale === 'zh' ? '修改活动名称' : 'Rename activity'}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  ID {editingActivity.run_id} ·{' '}
                  {editingActivity.start_date_local.slice(0, 10)}
                </p>
              </div>
              <button
                type="button"
                disabled={savingName}
                onClick={() => setEditingActivity(null)}
                className="text-xl leading-none text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
                aria-label={locale === 'zh' ? '关闭' : 'Close'}
              >
                ×
              </button>
            </div>

            <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]">
              {locale === 'zh' ? '新名称' : 'New name'}
            </label>
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              maxLength={120}
              autoFocus
              className="mb-4 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />

            <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]">
              GitHub Fine-grained Token
            </label>
            <input
              type="password"
              value={githubToken}
              onChange={(event) => setGithubToken(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="github_pat_..."
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
              {locale === 'zh'
                ? '仅用于本次 GitHub 请求，提交后立即从页面内存清除。Token 只需授权本仓库 Contents: Read and write。'
                : 'Used only for this GitHub request and cleared immediately afterwards. Grant only Contents: Read and write for this repository.'}
            </p>

            {saveError && (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {saveError}
              </p>
            )}
            {commitUrl && (
              <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                {locale === 'zh'
                  ? '已提交到 GitHub，公开页面通常会在约 1 分钟后更新。'
                  : 'Committed to GitHub. The public page normally updates in about a minute.'}{' '}
                <a
                  href={commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {locale === 'zh' ? '查看提交' : 'View commit'}
                </a>
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={savingName}
                onClick={() => setEditingActivity(null)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
              >
                {locale === 'zh' ? '关闭' : 'Close'}
              </button>
              {!commitUrl && (
                <button
                  type="submit"
                  disabled={
                    savingName || !draftName.trim() || !githubToken.trim()
                  }
                  className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  {savingName
                    ? locale === 'zh'
                      ? '提交中…'
                      : 'Saving…'
                    : locale === 'zh'
                      ? '提交到 GitHub'
                      : 'Commit to GitHub'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
