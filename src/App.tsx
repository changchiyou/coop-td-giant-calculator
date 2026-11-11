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
      className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-200 focus:border-sky-400 focus:outline-none"
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
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t('app.title')}</h1>
            <p className="mt-1 text-sm text-slate-400">{t('app.subtitle')}</p>
          </div>
          <LanguageSwitcher />
        </header>

        <main className="grid gap-4 lg:grid-cols-2">
          <InputPanel />
          <ResultPanel />
        </main>

        <footer className="mt-6 text-[11px] leading-snug text-slate-500">{t('footer.disclaimer')}</footer>
      </div>
    </div>
  )
}
