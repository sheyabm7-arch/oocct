import { useState, useEffect } from 'react'
import { FileText, Trash2, Brain, Droplets, ImageIcon } from 'lucide-react'
import { getAllReports, deleteReportAdmin } from '../../api'

const typeIcon = {
  'AI Diagnosis': <Brain size={18} className="text-blue-500" />,
  'Fluid Quantification': <Droplets size={18} className="text-cyan-500" />,
  'Image Enhancement': <ImageIcon size={18} className="text-green-500" />,
}

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllReports().then((data) => {
      if (Array.isArray(data)) setReports(data)
      setLoading(false)
    })
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report permanently?')) return
    await deleteReportAdmin(id)
    setReports((prev) => prev.filter((r) => r.id !== id))
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">All Reports</h2>
        <p className="text-gray-500 text-sm mt-1">Review and remove patient medical reports</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <p className="text-gray-400 text-sm py-10 text-center">Loading reports...</p>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <FileText size={56} className="mb-4" />
            <p className="text-gray-500 font-medium">No reports in the system</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition">
                <div className="flex items-center gap-3">
                  {typeIcon[r.type] || <FileText size={18} className="text-blue-500" />}
                  <div>
                    <p className="font-medium text-gray-900">{r.type} Report</p>
                    <p className="text-xs text-gray-400">
                      {r.patientName} (#{r.patientId}) → Dr {r.doctorName} (#{r.doctorId}) · {fmt(r.createdAt)}
                    </p>
                    {r.diagnosis && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Diagnosis:</span> {r.diagnosis}
                        {r.confidence != null && <span className="text-gray-400"> ({r.confidence.toFixed(1)}%)</span>}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    r.status === 'REVIEWED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {(r.status || 'PENDING').toLowerCase()}
                  </span>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="flex items-center gap-1.5 text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
