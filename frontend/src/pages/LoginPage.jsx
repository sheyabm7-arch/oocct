import { useState } from 'react'
import { Eye } from 'lucide-react'
import { login, register } from '../api'
import { countries } from '../data/countries'
import DarkModeToggle from '../components/DarkModeToggle'
import LanguageToggle from '../components/LanguageToggle'
import { useDarkMode } from '../hooks/useDarkMode'
import { useLang } from '../context/LanguageContext'

export default function LoginPage({ onLogin, onForgotPassword }) {
  const [tab, setTab] = useState('login')
  const [dark, toggleDark] = useDarkMode()
  const { t } = useLang()
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', role: 'PATIENT', country: '', city: '', clinicName: '', clinicAddress: '' })
  const [docs, setDocs] = useState({ idDocument: null, specialtyCertificate: null, practiceLicense: null })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const readFile = (key) => (e) => {
    const file = e.target.files?.[0]
    if (!file) { setDocs((d) => ({ ...d, [key]: null })); return }
    if (!file.type.startsWith('image/')) { setError('Please upload image files only.'); return }
    const reader = new FileReader()
    reader.onload = () => setDocs((d) => ({ ...d, [key]: reader.result }))
    reader.readAsDataURL(file)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(loginData.email, loginData.password)
      if (data.error) {
        setError(data.error)
      } else {
        onLogin({ ...data, role: data.role.toLowerCase() })
      }
    } catch {
      setError('Cannot connect to server. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!registerData.name || !registerData.email || !registerData.password) {
      setError('Please fill all fields.')
      return
    }
    if (registerData.role === 'DOCTOR' && (!docs.idDocument || !docs.specialtyCertificate || !docs.practiceLicense)) {
      setError('Doctors must upload all 3 documents: ID/passport, ophthalmology specialty certificate, and practice license.')
      return
    }
    if (!registerData.country) {
      setError('Please select your country.')
      return
    }
    setLoading(true)
    try {
      const data = await register(registerData.name, registerData.email, registerData.password, registerData.role, docs, {
        country: registerData.country,
        city: registerData.city,
        clinicName: registerData.clinicName,
        clinicAddress: registerData.clinicAddress,
      })
      if (data.error) {
        setError(data.error)
      } else {
        setTab('login')
        setError('')
        setDocs({ idDocument: null, specialtyCertificate: null, practiceLicense: null })
        alert(registerData.role === 'DOCTOR'
          ? 'Registered! Your documents were sent to the admin. You can log in once approved.'
          : 'Registered successfully! Please login.')
      }
    } catch {
      setError('Cannot connect to server. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#e8ecf4] dark:bg-gray-900 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <DarkModeToggle dark={dark} onToggle={toggleDark} />
      </div>
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-600 rounded-full w-14 h-14 flex items-center justify-center mb-3">
            <Eye className="text-white" size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{t('platformName')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('secureAccess')}</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-full p-1 mb-6">
          <button
            onClick={() => { setTab('login'); setError('') }}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
              tab === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            {t('login')}
          </button>
          <button
            onClick={() => { setTab('register'); setError('') }}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
              tab === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            {t('register')}
          </button>
        </div>

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
              <input
                type="email"
                placeholder={t('enterEmail')}
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
              <input
                type="password"
                placeholder={t('enterPassword')}
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={onForgotPassword}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition">
                {t('forgotPassword')}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? t('loggingIn') : t('login')}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Register as</label>
              <select
                value={registerData.role}
                onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                value={registerData.country}
                onChange={(e) => setRegisterData({ ...registerData, country: e.target.value })}
                className="w-full px-3 py-3 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select country</option>
                {countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            {/* Doctor clinic info */}
            {registerData.role === 'DOCTOR' && (
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vision Care Eye Center"
                    value={registerData.clinicName}
                    onChange={(e) => setRegisterData({ ...registerData, clinicName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Address</label>
                  <input
                    type="text"
                    placeholder="Street, building, area"
                    value={registerData.clinicAddress}
                    onChange={(e) => setRegisterData({ ...registerData, clinicAddress: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {registerData.role === 'DOCTOR' && (
              <div className="space-y-3 border border-blue-100 bg-blue-50/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700">
                  Doctor verification — upload 3 images to prove you are an eye doctor.
                  Sent to the admin for approval.
                </p>
                {[
                  { key: 'idDocument', label: '1. National ID or Passport' },
                  { key: 'specialtyCertificate', label: '2. Ophthalmology Specialty Certificate' },
                  { key: 'practiceLicense', label: '3. Current Practice License' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={readFile(key)}
                      className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800 file:cursor-pointer"
                    />
                    {docs[key] && (
                      <span className="inline-block mt-1 text-xs text-green-600">✓ uploaded</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
