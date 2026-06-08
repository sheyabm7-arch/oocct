import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Star, Building2, Clock } from 'lucide-react'
import { getDoctors, getToken } from '../../api'
import { useLang } from '../../context/LanguageContext'

const BASE = ''
const authHdr = () => ({ Authorization: `Bearer ${getToken()}` })

export default function DoctorsList() {
  const [doctors, setDoctors]   = useState([])
  const [profiles, setProfiles] = useState({})
  const [search, setSearch]     = useState('')
  const navigate = useNavigate()
  const { t } = useLang()

  useEffect(() => {
    getDoctors().then(async (data) => {
      if (!Array.isArray(data)) return
      setDoctors(data)
      const profileMap = {}
      await Promise.all(data.map(async (doc) => {
        try {
          const res = await fetch(`${BASE}/api/doctor/profile/${doc.id}`, { headers: authHdr() })
          profileMap[doc.id] = await res.json()
        } catch { /* ignore */ }
      }))
      setProfiles(profileMap)
    })
  }, [])

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    profiles[d.id]?.specialty?.toLowerCase().includes(search.toLowerCase()) ||
    profiles[d.id]?.hospital?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('doctorsTitle')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('doctorsSub')}</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('searchDoctors')}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map(doc => {
          const p = profiles[doc.id] || {}
          return (
            <button key={doc.id} onClick={() => navigate(`/doctor/${doc.id}`)}
              className="bg-white rounded-2xl shadow-sm p-5 text-left hover:shadow-md transition-all hover:-translate-y-0.5 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center overflow-hidden">
                    {p.profilePicture
                      ? <img src={p.profilePicture} alt="avatar" className="w-full h-full object-cover" />
                      : <span className="text-lg font-bold text-blue-600">{initials(doc.name)}</span>}
                  </div>
                  <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${doc.online ? 'bg-green-400' : 'bg-gray-300'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">Dr. {doc.name}</p>
                  {p.specialty && <p className="text-blue-600 text-sm">{p.specialty}</p>}
                  <div className="flex flex-col gap-1 mt-2">
                    {p.hospital && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Building2 size={11} />{p.hospital}
                      </span>
                    )}
                    {p.yearsExperience && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={11} />{p.yearsExperience} yrs experience
                      </span>
                    )}
                    {(p.averageRating > 0) && (
                      <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <Star size={11} fill="currentColor" />{p.averageRating} ({p.totalRatings})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-300">
          <p className="text-gray-400">{t('noDoctorsFound')}</p>
        </div>
      )}
    </div>
  )
}
