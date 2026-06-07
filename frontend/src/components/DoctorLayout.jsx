import { useState, useEffect } from 'react'
import { FileText, Sparkles, MessageCircle, LogOut, Stethoscope, UserCircle } from 'lucide-react'
import DoctorPendingReports from '../pages/doctor/DoctorPendingReports'
import DoctorEnhancement from '../pages/doctor/DoctorEnhancement'
import DoctorMessages from '../pages/doctor/DoctorMessages'
import DoctorProfileEdit from '../pages/doctor/DoctorProfileEdit'
import { getMessages } from '../api'
import DarkModeToggle from './DarkModeToggle'
import LanguageToggle from './LanguageToggle'
import { useDarkMode } from '../hooks/useDarkMode'
import { useLang } from '../context/LanguageContext'

export default function DoctorLayout({ user, onLogout }) {
  const [page, setPage] = useState('reports')
  const [dark, toggleDark] = useDarkMode()
  const { t } = useLang()
  const [openPatientId, setOpenPatientId] = useState(null)
  const [unreadPatientIds, setUnreadPatientIds] = useState(new Set())

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
      setUnreadPatientIds(ids)
    })
  }, [user?.id])

  const handleMarkRead = (patientId) => {
    setUnreadPatientIds((prev) => { const next = new Set(prev); next.delete(patientId); return next })
  }

  const handleOpenMessages = (patientId) => {
    setOpenPatientId(patientId)
    handleMarkRead(patientId)
    setPage('messages')
  }

  const renderPage = () => {
    if (page === 'reports')     return <DoctorPendingReports user={user} onMessagePatient={handleOpenMessages} />
    if (page === 'enhancement') return <DoctorEnhancement />
    if (page === 'messages')    return <DoctorMessages user={user} initialPatientId={openPatientId} unreadPatientIds={unreadPatientIds} onMarkRead={handleMarkRead} />
    if (page === 'profile')     return <DoctorProfileEdit user={user} />
  }

  return (
    <div className="min-h-screen bg-gray-100">
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
        <aside className="w-64 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">{t('portalDoctor')}</p>
            <nav className="space-y-1">
              {[
                { label: t('navPending'), icon: FileText, key: 'reports' },
                { label: t('navEnhance'), icon: Sparkles, key: 'enhancement' },
                { label: t('navMessages'), icon: MessageCircle, key: 'messages', badge: unreadPatientIds.size > 0 },
                { label: t('navProfile'), icon: UserCircle, key: 'profile' },
              ].map(({ label, icon: Icon, key, badge }) => (
                <button
                  key={key}
                  onClick={() => setPage(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    page === key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="relative">
                    <Icon size={17} />
                    {badge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">{t('portalDoctor')}</p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Stethoscope size={20} className="text-blue-600" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-green-500 font-medium">{t('online')}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">{t('email')}</p>
              <p className="text-sm text-gray-800">{user.email}</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">{renderPage()}</main>
      </div>
    </div>
  )
}
