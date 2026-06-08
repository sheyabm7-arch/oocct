import { useState, useEffect, useRef } from 'react'
import { Camera, Edit2, Save, X, User, Phone, Calendar, Users, FileText, Stethoscope, Lock, ImageIcon, Trash2, Lock as LockIcon } from 'lucide-react'
import { getToken, getPatientImages, deletePatientImage } from '../../api'
import { useLang } from '../../context/LanguageContext'

const BASE = ''
const authHdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

export default function PatientProfile({ user, onUserUpdate }) {
  const [profile, setProfile]   = useState(null)
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [pwdForm, setPwdForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwdMsg, setPwdMsg]     = useState(null)
  const [reports, setReports]   = useState([])
  const [doctors, setDoctors]   = useState([])
  const [gallery, setGallery]   = useState([])
  const [viewImage, setViewImage] = useState(null)
  const picRef = useRef()
  const { t } = useLang()

  useEffect(() => {
    fetch(`${BASE}/api/profile/${user.id}`, { headers: authHdr() })
      .then(r => r.json()).then(setProfile)
    fetch(`${BASE}/api/reports/patient/${user.id}`, { headers: authHdr() })
      .then(r => r.json()).then(d => Array.isArray(d) && setReports(d))
    fetch(`${BASE}/api/users/doctors`, { headers: authHdr() })
      .then(r => r.json()).then(d => Array.isArray(d) && setDoctors(d))
    getPatientImages(user.id).then(d => Array.isArray(d) && setGallery(d))
  }, [user.id])

  const removeImage = async (id) => {
    await deletePatientImage(id)
    setGallery(g => g.filter(img => img.id !== id))
  }

  const startEdit = () => {
    setForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
      gender: profile?.gender || '',
      dateOfBirth: profile?.dateOfBirth || '',
    })
    setEditing(true)
  }

  const changePassword = async () => {
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ error: 'Passwords do not match' }); return
    }
    const res = await fetch(`${BASE}/api/profile/change-password`, {
      method: 'PUT', headers: authHdr(),
      body: JSON.stringify({ userId: String(user.id), currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword }),
    })
    const data = await res.json()
    setPwdMsg(data)
    if (data.message) { setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' }) }
  }

  const saveProfile = async () => {
    setSaving(true)
    const res = await fetch(`${BASE}/api/profile/update`, {
      method: 'PUT', headers: authHdr(),
      body: JSON.stringify({ id: user.id, ...form }),
    })
    const updated = await res.json()
    setProfile(updated)
    onUserUpdate?.(updated)
    setEditing(false)
    setSaving(false)
  }

  const handlePicture = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      await fetch(`${BASE}/api/profile/picture`, {
        method: 'POST', headers: authHdr(),
        body: JSON.stringify({ userId: String(user.id), imageData: reader.result }),
      })
      setProfile(p => ({ ...p, profilePicture: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const consultedDoctors = [...new Set(reports.map(r => r.doctorId))]
    .map(id => doctors.find(d => d.id === id)).filter(Boolean)

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto pb-6">
      {/* ── Facebook-style cover + header ── */}
      <div className="bg-white rounded-b-2xl shadow-sm overflow-hidden">
        {/* Cover */}
        <div className="h-48 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 relative" />

        {/* Avatar + name row */}
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16">
            <div className="relative">
              <div className="w-36 h-36 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                {profile.profilePicture
                  ? <img src={profile.profilePicture} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-4xl font-bold text-gray-500">{initials(profile.name)}</span>}
              </div>
              <button onClick={() => picRef.current.click()}
                className="absolute bottom-2 right-2 w-9 h-9 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full flex items-center justify-center shadow border-2 border-white transition">
                <Camera size={16} />
              </button>
              <input ref={picRef} type="file" accept="image/*" className="hidden" onChange={handlePicture} />
            </div>
            <div className="flex-1 sm:pb-3">
              <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
            <div className="flex gap-2 sm:pb-3">
              {!editing ? (
                <>
                  <button onClick={() => { setShowChangePwd(!showChangePwd); setPwdMsg(null) }}
                    className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                    <Lock size={15} /> {t('changePassword')}
                  </button>
                  <button onClick={startEdit} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                    <Edit2 size={15} /> {t('editProfile')}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
                    <X size={15} /> {t('cancel')}
                  </button>
                  <button onClick={saveProfile} disabled={saving} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                    <Save size={15} /> {saving ? t('saving') : t('save')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab strip */}
        <div className="border-t border-gray-100 px-6 flex gap-1 text-sm font-medium text-gray-500">
          <span className="py-3 px-3 border-b-2 border-blue-600 text-blue-600">{t('navProfile')}</span>
        </div>
      </div>

      {/* Change Password Card */}
      {showChangePwd && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Lock size={18} className="text-blue-600" /> {t('changePassword')}</h3>
          <div className="space-y-3 max-w-sm">
            {[
              { label: t('currentPassword'), key: 'currentPassword' },
              { label: t('newPassword'), key: 'newPassword' },
              { label: t('confirmPassword'), key: 'confirmPassword' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input type="password" value={pwdForm[key]}
                  onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            {pwdMsg && (
              <p className={`text-sm font-medium ${pwdMsg.error ? 'text-red-500' : 'text-green-600'}`}>
                {pwdMsg.error || pwdMsg.message}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={changePassword}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                {t('updatePassword')}
              </button>
              <button onClick={() => { setShowChangePwd(false); setPwdMsg(null) }}
                className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Two-column body: Intro (left) + content (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
        {/* LEFT — Intro */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><User size={18} className="text-blue-600" /> {t('personalInfo')}</h3>
            </div>

            {editing ? (
              <div className="space-y-3">
                {[
                  { label: t('fullName'), key: 'name', type: 'text' },
                  { label: t('phone'), key: 'phone', type: 'tel' },
                  { label: t('dateOfBirth'), key: 'dateOfBirth', type: 'date' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <input type={type} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('gender')}</label>
                  <select value={form.gender || ''} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">—</option>
                    <option value="Male">{t('male')}</option>
                    <option value="Female">{t('female')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('bio')}</label>
                  <textarea value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {profile.bio && <p className="text-sm text-gray-700 text-center pb-2 border-b border-gray-50">{profile.bio}</p>}
                {[
                  { icon: User, label: t('fullName'), value: profile.name },
                  { icon: Phone, label: t('phone'), value: profile.phone || '—' },
                  { icon: Calendar, label: t('dateOfBirth'), value: profile.dateOfBirth || '—' },
                  { icon: Users, label: t('gender'), value: profile.gender || '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon size={17} className="text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-700"><span className="text-gray-400">{label}:</span> <span className="font-medium">{value}</span></p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">Stats</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: t('totalReports'), value: reports.length, color: 'blue' },
                { label: t('reviewed'), value: reports.filter(r => r.status === 'REVIEWED').length, color: 'green' },
                { label: t('doctorsConsulted'), value: consultedDoctors.length, color: 'purple' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Doctors consulted */}
          {consultedDoctors.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Stethoscope size={18} className="text-blue-600" /> {t('doctorsConsulted')}</h3>
              <div className="space-y-2">
                {consultedDoctors.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                      {initials(doc.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Dr. {doc.name}</p>
                      <p className="text-xs text-gray-400">{reports.filter(r => r.doctorId === doc.id).length} report(s)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Recent Reports */}
          {reports.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-600" /> {t('recentReports')}</h3>
              <div className="space-y-2">
                {reports.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.type}</p>
                      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.status === 'REVIEWED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.status === 'REVIEWED' ? t('reviewed') : t('pending')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Private OCT Image Gallery */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-600" /> {t('myOctImages')}
              </h3>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <LockIcon size={12} /> {t('privateOnlyYou')}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4">{t('everySavedAuto')}</p>

            {gallery.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <ImageIcon size={48} className="mb-3" />
                <p className="text-sm text-gray-400">{t('noImagesYet')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('uploadInAnyTool')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {gallery.map(img => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-100">
                    <img src={img.imageData} alt="OCT"
                      onClick={() => setViewImage(img)}
                      className="w-full h-28 object-cover bg-black cursor-pointer" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                      <p className="text-[10px] text-white font-medium truncate">{img.source}</p>
                      <p className="text-[9px] text-gray-300">{new Date(img.uploadedAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => removeImage(img.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer */}
      {viewImage && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2 text-white">
              <div>
                <p className="font-semibold">{viewImage.source}</p>
                <p className="text-xs text-gray-300">{new Date(viewImage.uploadedAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setViewImage(null)} className="text-white hover:text-gray-300"><X size={22} /></button>
            </div>
            <img src={viewImage.imageData} alt="OCT" className="w-full rounded-xl object-contain max-h-[75vh] bg-black" />
          </div>
        </div>
      )}
    </div>
  )
}
