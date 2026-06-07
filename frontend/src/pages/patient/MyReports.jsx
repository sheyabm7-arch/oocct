import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Brain, Droplets, ImageIcon, MessageCircle, Trash2 } from 'lucide-react'
import { useReports } from '../../context/ReportsContext'
import { getMessages, deleteReport, getDoctors } from '../../api'
import { useLang } from '../../context/LanguageContext'

const typeIcon = {
  'AI Diagnosis': <Brain size={20} className="text-blue-500" />,
  'Fluid Quantification': <Droplets size={20} className="text-cyan-500" />,
  'Image Enhancement': <ImageIcon size={20} className="text-green-500" />,
}

export default function MyReports({ user }) {
  const { reports, removeReport } = useReports()
  const [doctorReplies, setDoctorReplies] = useState([])
  const [doctorsMap, setDoctorsMap] = useState({})
  const [cancelCountdown, setCancelCountdown] = useState({})
  const countdownRefs = useRef({})
  const navigate = useNavigate()
  const { t } = useLang()

  useEffect(() => {
    return () => {
      Object.values(countdownRefs.current).forEach(clearInterval)
    }
  }, [])

  const startCancel = (reportId) => {
    setCancelCountdown((prev) => ({ ...prev, [reportId]: 5 }))
    let count = 5
    const interval = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearInterval(interval)
        delete countdownRefs.current[reportId]
        setCancelCountdown((prev) => { const { [reportId]: _, ...rest } = prev; return rest })
        deleteReport(reportId).then(() => removeReport(reportId))
      } else {
        setCancelCountdown((prev) => ({ ...prev, [reportId]: count }))
      }
    }, 1000)
    countdownRefs.current[reportId] = interval
  }

  const undoCancel = (reportId) => {
    clearInterval(countdownRefs.current[reportId])
    setCancelCountdown((prev) => { const { [reportId]: _, ...rest } = prev; return rest })
  }

  useEffect(() => {
    getDoctors().then((data) => {
      if (Array.isArray(data)) {
        const map = {}
        data.forEach((d) => { map[d.id] = d.name })
        setDoctorsMap(map)
      }
    })
  }, [])

  useEffect(() => {
    if (!user?.id) return
    getMessages(user.id).then((data) => {
      if (Array.isArray(data)) {
        setDoctorReplies(data.filter((m) => m.receiverId === user.id))
      }
    })
  }, [user?.id])

  const hasReply = (report) => {
    return doctorReplies.some(
      (m) => m.senderId === report.doctorId && m.content.includes(`[Re: ${report.type} Report #${report.id}]`)
    )
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('reportsTitle')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('reportsSub')}</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
        <FileText className="text-blue-500" size={24} />
        <div>
          <p className="font-semibold text-gray-900">{t('totalReportsLabel')}: {reports.length}</p>
          <p className="text-sm text-gray-500">
            {reports.filter((r) => r.status === 'REVIEWED').length} {t('reviewed')},{' '}
            {reports.filter((r) => r.status === 'PENDING').length} {t('pendingReview')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <FileText size={56} className="mb-4" />
            <p className="text-gray-500 font-medium">{t('noReportsYet')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('reportsAppear')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const replied = hasReply(report)
              const countdown = cancelCountdown[report.id]
              return (
                <div key={report.id} className={`border rounded-xl p-4 transition hover:shadow-md ${
                  replied ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                        {typeIcon[report.type] || <FileText size={20} className="text-blue-500" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{report.type} Report</p>
                        <p className="text-xs text-gray-400">{formatDate(report.createdAt)} at {formatTime(report.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!replied && (
                        <button
                          onClick={() => navigate('/messages', { state: { doctorId: report.doctorId } })}
                          className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition"
                        >
                          <MessageCircle size={13} />
                          Message
                        </button>
                      )}
                      {replied && (
                        <button
                          onClick={() => navigate('/messages', { state: { doctorId: report.doctorId } })}
                          className="relative flex items-center gap-1.5 text-xs border border-blue-200 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-medium"
                        >
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                          <MessageCircle size={13} />
                          Doctor replied
                        </button>
                      )}

                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        report.status === 'REVIEWED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {report.status === 'REVIEWED' ? 'reviewed' : 'pending review'}
                      </span>

                      {(report.status === 'PENDING' || replied || report.status === 'REVIEWED') && (
                        countdown !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg font-medium">
                              <div className="w-4 h-4 rounded-full border-2 border-red-400 flex items-center justify-center text-[10px] font-bold">
                                {countdown}
                              </div>
                              {report.status === 'PENDING' ? 'Cancelling...' : 'Deleting...' }
                            </div>
                            <button
                              onClick={() => undoCancel(report.id)}
                              className="text-xs text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition font-medium"
                            >
                              Undo
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startCancel(report.id)}
                            className={`flex items-center gap-1.5 text-xs border px-2.5 py-1.5 rounded-lg transition ${
                              report.status === 'PENDING'
                                ? 'text-orange-400 border-orange-100 hover:bg-orange-50 hover:text-orange-600'
                                : 'text-red-400 border-red-100 hover:bg-red-50 hover:text-red-600'
                            }`}
                          >
                            <Trash2 size={13} />
                            {report.status === 'PENDING' ? 'Cancel' : 'Delete'}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Sent to</p>
                      <p className="text-sm font-semibold text-gray-800">Dr. {doctorsMap[report.doctorId] || `#${report.doctorId}`}</p>
                    </div>
                    {report.diagnosis && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Result</p>
                        <p className="text-sm text-gray-700 font-medium">{report.diagnosis}</p>
                        {report.confidence && (
                          <p className="text-xs text-gray-400">{report.confidence.toFixed(1)}% confidence</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
