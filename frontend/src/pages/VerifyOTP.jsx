import { useState, useEffect, useRef } from 'react'
import { Eye, ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

const BASE = ''
const TOTAL = 60 // 60 seconds

export default function VerifyOTP({ email, onSuccess, onResend }) {
  const [digits, setDigits]     = useState(Array(6).fill(''))
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [timeLeft, setTimeLeft] = useState(TOTAL)
  const [resending, setResending] = useState(false)
  const refs = useRef([])
  const { t } = useLang()

  useEffect(() => {
    if (timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft])

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[idx] = val
    setDigits(next)
    if (val && idx < 5) refs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...digits]
    text.split('').forEach((c, i) => { next[i] = c })
    setDigits(next)
    refs.current[Math.min(text.length, 5)]?.focus()
  }

  const handleVerify = async () => {
    const otp = digits.join('')
    if (otp.length < 6) { setError('Please enter all 6 digits'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: otp }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else { onSuccess(otp) }
    } catch {
      setError('Cannot connect to server.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    try {
      await fetch(`${BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setDigits(Array(6).fill(''))
      setTimeLeft(TOTAL)
      refs.current[0]?.focus()
    } catch { /* ignore */ }
    setResending(false)
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

        <div className="mb-6 text-center">
          <h2 className="text-lg font-bold text-gray-900">{t('enterVerification')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('codeSentTo')}</p>
          <p className="text-sm font-semibold text-blue-600 mt-0.5">{email}</p>
        </div>

        {/* OTP Boxes */}
        <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input key={i} ref={el => refs.current[i] = el}
              type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition
                ${d ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-900'}
                focus:border-blue-500 focus:bg-blue-50`}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="text-center mb-4">
          {timeLeft > 0
            ? <p className="text-sm text-gray-500">{t('codeExpiresIn')} <span className={`font-bold ${timeLeft <= 60 ? 'text-red-500' : 'text-gray-700'}`}>{fmt(timeLeft)}</span></p>
            : <button onClick={handleResend} disabled={resending}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium mx-auto transition disabled:opacity-50">
                <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                {resending ? t('sending') : t('resendCode')}
              </button>
          }
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

        <button onClick={handleVerify} disabled={loading || digits.join('').length < 6}
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={18} className="animate-spin" /> {t('verifying')}</> : t('verifyCode')}
        </button>

        <button onClick={onResend} className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition mx-auto">
          <ArrowLeft size={15} /> {t('back')}
        </button>
      </div>
    </div>
  )
}
