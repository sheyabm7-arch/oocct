import { useState, useEffect } from 'react'
import { Send, X, CheckCircle } from 'lucide-react'
import { useReports } from '../context/ReportsContext'
import { getDoctors, getToken } from '../api'
import StarRating from './StarRating'

const BASE = ''
const authHdr = () => ({ Authorization: `Bearer ${getToken()}` })

export default function SendToDoctorModal({ onClose, reportType, summary, diagnosis, confidence, imageData }) {
  const [doctors, setDoctors] = useState([])
  const [ratings, setRatings] = useState({})   // { doctorId: { average, total } }
  const [selected, setSelected] = useState(null)
  const [sent, setSent] = useState(false)
  const { addReport } = useReports()

  useEffect(() => {
    getDoctors().then(async (data) => {
      if (!Array.isArray(data)) return
      setDoctors(data)
      const map = {}
      await Promise.all(data.map(async (doc) => {
        try {
          const res = await fetch(`${BASE}/api/rating/doctor/${doc.id}/average`, { headers: authHdr() })
          map[doc.id] = await res.json()
        } catch { map[doc.id] = { average: 0, total: 0 } }
      }))
      setRatings(map)
    })
  }, [])

  const handleSend = async () => {
    if (!selected) return
    await addReport({ type: reportType, doctor: selected, summary, diagnosis, confidence, imageData })
    setSent(true)
    setTimeout(onClose, 1800)
  }

  const initials = (name) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div className="flex flex-col items-center py-4 gap-3">
            <CheckCircle size={48} className="text-green-500" />
            <p className="font-semibold text-gray-900 text-lg">Report Sent!</p>
            <p className="text-sm text-gray-500 text-center">
              Your {reportType} results have been sent to {selected.name}.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-gray-900">Send to Doctor</p>
                <p className="text-xs text-gray-400 mt-0.5">Select who to send your {reportType} report to</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 mb-5">
              {doctors.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No doctors registered yet.</p>
              )}
              {doctors.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelected(doc)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    selected?.id === doc.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                    {initials(doc.name)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Dr. {doc.name}</p>
                    <p className="text-xs text-gray-400">{doc.email}</p>
                    {doc.country && (
                      <p className="text-xs text-gray-400 flex items-center gap-0.5">📍 {doc.country}</p>
                    )}
                    {ratings[doc.id]?.total > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <StarRating value={Math.round(ratings[doc.id].average)} readonly size={12} />
                        <span className="text-xs text-gray-400">{ratings[doc.id].average} ({ratings[doc.id].total})</span>
                      </div>
                    )}
                  </div>
                  {selected?.id === doc.id && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-gray-900" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleSend}
              disabled={!selected}
              className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              Send Report
            </button>
          </>
        )}
      </div>
    </div>
  )
}
