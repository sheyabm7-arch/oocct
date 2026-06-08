import { useState } from 'react'
import { Eye as EyeIcon, EyeOff, Lock, CheckCircle, Loader2 } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

const BASE = ''

const strength = (pwd, t) => {
  if (pwd.length < 6) return { level: 0, label: t('tooShort'), color: 'bg-red-400' }
  let score = 0
  if (pwd.length >= 8)   score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 1) return { level: 1, label: t('weak'),   color: 'bg-red-400' }
  if (score === 2) return { level: 2, label: t('fair'),   color: 'bg-orange-400' }
  if (score === 3) return { level: 3, label: t('medium'), color: 'bg-yellow-400' }
  return              { level: 4, label: t('strong'),  color: 'bg-green-500' }
}

export default function ResetPassword({ email, otpCode, onSuccess }) {
  const { t } = useLang()
  const [newPwd, setNewPwd]     = useState('')
  const [confirm, setConfirm]   = useState('')
  const [show1, setShow1]       = useState(false)
  const [show2, setShow2]       = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)

  const pwdStrength = strength(newPwd, t)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPwd !== confirm) { setError(t('passwordsNoMatch')); return }
    if (newPwd.length < 6) { setError('Password must be at least 6 characters'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode, newPassword: newPwd }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else { setDone(true); setTimeout(onSuccess, 2000) }
    } catch {
      setError('Cannot connect to server.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="min-h-screen bg-[#e8ecf4] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-500" size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('passwordChanged')}</h2>
        <p className="text-gray-500 text-sm">{t('passwordChangedSub')}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#e8ecf4] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-600 rounded-full w-14 h-14 flex items-center justify-center mb-3">
            <Lock className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{t('platformName')}</h1>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">{t('setNewPassword')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('setNewPasswordSub')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('newPassword')}</label>
            <div className="relative">
              <input type={show1 ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} required
                placeholder={t('enterNewPassword')}
                className="w-full px-4 py-3 pr-11 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShow1(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show1 ? <EyeOff size={17} /> : <EyeIcon size={17} />}
              </button>
            </div>
            {/* Strength indicator */}
            {newPwd && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= pwdStrength.level ? pwdStrength.color : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className={`text-xs font-medium ${pwdStrength.level >= 3 ? 'text-green-600' : pwdStrength.level === 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {pwdStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirmPassword')}</label>
            <div className="relative">
              <input type={show2 ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required
                placeholder={t('reenterPassword')}
                className={`w-full px-4 py-3 pr-11 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 transition
                  ${confirm && newPwd !== confirm ? 'ring-2 ring-red-400' : 'focus:ring-blue-500'}`} />
              <button type="button" onClick={() => setShow2(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show2 ? <EyeOff size={17} /> : <EyeIcon size={17} />}
              </button>
            </div>
            {confirm && newPwd !== confirm && <p className="text-xs text-red-500 mt-1">{t('passwordsNoMatch')}</p>}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading || newPwd !== confirm || newPwd.length < 6}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> {t('resetting')}</> : t('resetPasswordBtn')}
          </button>
        </form>
      </div>
    </div>
  )
}
