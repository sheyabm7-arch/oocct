import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  BookOpen, Activity, Sparkles, Droplets, FileText, MessageCircle, LogOut, Eye, Users, UserCircle, MapPin
} from 'lucide-react'
import { getMessages } from '../api'
import FloatingChatbot from './FloatingChatbot'
import DarkModeToggle from './DarkModeToggle'
import LanguageToggle from './LanguageToggle'
import { useDarkMode } from '../hooks/useDarkMode'
import { useLang } from '../context/LanguageContext'

const navItems = [
  { key: 'navOverview', path: '/', icon: BookOpen },
  { key: 'navDiagnosis', path: '/diagnosis', icon: Activity },
  { key: 'navEnhancement', path: '/enhancement', icon: Sparkles },
  { key: 'navFluid', path: '/fluid', icon: Droplets },
  { key: 'navReports', path: '/reports', icon: FileText },
  { key: 'navFindDoctors', path: '/find-doctors', icon: MapPin },
  { key: 'navMessages', path: '/messages', icon: MessageCircle },
  { key: 'navProfile', path: '/profile', icon: UserCircle },
]

export default function PatientLayout({ user, onLogout, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadIds, setUnreadIds] = useState(new Set())
  const [dark, toggleDark] = useDarkMode()
  const { t } = useLang()

  useEffect(() => {
    if (!user?.id) return
    getMessages(user.id).then((data) => {
      if (!Array.isArray(data)) return
      const ids = new Set()
      data.filter((m) => m.receiverId === user.id).forEach((m) => {
        const myLastReply = data
          .filter((x) => x.senderId === user.id && x.receiverId === m.senderId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        if (!myLastReply || new Date(myLastReply.createdAt) < new Date(m.createdAt)) {
          ids.add(m.senderId)
        }
      })
      setUnreadIds(ids)
    })
  }, [user?.id])

  useEffect(() => {
    const handler = (e) => {
      setUnreadIds((prev) => { const next = new Set(prev); next.delete(e.detail.id); return next })
    }
    window.addEventListener('conv-read', handler)
    return () => window.removeEventListener('conv-read', handler)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{t('platformName')}</h1>
          <p className="text-sm text-gray-500">{t('welcome')}, {user.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <DarkModeToggle dark={dark} onToggle={toggleDark} />
          <button
            onClick={onLogout}
            className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
        </div>
      </header>

      <div className="flex p-4 gap-4">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">{t('portalPatient')}</p>
            <nav className="space-y-1">
              {navItems.map(({ key, path, icon: Icon }) => {
                const active = location.pathname === path
                const showBadge = key === 'navMessages' && unreadIds.size > 0
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="relative">
                      <Icon size={17} />
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    {t(key)}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">{t('quickInfo')}</p>
            <div>
              <p className="text-xs text-blue-600 font-medium">{t('email')}</p>
              <p className="text-sm text-gray-800">{user.email}</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      <FloatingChatbot user={user} />
    </div>
  )
}
