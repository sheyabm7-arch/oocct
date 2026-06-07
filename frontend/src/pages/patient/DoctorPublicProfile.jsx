import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Building2, Clock, DollarSign, Award, Zap, Star, MessageCircle, Navigation } from 'lucide-react'
import StarRating from '../../components/StarRating'
import { getToken } from '../../api'
import { openInMaps, mapEmbedSrc } from '../../data/countries'
import { useLang } from '../../context/LanguageContext'

const BASE = 'http://localhost:9000'
const authHdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

const PROFICIENCY_COLORS = {
  'Beginner':     'bg-gray-100 text-gray-600',
  'Intermediate': 'bg-blue-100 text-blue-700',
  'Expert':       'bg-purple-100 text-purple-700',
  'مبتدئ':        'bg-gray-100 text-gray-600',
  'متوسط':        'bg-blue-100 text-blue-700',
  'خبير':         'bg-purple-100 text-purple-700',
}

export default function DoctorPublicProfile({ user }) {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const [doctor, setDoctor]   = useState(null)
  const [ratings, setRatings] = useState([])
  const [check, setCheck]     = useState({ alreadyRated: false, eligible: false })
  const [ratingVal, setRatingVal] = useState(0)
  const [review, setReview]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [tab, setTab]               = useState('profile') // profile | certificates | ratings
  const { t }                       = useLang()

  useEffect(() => {
    const id = doctorId
    fetch(`${BASE}/api/doctor/profile/${id}`, { headers: authHdr() })
      .then(r => r.json()).then(setDoctor)
    fetch(`${BASE}/api/rating/doctor/${id}`, { headers: authHdr() })
      .then(r => r.json()).then(d => Array.isArray(d) && setRatings(d))
    if (user?.id) {
      fetch(`${BASE}/api/rating/check/${id}/${user.id}`, { headers: authHdr() })
        .then(r => r.json()).then(setCheck)
    }
  }, [doctorId, user?.id])

  const submitRating = async () => {
    if (!ratingVal) return
    setSubmitting(true)
    const res = await fetch(`${BASE}/api/rating/submit`, {
      method: 'POST', headers: authHdr(),
      body: JSON.stringify({ doctorId: Number(doctorId), patientId: user.id, rating: ratingVal, review }),
    })
    if (res.ok) {
      const saved = await res.json()
      setRatings(prev => [{ ...saved, patientName: user.name?.split(' ')[0] }, ...prev])
      setCheck({ alreadyRated: true, eligible: true })
      setSubmitted(true)
      setDoctor(d => ({
        ...d,
        totalRatings: d.totalRatings + 1,
        averageRating: Math.round(((d.averageRating * d.totalRatings + ratingVal) / (d.totalRatings + 1)) * 10) / 10,
      }))
    }
    setSubmitting(false)
  }

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  if (!doctor) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition">
        <ArrowLeft size={16} /> {t('back')}
      </button>

      {/* Hero Card — Facebook-style */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-blue-100 flex items-center justify-center">
              {doctor.profilePicture
                ? <img src={doctor.profilePicture} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-blue-600">{initials(doctor.name)}</span>}
            </div>
            <div className="flex-1 sm:pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">Dr. {doctor.name}</h2>
                <span className={`w-2.5 h-2.5 rounded-full ${doctor.online ? 'bg-green-400' : 'bg-gray-300'}`} />
                <span className="text-xs text-gray-400">{doctor.online ? t('online') : t('offline')}</span>
              </div>
              {doctor.specialty && <p className="text-blue-600 font-medium mt-0.5">{doctor.specialty}</p>}
              <div className="flex items-center gap-2 mt-1">
                <StarRating value={Math.round(doctor.averageRating)} readonly size={16} />
                <span className="font-bold text-gray-800 text-sm">{doctor.averageRating || 0}</span>
                <span className="text-gray-400 text-xs">({doctor.totalRatings})</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/messages', { state: { doctorId: Number(doctorId) } })}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition self-end"
            >
              <MessageCircle size={16} /> Message
            </button>
          </div>
        </div>
        {/* Tab strip */}
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

      {/* ─── PROFILE TAB ─── */}
      {tab === 'profile' && (<>
      {/* About */}
      {doctor.bio && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-3">About</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{doctor.bio}</p>
        </div>
      )}

      {/* Quick facts */}
      {(doctor.hospital || doctor.yearsExperience || doctor.consultationFee) && (
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-wrap gap-4 text-sm text-gray-600">
          {doctor.hospital && <span className="flex items-center gap-1"><Building2 size={15} />{doctor.hospital}</span>}
          {doctor.yearsExperience && <span className="flex items-center gap-1"><Clock size={15} />{doctor.yearsExperience} yrs experience</span>}
          {doctor.consultationFee && <span className="flex items-center gap-1"><DollarSign size={15} />Consultation: ${doctor.consultationFee}</span>}
        </div>
      )}

      {/* Location */}
      {(doctor.clinicAddress || doctor.clinicName || doctor.country || doctor.clinicLatitude != null) && (() => {
        const mapQuery = doctor.clinicAddress
          ? `${doctor.clinicName || ''} ${doctor.clinicAddress}, ${doctor.country || ''}`
          : `${doctor.country || ''}`
        const { clinicLatitude: lat, clinicLongitude: lng } = doctor
        return (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MapPin size={18} className="text-blue-600" /> Location</h3>
              <button onClick={() => openInMaps(mapQuery, lat, lng)}
                className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                <Navigation size={13} /> Open in Google Maps
              </button>
            </div>
            <div className="space-y-1 mb-4 text-sm">
              {doctor.clinicName && <p className="font-semibold text-gray-900">{doctor.clinicName}</p>}
              {doctor.clinicAddress && <p className="text-gray-600">{doctor.clinicAddress}</p>}
              {doctor.country && (
                <p className="text-gray-500 flex items-center gap-1">
                  <MapPin size={13} />{doctor.country}
                </p>
              )}
            </div>
            <iframe
              title="clinic-map"
              src={mapEmbedSrc(mapQuery, lat, lng)}
              className="w-full rounded-xl border border-gray-100"
              height="280"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )
      })()}

      {/* Skills */}
      {doctor.skills?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Zap size={18} className="text-blue-600" /> Skills</h3>
          <div className="flex flex-wrap gap-2">
            {doctor.skills.map(skill => (
              <div key={skill.id} className="flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2">
                <span className="text-sm font-medium text-gray-800">{skill.skillName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROFICIENCY_COLORS[skill.proficiencyLevel] || 'bg-gray-100 text-gray-600'}`}>
                  {skill.proficiencyLevel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      </>)}{/* end PROFILE TAB */}

      {/* ─── CERTIFICATES TAB ─── */}
      {tab === 'certificates' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Award size={18} className="text-blue-600" /> {t('certificates')}</h3>
          {(!doctor.certificates || doctor.certificates.length === 0)
            ? <p className="text-sm text-gray-400 text-center py-8">{t('noCertificates')}</p>
            : <div className="grid grid-cols-3 gap-3">
                {doctor.certificates.map(cert => (
                  <div key={cert.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition">
                    {cert.certificateImage && (
                      <img src={cert.certificateImage} alt={cert.certificateName} className="w-full h-28 object-cover bg-gray-50" />
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-gray-900 text-sm">{cert.certificateName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{cert.institution}</p>
                      {cert.yearObtained && <p className="text-xs text-blue-600 mt-1 font-medium">{cert.yearObtained}</p>}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* ─── RATINGS TAB ─── */}
      {tab === 'ratings' && (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Star size={18} className="text-amber-500" /> {t('ratingsReviews')}</h3>

        {/* Rate this doctor */}
        {!check.alreadyRated && !submitted && (
          check.eligible ? (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-sm font-semibold text-gray-800 mb-3">{t('rateExperience')} {doctor.name}</p>
              <StarRating value={ratingVal} onChange={setRatingVal} size={28} />
              <textarea value={review} onChange={e => setReview(e.target.value)}
                placeholder={t('writeReview')} rows={3}
                className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              <button onClick={submitRating} disabled={!ratingVal || submitting}
                className="mt-3 bg-amber-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition disabled:opacity-50">
                {submitting ? t('saving') : t('submitReview')}
              </button>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-500">
              Send a report to this doctor first to be able to rate them.
            </div>
          )
        )}
        {(check.alreadyRated || submitted) && (
          <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700 font-medium">
            ✓ {t('alreadyRated')}
          </div>
        )}

        {/* Reviews list */}
        {ratings.length === 0
          ? <p className="text-sm text-gray-400 text-center py-6">{t('noReviews')}</p>
          : <div className="space-y-3">
              {ratings.map(r => (
                <div key={r.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
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
                  {r.review && <p className="text-sm text-gray-600">{r.review}</p>}
                </div>
              ))}
            </div>
        }
      </div>
      )}{/* end RATINGS TAB */}
    </div>
  )
}
