import type { Activity, SportFilter } from '../types';
import { useLocale } from '../hooks/useLocale';
import { matchesSportFilter, PRIMARY_SPORTS } from '../core/sports';

type Page = 'home' | 'tracks';

interface HeaderProps {
  dark: boolean;
  toggleTheme: () => void;
  activities: Activity[];
  filter: SportFilter;
  onFilterChange: (filter: SportFilter) => void;
  page: Page;
  onNavigate: (p: Page) => void;
}

export function Header({
  dark,
  toggleTheme,
  activities,
  filter,
  onFilterChange,
  page,
  onNavigate,
}: HeaderProps) {
  const { locale, setLocale, t } = useLocale();

  const navItems: { label: string; page: Page }[] = [
    { label: t('home'), page: 'home' },
    { label: t('tracks'), page: 'tracks' },
  ];

  const availableSports = PRIMARY_SPORTS.filter((sport) =>
    activities.some((activity) => matchesSportFilter(activity.type, sport.type))
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/70 backdrop-blur-md">
      <div className="mx-auto max-w-[1400px] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex min-w-0 items-center gap-2"
            aria-label="Outdoor Page home"
          >
            <span className="text-xl font-bold text-[var(--color-text)]">
              OUTDOOR<span className="text-[var(--color-accent)]">.</span>PAGE
            </span>
          </button>

          {/* Utility actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-card)]"
              aria-label={dark ? 'Use light theme' : 'Use dark theme'}
            >
              {dark ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
              title={locale === 'zh' ? 'Switch to English' : '切换中文'}
            >
              {locale === 'zh' ? 'EN' : '中'}
            </button>
            <a
              href="https://github.com/YeWeihong/workoutspage"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
              title="GitHub"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Navigation and sport filters scroll horizontally on narrow screens. */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 sm:gap-3">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                item.page === page
                  ? 'border-transparent bg-[var(--color-accent)] text-white'
                  : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="h-5 w-px shrink-0 bg-[var(--color-border)]" />
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              filter === 'all'
                ? 'border-transparent bg-[var(--color-accent)] text-white'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {t('all')}
          </button>
          {availableSports.map((sport) => (
            <button
              type="button"
              key={sport.type}
              onClick={() => onFilterChange(sport.type)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                filter === sport.type
                  ? 'border-transparent text-white'
                  : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
              style={
                filter === sport.type ? { backgroundColor: sport.color } : {}
              }
            >
              <span aria-hidden="true">{sport.icon}</span>{' '}
              {locale === 'zh' ? sport.zh : sport.en}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
