import { Languages } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

export default function LanguageToggle() {
  const { lang, toggleLang } = useLang()
  return (
    <button
      onClick={toggleLang}
      title={lang === 'en' ? 'التبديل للعربية' : 'Switch to English'}
      className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm font-medium"
    >
      <Languages size={16} />
      {lang === 'en' ? 'عربي' : 'EN'}
    </button>
  )
}
