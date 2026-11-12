import { useTranslation } from 'react-i18next'

import { InputPanel } from './components/InputPanel'
import { ResultPanel } from './components/ResultPanel'
import { LANGUAGES } from './i18n'

function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage ?? 'en'
  return (
    <select
      value={current}
      onChange={(e) => void i18n.changeLanguage(e.target.value)}
      aria-label="Language"
      className="rounded-[4px] border border-rule bg-sheet px-2 py-1 text-sm text-ink-soft focus:border-gem focus:outline-none"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  )
}

export default function App() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight text-ink">
              {t('app.title')}
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted">{t('app.subtitle')}</p>
          </div>
          <LanguageSwitcher />
        </header>

        <main className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <InputPanel />
          <ResultPanel />
        </main>

        <footer className="mt-8 border-t border-rule pt-3 text-[11px] leading-snug text-ink-muted">
          {t('footer.disclaimer')}
        </footer>
      </div>
    </div>
  )
}
