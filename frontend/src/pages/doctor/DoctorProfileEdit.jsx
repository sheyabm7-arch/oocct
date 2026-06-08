import { useState, useEffect, useRef } from 'react'
import { Camera, Edit2, Save, X, Plus, Trash2, Award, Zap, Star, Building2, MapPin, Clock, DollarSign, Lock, Navigation, Stethoscope } from 'lucide-react'
import StarRating from '../../components/StarRating'
import { getToken } from '../../api'
import { countries, openInMaps, mapEmbedSrc } from '../../data/countries'
import LocationPickerModal from '../../components/LocationPickerModal'
import { useLang } from '../../context/LanguageContext'

const BASE = ''
const authHdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

const PROFICIENCY = ['Beginner', 'Intermediate', 'Expert']
const PROFICIENCY_COLORS = {
  'Beginner': 'bg-gray-100 text-gray-600',
  'Intermediate': 'bg-blue-100 text-blue-700',
  'Expert': 'bg-purple-100 text-purple-700',
}

export default function DoctorProfileEdit({ user }) {
  const [profile, setProfile]   = useState(null)
  const [ratings, setRatings]   = useState([])
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)
  const [tab, setTab]           = useState('profile') // profile | certificates | ratings
  const { t }                   = useLang()
  const [locating, setLocating] = useState(false)
  const [locStatus, setLocStatus] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  // Certificate form
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [pwdForm, setPwdForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwdMsg, setPwdMsg]     = useState(null)

  const [certForm, setCertForm] = useState({ certificateName: '', institution: '', yearObtained: '', certificateImage: '' })
  const [addingCert, setAddingCert] = useState(false)

  // Skill form
  const [skillForm, setSkillForm] = useState({ skillName: '', proficiencyLevel: 'Intermediate' })
  const [addingSkill, setAddingSkill] = useState(false)

  const picRef  = useRef()
  const certImgRef = useRef()

  useEffect(() => {
    fetch(`${BASE}/api/doctor/profile/${user.id}`, { headers: authHdr() })
      .then(r => r.json()).then(setProfile)
    fetch(`${BASE}/api/rating/doctor/${user.id}`, { headers: authHdr() })
      .then(r => r.json()).then(d => Array.isArray(d) && setRatings(d))
  }, [user.id])

  const startEdit = () => {
    setForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
      gender: profile?.gender || '',
      specialty: profile?.specialty || '',
      hospital: profile?.hospital || '',
      clinicLocation: profile?.clinicLocation || '',
      yearsExperience: profile?.yearsExperience || '',
      consultationFee: profile?.consultationFee || '',
      country: profile?.country || '',
      city: profile?.city || '',
      clinicName: profile?.clinicName || '',
      clinicAddress: profile?.clinicAddress || '',
      clinicLatitude: profile?.clinicLatitude ?? null,
      clinicLongitude: profile?.clinicLongitude ?? null,
    })
    setLocStatus(profile?.clinicLatitude != null ? `📍 Pinned at ${profile.clinicLatitude}, ${profile.clinicLongitude}` : '')
    setTab('profile')
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
    if (data.message) setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const saveProfile = async () => {
    setSaving(true)
    await fetch(`${BASE}/api/doctor/profile/update`, {
      method: 'PUT', headers: authHdr(),
      body: JSON.stringify({ doctorId: user.id, ...form }),
    })
    // Refresh
    const res = await fetch(`${BASE}/api/doctor/profile/${user.id}`, { headers: authHdr() })
    setProfile(await res.json())
    setEditing(false)
    setSaving(false)
  }

  // Capture the doctor's current GPS position as the clinic pin
  const pinCurrentLocation = () => {
    if (!navigator.geolocation) { setLocStatus('Geolocation not supported by your browser'); return }
    setLocating(true)
    setLocStatus('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = +pos.coords.latitude.toFixed(6)
        const lng = +pos.coords.longitude.toFixed(6)
        setForm(f => ({ ...f, clinicLatitude: lat, clinicLongitude: lng }))
        setLocStatus(`📍 Pinned at ${lat}, ${lng}`)
        setLocating(false)
      },
      () => { setLocStatus('Could not get your location. Please allow location access.'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
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

  const handleCertImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCertForm(f => ({ ...f, certificateImage: reader.result }))
    reader.readAsDataURL(file)
  }

  const addCertificate = async () => {
    if (!certForm.certificateName) return
    const res = await fetch(`${BASE}/api/doctor/certificates/add`, {
      method: 'POST', headers: authHdr(),
      body: JSON.stringify({ ...certForm, doctorId: user.id, yearObtained: Number(certForm.yearObtained) || null }),
    })
    const saved = await res.json()
    setProfile(p => ({ ...p, certificates: [...(p.certificates || []), saved] }))
    setCertForm({ certificateName: '', institution: '', yearObtained: '', certificateImage: '' })
    setAddingCert(false)
  }

  const deleteCertificate = async (id) => {
    await fetch(`${BASE}/api/doctor/certificates/${id}`, { method: 'DELETE', headers: authHdr() })
    setProfile(p => ({ ...p, certificates: p.certificates.filter(c => c.id !== id) }))
  }

  const addSkill = async () => {
    if (!skillForm.skillName) return
    const res = await fetch(`${BASE}/api/doctor/skills/add`, {
      method: 'POST', headers: authHdr(),
      body: JSON.stringify({ ...skillForm, doctorId: user.id }),
    })
    const saved = await res.json()
    setProfile(p => ({ ...p, skills: [...(p.skills || []), saved] }))
    setSkillForm({ skillName: '', proficiencyLevel: 'Intermediate' })
    setAddingSkill(false)
  }

  const deleteSkill = async (id) => {
    await fetch(`${BASE}/api/doctor/skills/${id}`, { method: 'DELETE', headers: authHdr() })
    setProfile(p => ({ ...p, skills: p.skills.filter(s => s.id !== id) }))
  }

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto pb-6 space-y-4">
      {/* ── Facebook-style cover + header ── */}
      <div className="bg-white rounded-b-2xl shadow-sm overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16">
            <div className="relative">
              <div className="w-36 h-36 rounded-full border-4 border-white shadow-lg overflow-hidden bg-blue-100 flex items-center justify-center">
                {profile.profilePicture
                  ? <img src={profile.profilePicture} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-4xl font-bold text-blue-600">{initials(profile.name)}</span>}
              </div>
              <button onClick={() => picRef.current.click()}
                className="absolute bottom-2 right-2 w-9 h-9 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full flex items-center justify-center shadow border-2 border-white transition">
                <Camera size={16} />
              </button>
              <input ref={picRef} type="file" accept="image/*" className="hidden" onChange={handlePicture} />
            </div>
            <div className="flex-1 sm:pb-3">
              <h2 className="text-2xl font-bold text-gray-900">Dr. {profile.name}</h2>
              {profile.specialty && <p className="text-blue-600 text-sm font-medium">{profile.specialty}</p>}
              <div className="flex items-center gap-2 mt-1">
                <StarRating value={Math.round(profile.averageRating || 0)} readonly size={15} />
                <span className="text-xs text-gray-400">{profile.averageRating || 0} ({profile.totalRatings} ratings)</span>
              </div>
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
        <div className="border-t border-gray-100 px-6 flex gap-1 text-sm font-medium text-gray-500">
          {[
            { key: 'profile', label: t('profileTab') },
            { key: 'certificates', label: t('certificates') },
            { key: 'ratings', label: t('ratings') },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`py-3 px-3 border-b-2 transition ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Change Password */}
      {showChangePwd && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Lock size={18} className="text-blue-600" /> Change Password</h3>
          <div className="space-y-3 max-w-sm">
            {[
              { label: 'Current Password', key: 'currentPassword' },
              { label: 'New Password', key: 'newPassword' },
              { label: 'Confirm New Password', key: 'confirmPassword' },
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
                Update Password
              </button>
              <button onClick={() => { setShowChangePwd(false); setPwdMsg(null) }}
                className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PROFILE TAB ─── */}
      {tab === 'profile' && (
      <div className="space-y-4">

      {/* Professional Info */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">{t('professionalInfo')}</h3>
        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Full Name', key: 'name' },
              { label: 'Specialty', key: 'specialty' },
              { label: 'Hospital', key: 'hospital' },
              { label: 'Clinic Location', key: 'clinicLocation' },
              { label: 'Years of Experience', key: 'yearsExperience', type: 'number' },
              { label: 'Consultation Fee ($)', key: 'consultationFee', type: 'number' },
              { label: 'Phone', key: 'phone' },
              { label: 'Gender', key: 'gender' },
              { label: 'Clinic Name', key: 'clinicName' },
              { label: 'Clinic Address', key: 'clinicAddress' },
            ].map(({ label, key, type = 'text' }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input type={type} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
              <select value={form.country || ''} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select country</option>
                {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Bio / About</label>
              <textarea value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={4}
                placeholder="Tell patients about yourself..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            {/* Clinic GPS pin */}
            <div className="col-span-2 border border-blue-100 bg-blue-50/50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Pin your exact clinic location on the map</p>
              <div className="flex items-center gap-3 flex-wrap">
                <button type="button" onClick={() => setShowPicker(true)}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                  <MapPin size={14} /> Pick location on map
                </button>
                <button type="button" onClick={pinCurrentLocation} disabled={locating}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50">
                  <Navigation size={14} /> {locating ? 'Getting location...' : 'Use my current location'}
                </button>
                {form.clinicLatitude != null && (
                  <button type="button" onClick={() => { setForm(f => ({ ...f, clinicLatitude: null, clinicLongitude: null })); setLocStatus('') }}
                    className="text-xs text-red-500 hover:text-red-600">Clear pin</button>
                )}
              </div>

              {locStatus && <p className="text-xs text-gray-600 mt-2">{locStatus}</p>}
              {form.clinicLatitude != null && (
                <iframe title="pin-preview" src={mapEmbedSrc('', form.clinicLatitude, form.clinicLongitude)}
                  className="w-full rounded-lg border border-gray-200 mt-3" height="200" loading="lazy" />
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.bio && <p className="text-sm text-gray-700 leading-relaxed text-center pb-2 border-b border-gray-50">{profile.bio}</p>}
            {[
              { icon: Building2, label: 'Hospital', value: profile.hospital },
              { icon: MapPin, label: 'Clinic', value: profile.clinicLocation },
              { icon: MapPin, label: 'Country', value: profile.country },
              { icon: Clock, label: 'Experience', value: profile.yearsExperience ? `${profile.yearsExperience} years` : null },
              { icon: DollarSign, label: 'Consultation Fee', value: profile.consultationFee ? `$${profile.consultationFee}` : null },
            ].filter(i => i.value).map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon size={17} className="text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-700"><span className="text-gray-400">{label}:</span> <span className="font-medium">{value}</span></p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stacked sections */}
      <div className="space-y-4">

      {/* Clinic Location preview (read mode) */}
      {!editing && (profile.clinicAddress || profile.country || profile.clinicLatitude != null) && (() => {
        const mapQuery = profile.clinicAddress
          ? `${profile.clinicName || ''} ${profile.clinicAddress}, ${profile.country || ''}`
          : `${profile.country || ''}`
        const { clinicLatitude: lat, clinicLongitude: lng } = profile
        return (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MapPin size={18} className="text-blue-600" /> {t('clinicLocation')}</h3>
              <button onClick={() => openInMaps(mapQuery, lat, lng)}
                className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                <Navigation size={13} /> Open in Google Maps
              </button>
            </div>
            <div className="space-y-1 mb-4 text-sm">
              {profile.clinicName && <p className="font-semibold text-gray-900">{profile.clinicName}</p>}
              {profile.clinicAddress && <p className="text-gray-600">{profile.clinicAddress}</p>}
              {profile.country && <p className="text-gray-500">{profile.country}</p>}
              {lat != null && <p className="text-xs text-green-600">📍 Exact location pinned</p>}
            </div>
            <iframe title="clinic-map" src={mapEmbedSrc(mapQuery, lat, lng)} className="w-full rounded-xl border border-gray-100"
              height="260" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        )
      })()}

      {/* Skills */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Zap size={18} className="text-blue-600" /> {t('skills')}</h3>
          <button onClick={() => setAddingSkill(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <Plus size={16} /> {t('add')}
          </button>
        </div>

        {addingSkill && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Skill Name</label>
                <input value={skillForm.skillName} onChange={e => setSkillForm(f => ({ ...f, skillName: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Proficiency Level</label>
                <select value={skillForm.proficiencyLevel} onChange={e => setSkillForm(f => ({ ...f, proficiencyLevel: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {PROFICIENCY.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addSkill} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700">Save</button>
              <button onClick={() => setAddingSkill(false)} className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        {(profile.skills || []).length === 0 && !addingSkill
          ? <p className="text-sm text-gray-400 text-center py-4">No skills added yet</p>
          : <div className="flex flex-wrap gap-2">
              {(profile.skills || []).map(skill => (
                <div key={skill.id} className="flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2 group">
                  <span className="text-sm font-medium text-gray-800">{skill.skillName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROFICIENCY_COLORS[skill.proficiencyLevel] || 'bg-gray-100 text-gray-600'}`}>
                    {skill.proficiencyLevel}
                  </span>
                  <button onClick={() => deleteSkill(skill.id)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
        }
      </div>

      </div>{/* end RIGHT column */}
      </div>
      )}{/* end PROFILE TAB */}

      {/* ─── CERTIFICATES TAB ─── */}
      {tab === 'certificates' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Award size={18} className="text-blue-600" /> {t('certificates')}</h3>
            <button onClick={() => setAddingCert(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Plus size={16} /> {t('add')}
            </button>
          </div>

          {addingCert && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Certificate Name', key: 'certificateName' },
                  { label: 'Institution', key: 'institution' },
                  { label: 'Year Obtained', key: 'yearObtained', type: 'number' },
                ].map(({ label, key, type = 'text' }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type={type} value={certForm[key]} onChange={e => setCertForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Image</label>
                  <button onClick={() => certImgRef.current.click()}
                    className="w-full border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-white transition text-left">
                    {certForm.certificateImage ? '✓ Image selected' : 'Upload image'}
                  </button>
                  <input ref={certImgRef} type="file" accept="image/*" className="hidden" onChange={handleCertImage} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addCertificate} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700">Save</button>
                <button onClick={() => setAddingCert(false)} className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}

          {(profile.certificates || []).length === 0 && !addingCert
            ? <p className="text-sm text-gray-400 text-center py-8">No certificates added yet</p>
            : <div className="grid grid-cols-3 gap-3">
                {(profile.certificates || []).map(cert => (
                  <div key={cert.id} className="border border-gray-100 rounded-xl overflow-hidden group relative">
                    {cert.certificateImage && (
                      <img src={cert.certificateImage} alt={cert.certificateName} className="w-full h-28 object-cover bg-gray-50" />
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-gray-900 text-sm">{cert.certificateName}</p>
                      <p className="text-xs text-gray-500">{cert.institution}</p>
                      {cert.yearObtained && <p className="text-xs text-blue-600 mt-0.5">{cert.yearObtained}</p>}
                    </div>
                    <button onClick={() => deleteCertificate(cert.id)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* ─── RATINGS TAB ─── */}
      {tab === 'ratings' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star size={18} className="text-amber-500" /> Patient Reviews
          </h3>
          {ratings.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No reviews yet</p>
            : <div className="space-y-3">
                {ratings.map(r => (
                  <div key={r.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                          {r.patientName?.[0] || 'P'}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{r.patientName || 'Patient'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating value={r.rating} readonly size={14} />
                        <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {r.review && <p className="text-sm text-gray-600 mt-1">{r.review}</p>}
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {showPicker && (
        <LocationPickerModal
          initial={form.clinicLatitude != null ? { lat: form.clinicLatitude, lng: form.clinicLongitude } : null}
          onClose={() => setShowPicker(false)}
          onPick={(lat, lng) => {
            setForm(f => ({ ...f, clinicLatitude: lat, clinicLongitude: lng }))
            setLocStatus(`📍 Pinned at ${lat}, ${lng}`)
            setShowPicker(false)
          }}
        />
      )}
    </div>
  )
}
