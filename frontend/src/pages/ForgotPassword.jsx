import { useState } from 'react'
import { Eye, ArrowLeft, Mail, Loader2 } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

const BASE = ''

export default function ForgotPassword({ onBack, onSuccess }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { t } = useLang()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else { onSuccess(email) }
    } catch {
      setError('Cannot connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#e8ecf4] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-600 rounded-full w-14 h-14 flex items-center justify-center mb-3">
            <Eye className="text-white" size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{t('platformName')}</h1>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">{t('forgotTitle')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('forgotSub')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('emailAddress')}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder={t('enterEmail')}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> {t('sending')}</> : t('sendCode')}
          </button>
        </form>

        <button onClick={onBack} className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition mx-auto">
          <ArrowLeft size={15} /> {t('backToLogin')}
        </button>
      </div>
    </div>
  )
}
