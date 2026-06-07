import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Navigation, Star, Building2, Search } from 'lucide-react'
import { getDoctorsByLocation } from '../../api'
import { countries, openInMaps } from '../../data/countries'
import { useLang } from '../../context/LanguageContext'

export default function DoctorsByLocation() {
  const [country, setCountry] = useState('')
  const [sortBy, setSortBy]   = useState('rating') // rating | reviews
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { t } = useLang()

  useEffect(() => {
    setLoading(true)
    getDoctorsByLocation(country, '')
      .then(d => setDoctors(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [country])

  const sorted = [...doctors].sort((a, b) =>
    sortBy === 'reviews' ? b.totalRatings - a.totalRatings : b.averageRating - a.averageRating
  )

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('findDoctorsTitle')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('findDoctorsSub')}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-5 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('country')}</label>
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">{t('allCountries')}</option>
            {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('sortBy')}</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="rating">{t('highestRating')}</option>
            <option value="reviews">{t('mostReviews')}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
          <Search size={40} className="mx-auto mb-3 text-gray-300" />
          <p>{t('noDoctorsLocation')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {sorted.map(doc => {
            const mapQuery = doc.clinicAddress
              ? `${doc.clinicName || ''} ${doc.clinicAddress}, ${doc.country || ''}`
              : `${doc.country || ''}`
            return (
              <div key={doc.id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center overflow-hidden">
                      {doc.profilePicture
                        ? <img src={doc.profilePicture} alt="avatar" className="w-full h-full object-cover" />
                        : <span className="text-lg font-bold text-blue-600">{initials(doc.name)}</span>}
                    </div>
                    <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${doc.online ? 'bg-green-400' : 'bg-gray-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">Dr. {doc.name}</p>
                    {doc.specialty && <p className="text-blue-600 text-sm">{doc.specialty}</p>}
                    <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin size={11} />{doc.country || '—'}
                    </p>
                    {doc.clinicName && (
                      <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Building2 size={11} />{doc.clinicName}
                      </p>
                    )}
                    {doc.averageRating > 0 && (
                      <span className="flex items-center gap-1 text-xs text-amber-500 font-medium mt-1">
                        <Star size={11} fill="currentColor" />{doc.averageRating} ({doc.totalRatings})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => navigate(`/doctor/${doc.id}`)}
                    className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">
                    {t('viewProfile')}
                  </button>
                  <button onClick={() => openInMaps(mapQuery, doc.clinicLatitude, doc.clinicLongitude)}
                    className="flex items-center justify-center gap-1.5 border border-blue-200 text-blue-600 px-3 py-2 rounded-lg text-sm hover:bg-blue-50 transition">
                    <Navigation size={14} /> {t('maps')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
