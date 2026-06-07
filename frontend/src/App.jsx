import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOTP from './pages/VerifyOTP'
import ResetPassword from './pages/ResetPassword'
import PatientLayout from './components/PatientLayout'
import DoctorLayout from './components/DoctorLayout'
import AdminLayout from './components/AdminLayout'
import Overview from './pages/patient/Overview'
import AIDiagnosis from './pages/patient/AIDiagnosis'
import ImageEnhancement from './pages/patient/ImageEnhancement'
import FluidQuantification from './pages/patient/FluidQuantification'
import MyReports from './pages/patient/MyReports'
import Messages from './pages/patient/Messages'
import PatientProfile from './pages/patient/PatientProfile'
import DoctorPublicProfile from './pages/patient/DoctorPublicProfile'
import DoctorsList from './pages/patient/DoctorsList'
import DoctorsByLocation from './pages/patient/DoctorsByLocation'
import { ReportsProvider } from './context/ReportsContext'
import { setOnlineStatus, clearToken } from './api'

export default function App() {
  const [user, setUser]         = useState(null)
  const [authStep, setAuthStep] = useState('login')   // login | forgot | verify | reset
  const [resetEmail, setResetEmail] = useState('')
  const [resetOtp, setResetOtp]     = useState('')

  useEffect(() => {
    if (!user?.id) return
    setOnlineStatus(user.id, true)
    const goOffline = () => setOnlineStatus(user.id, false)
    window.addEventListener('beforeunload', goOffline)
    return () => {
      window.removeEventListener('beforeunload', goOffline)
    }
  }, [user?.id])

  const handleLogout = () => {
    if (user?.id) setOnlineStatus(user.id, false)
    clearToken()
    setUser(null)
  }

  if (!user) {
    if (authStep === 'forgot') return (
      <ForgotPassword
        onBack={() => setAuthStep('login')}
        onSuccess={(email) => { setResetEmail(email); setAuthStep('verify') }}
      />
    )
    if (authStep === 'verify') return (
      <VerifyOTP
        email={resetEmail}
        onSuccess={(otp) => { setResetOtp(otp); setAuthStep('reset') }}
        onResend={() => setAuthStep('forgot')}
      />
    )
    if (authStep === 'reset') return (
      <ResetPassword
        email={resetEmail}
        otpCode={resetOtp}
        onSuccess={() => setAuthStep('login')}
      />
    )
    return <LoginPage onLogin={setUser} onForgotPassword={() => setAuthStep('forgot')} />
  }

  if (user.role === 'admin') {
    return <AdminLayout user={user} onLogout={handleLogout} />
  }

  if (user.role === 'doctor') {
    return <DoctorLayout user={user} onLogout={handleLogout} />
  }

  return (
    <ReportsProvider userId={user.id}>
      <BrowserRouter>
        <PatientLayout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Overview user={user} />} />
            <Route path="/diagnosis" element={<AIDiagnosis user={user} />} />
            <Route path="/enhancement" element={<ImageEnhancement user={user} />} />
            <Route path="/fluid" element={<FluidQuantification user={user} />} />
            <Route path="/reports" element={<MyReports user={user} />} />
            <Route path="/messages" element={<Messages user={user} />} />
            <Route path="/profile" element={<PatientProfile user={user} />} />
            <Route path="/doctors" element={<DoctorsList />} />
            <Route path="/find-doctors" element={<DoctorsByLocation />} />
            <Route path="/doctor/:doctorId" element={<DoctorPublicProfile user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </PatientLayout>
      </BrowserRouter>
    </ReportsProvider>
  )
}
