import { useState, useEffect } from 'react'
import { FileText, Brain, Droplets, ImageIcon, CheckCircle, X, Eye, Send, MessageCircle, AlertTriangle } from 'lucide-react'
import { getDoctorReports, updateReportStatus, sendMessage, fileComplaint } from '../../api'
import { useLang } from '../../context/LanguageContext'

const typeIcon = {
  'AI Diagnosis': <Brain size={20} className="text-blue-500" />,
  'Fluid Quantification': <Droplets size={20} className="text-cyan-500" />,
  'Image Enhancement': <ImageIcon size={20} className="text-green-500" />,
}

function ViewReportModal({ report, doctorId, onClose }) {
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)
  const [complaintReason, setComplaintReason] = useState('')
  const [complaintSent, setComplaintSent] = useState(false)
  const [showComplaint, setShowComplaint] = useState(false)

  const handleSendMessage = async () => {
    if (!msg.trim()) return
    const fullMsg = `[Re: ${report.type} Report #${report.id}] ${msg.trim()}`
    await sendMessage(doctorId, report.patientId, fullMsg)
    setSent(true)
    setMsg('')
    setTimeout(() => setSent(false), 3000)
  }

  const handleFileComplaint = async () => {
    if (!complaintReason.trim()) return
    await fileComplaint(doctorId, report.patientId, complaintReason.trim())
    setComplaintSent(true)
    setComplaintReason('')
    setTimeout(() => { setComplaintSent(false); setShowComplaint(false) }, 3000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {typeIcon[report.type] || <FileText size={20} />}
            <p className="font-bold text-gray-900">{report.type} Report</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          {/* Image */}
          {report.imageData && (
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">OCT Image</p>
              <img src={report.imageData} alt="OCT scan" className="w-full rounded-xl object-contain max-h-64 bg-black" />
            </div>
          )}

          {/* Diagnosis */}
          {report.diagnosis && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Diagnosis</p>
              <p className="font-semibold text-gray-900 text-lg">{report.diagnosis}</p>
              {report.confidence && (
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Confidence</span>
                    <span className="font-semibold">{report.confidence.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${report.confidence}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendation */}
          {report.recommendation && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recommendation</p>
              <p className="text-sm text-blue-800">{report.recommendation}</p>
            </div>
          )}

          <div className="text-xs text-gray-400">
            Patient ID: {report.patientId} · {new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>

          {/* Message to Patient */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Reply to Patient</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Write your response about this report..."
                className="flex-1 bg-gray-100 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!msg.trim()}
                className="bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition disabled:opacity-40 flex items-center gap-1.5 text-sm"
              >
                <Send size={15} />
                Send
              </button>
            </div>
            {sent && <p className="text-green-600 text-xs mt-2">Message sent to patient!</p>}
          </div>

          {/* Report patient to admin */}
          <div className="border-t border-gray-100 pt-4">
            {!showComplaint ? (
              <button
                onClick={() => setShowComplaint(true)}
                className="flex items-center gap-1.5 text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
              >
                <AlertTriangle size={13} />
                Report this patient to admin
              </button>
            ) : (
              <div>
                <p className="text-xs text-red-500 font-medium uppercase tracking-wide mb-2">
                  Report Patient #{report.patientId} to Administrator
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={complaintReason}
                    onChange={(e) => setComplaintReason(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFileComplaint()}
                    placeholder="Reason (abusive, spam, fake reports...)"
                    className="flex-1 bg-gray-100 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <button
                    onClick={handleFileComplaint}
                    disabled={!complaintReason.trim()}
                    className="bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition disabled:opacity-40 flex items-center gap-1.5 text-sm"
                  >
                    <AlertTriangle size={15} />
                    Submit
                  </button>
                </div>
                {complaintSent && <p className="text-green-600 text-xs mt-2">Complaint submitted to administrator!</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DoctorPendingReports({ user, onMessagePatient }) {
  const [reports, setReports] = useState([])
  const [viewing, setViewing] = useState(null)
  const { t } = useLang()

  useEffect(() => {
    getDoctorReports(user.id).then((data) => {
      if (Array.isArray(data)) setReports(data)
    })
  }, [user.id])

  const markReviewed = async (id) => {
    await updateReportStatus(id, 'REVIEWED')
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'REVIEWED' } : r))
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const pending = reports.filter((r) => r.status === 'PENDING')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('pendingTitle')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('pendingSub')}</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
        <FileText className="text-blue-500" size={24} />
        <div>
          <p className="font-semibold text-gray-900">{t('totalPending')}: {pending.length}</p>
          <p className="text-sm text-gray-500">{pending.length} {t('awaitingReview')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <FileText size={56} className="mb-4" />
            <p className="text-gray-500 font-medium">{t('noPending')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('noPendingSub')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {typeIcon[report.type] || <FileText size={20} className="text-blue-500" />}
                    <div>
                      <p className="font-medium text-gray-900">{report.type} Report</p>
                      <p className="text-xs text-gray-400">Patient ID: {report.patientId} · {formatDate(report.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      report.status === 'REVIEWED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {report.status === 'REVIEWED' ? 'reviewed' : 'pending'}
                    </span>
                    <button
                      onClick={() => onMessagePatient(report.patientId)}
                      className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                    >
                      <MessageCircle size={13} />
                      Message
                    </button>
                    <button
                      onClick={() => setViewing(report)}
                      className="flex items-center gap-1.5 text-xs border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Eye size={13} />
                      View
                    </button>
                    {report.status === 'PENDING' && (
                      <button
                        onClick={() => markReviewed(report.id)}
                        className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
                      >
                        <CheckCircle size={13} />
                        Mark Reviewed
                      </button>
                    )}
                  </div>
                </div>
                {(report.diagnosis || report.recommendation) && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    {report.diagnosis && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Diagnosis:</span> {report.diagnosis}
                        {report.confidence && <span className="text-gray-400"> ({report.confidence.toFixed(1)}%)</span>}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {viewing && <ViewReportModal report={viewing} doctorId={user.id} onClose={() => setViewing(null)} />}
    </div>
  )
}
