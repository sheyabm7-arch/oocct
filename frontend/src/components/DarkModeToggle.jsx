import { Moon, Sun } from 'lucide-react'

export default function DarkModeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
