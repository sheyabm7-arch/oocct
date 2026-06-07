import { useState, useEffect, useRef } from 'react'
import { Send, User, Brain, Droplets, ImageIcon, FileText, X, ChevronRight } from 'lucide-react'
import { getMessages, getDoctorReports, getPatients, getToken, fileComplaint } from '../../api'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useLang } from '../../context/LanguageContext'

const BASE = 'http://localhost:9000'
const authHdr = () => ({ Authorization: `Bearer ${getToken()}` })

const typeIcons = {
  'AI Diagnosis Report': <Brain size={16} className="text-blue-500" />,
  'Fluid Quantification Report': <Droplets size={16} className="text-cyan-500" />,
  'Image Enhancement Report': <ImageIcon size={16} className="text-green-500" />,
}

export default function DoctorMessages({ user, initialPatientId, unreadPatientIds = new Set(), onMarkRead }) {
  const [allMessages, setAllMessages] = useState([])
  const [contacts, setContacts] = useState([])
  const [selectedId, setSelectedId] = useState(initialPatientId || null)
  const [input, setInput] = useState('')
  const [reports, setReports] = useState([])
  const [patientsMap, setPatientsMap] = useState({})
  const [panelPatient, setPanelPatient] = useState(null)   // { id, profile, reports }
  const [reportingPatient, setReportingPatient] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [blockedIds, setBlockedIds] = useState(new Set())
  const bottomRef = useRef()
  const selectedIdRef = useRef(null)
  const { t } = useLang()

  // Keep ref in sync with state
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  useEffect(() => {
    loadMessages()
    getDoctorReports(user.id).then((data) => { if (Array.isArray(data)) setReports(data) })
    getPatients().then((data) => {
      if (Array.isArray(data)) {
        const map = {}
        data.forEach((p) => { map[p.id] = p.name })
        setPatientsMap(map)
      }
    })
  }, [user.id])

  const loadMessages = async () => {
    const data = await getMessages(user.id)
    if (Array.isArray(data)) {
      setAllMessages(data)
      const ids = [...new Set(data.map((m) => m.senderId === user.id ? m.receiverId : m.senderId))]
      if (initialPatientId && !ids.includes(initialPatientId)) ids.push(initialPatientId)
      setContacts(ids)
    }
  }

  // ── Real-time WebSocket ────────────────────────────────────
  const { sendWsMessage } = useWebSocket(user.id, (msg) => {
    setAllMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev]
    )
    // Add new patient to contacts list if not already present
    const otherId = msg.senderId === user.id ? msg.receiverId : msg.senderId
    setContacts((prev) => prev.includes(otherId) ? prev : [...prev, otherId])
    // Notify parent of unread if conversation isn't open
    if (msg.senderId !== user.id && selectedIdRef.current !== msg.senderId) {
      window.dispatchEvent(new CustomEvent('new-message', { detail: { from: msg.senderId } }))
    }
  })

  const openPanel = async (patientId) => {
    setReportingPatient(false)
    setReportReason('')
    setReportSent(false)
    const [profile, patientReports] = await Promise.all([
      fetch(`${BASE}/api/profile/${patientId}`, { headers: authHdr() }).then(r => r.json()).catch(() => ({})),
      fetch(`${BASE}/api/reports/patient/${patientId}`, { headers: authHdr() }).then(r => r.json()).catch(() => []),
    ])
    setPanelPatient({ id: patientId, profile, reports: Array.isArray(patientReports) ? patientReports : [] })
  }

  const submitReport = async () => {
    if (!reportReason.trim() || !panelPatient) return
    await fileComplaint(user.id, panelPatient.id, reportReason.trim())
    setReportSent(true)
    setReportReason('')
  }

  const toggleBlock = (patientId) => {
    setBlockedIds(prev => {
      const next = new Set(prev)
      next.has(patientId) ? next.delete(patientId) : next.add(patientId)
      return next
    })
    // refresh panel if open
    setPanelPatient(prev => prev ? { ...prev } : null)
  }

  const handleSend = () => {
    if (!input.trim() || !selectedId || blockedIds.has(selectedId)) return
    sendWsMessage(user.id, selectedId, input.trim())
    setInput('')
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages, selectedId])

  const conversation = allMessages
    .filter((m) => (m.senderId === user.id && m.receiverId === selectedId) || (m.senderId === selectedId && m.receiverId === user.id))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('messaging')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('messagingSub')}</p>
      </div>

      <div className="grid grid-cols-3 gap-4" style={{ height: '520px' }}>
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col">
          <p className="font-semibold text-gray-900 mb-1">{t('contacts')}</p>
          <p className="text-xs text-gray-400 mb-4">{t('yourPatients')}</p>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {contacts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <User size={32} className="mb-2" />
                <p className="text-sm text-gray-400">{t('noContacts')}</p>
              </div>
            )}
            {contacts.map((id) => (
              <div key={id} className={`flex items-center gap-2 p-2 rounded-xl transition-all ${selectedId === id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                {/* Avatar → opens profile panel */}
                <button onClick={() => openPanel(id)}
                  className="relative flex-shrink-0 group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition group-hover:ring-2 group-hover:ring-blue-400 ${blockedIds.has(id) ? 'bg-red-100 text-red-500' : 'bg-gray-200 text-gray-600'}`}>
                    {(patientsMap[id] || 'P').slice(0, 2).toUpperCase()}
                  </div>
                  {unreadPatientIds.has(id) && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>
                {/* Name → selects conversation */}
                <button onClick={() => { setSelectedId(id); onMarkRead?.(id) }} className="flex-1 text-left min-w-0">
                  <p className={`text-sm font-medium truncate ${blockedIds.has(id) ? 'text-red-400 line-through' : 'text-gray-900'}`}>
                    {patientsMap[id] || `Patient #${id}`}
                  </p>
                  {blockedIds.has(id) && <p className="text-xs text-red-400">Blocked</p>}
                </button>
                <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <User size={48} className="mb-3" />
              <p className="text-gray-400 text-sm">{t('selectContact')}</p>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => openPanel(selectedId)} className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 hover:ring-2 hover:ring-blue-400 transition">
                    {(patientsMap[selectedId] || 'P').slice(0, 2).toUpperCase()}
                  </button>
                  <p className="font-semibold text-gray-900 text-sm">{patientsMap[selectedId] || `Patient #${selectedId}`}</p>
                  {blockedIds.has(selectedId) && <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">Blocked</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openPanel(selectedId)}
                    className="text-xs text-blue-600 border border-blue-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition">
                    Profile
                  </button>
                  <button onClick={() => toggleBlock(selectedId)}
                    className={`text-xs border px-2.5 py-1.5 rounded-lg transition ${blockedIds.has(selectedId) ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200' : 'text-red-500 border-red-100 hover:bg-red-50'}`}>
                    {blockedIds.has(selectedId) ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {conversation.length === 0 && (
                  <p className="text-center text-sm text-gray-300 mt-8">No messages yet.</p>
                )}
                {conversation.map((msg) => {
                  const reportMatch = msg.content.match(/^\[Re: (.+?) #\d+\](.*)/)
                  const reportType = reportMatch?.[1]
                  const text = reportMatch ? reportMatch[2].trim() : msg.content
                  const relatedReport = reportType
                    ? reports.find((r) => `${r.type} Report` === reportType && r.patientId === selectedId)
                    : null
                  const isOwn = msg.senderId === user.id
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs rounded-2xl text-sm overflow-hidden ${
                        isOwn ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}>
                        {reportType && (
                          <div className={`border-b overflow-hidden rounded-t-2xl ${isOwn ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                            {relatedReport?.imageData && (
                              <img src={relatedReport.imageData} alt="OCT" className="w-full max-h-36 object-contain bg-black" />
                            )}
                            <div className="flex items-center gap-2 px-3 py-2">
                              {typeIcons[reportType] || <FileText size={16} className="text-gray-400" />}
                              <span className={`text-xs font-semibold ${isOwn ? 'text-gray-300' : 'text-gray-700'}`}>{reportType}</span>
                            </div>
                          </div>
                        )}
                        <div className="px-4 py-2">
                          <p>{text}</p>
                          <p className="text-xs mt-1 text-gray-400">{formatTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {blockedIds.has(selectedId)
                ? <div className="p-4 border-t border-gray-100 text-center text-sm text-red-400">
                    You have blocked this patient. <button onClick={() => toggleBlock(selectedId)} className="underline font-medium">Unblock</button>
                  </div>
                : <div className="p-4 border-t border-gray-100 flex gap-2">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={t('typeMessage')}
                      className="flex-1 bg-gray-100 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={handleSend} className="bg-gray-900 text-white p-2.5 rounded-lg hover:bg-gray-800 transition">
                      <Send size={18} />
                    </button>
                  </div>
              }
            </>
          )}
        </div>
      </div>

      {/* Patient Full Profile Modal */}
      {panelPatient && (() => {
        const p = panelPatient.profile || {}
        const reps = panelPatient.reports || []
        const patId = panelPatient.id
        const initials = (name) => (name || 'P').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        const consultedDoctors = [...new Set(reps.map(r => r.doctorId))].length
        return (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setPanelPatient(null)}>
            <div className="bg-gray-100 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

              {/* Hero */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
                <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <div className="px-6 pb-5 -mt-6 flex items-end justify-between">
                  <div className="flex items-end gap-4">
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 overflow-hidden">
                      {p.profilePicture
                        ? <img src={p.profilePicture} alt="avatar" className="w-full h-full object-cover" />
                        : initials(p.name)}
                    </div>
                    <div className="mb-1">
                      <h2 className="text-xl font-bold text-gray-900">{p.name || patientsMap[patId] || `Patient #${patId}`}</h2>
                      <p className="text-sm text-gray-500">{p.email || '—'}</p>
                      {blockedIds.has(patId) && <span className="text-xs text-red-400">Blocked</span>}
                    </div>
                  </div>
                  <button onClick={() => setPanelPatient(null)} className="text-gray-400 hover:text-gray-600 mb-1">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Personal Info */}
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
                <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', value: p.name },
                    { label: 'Phone', value: p.phone },
                    { label: 'Date of Birth', value: p.dateOfBirth },
                    { label: 'Gender', value: p.gender },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
                    </div>
                  ))}
                  {p.bio && <div className="col-span-2"><p className="text-xs text-gray-400">Bio</p><p className="text-sm text-gray-700">{p.bio}</p></div>}
                </div>
              </div>


              {/* Actions */}
              <div className="bg-white rounded-2xl shadow-sm p-5 space-y-2">
                <button onClick={() => toggleBlock(patId)}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition ${blockedIds.has(patId) ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'}`}>
                  {blockedIds.has(patId) ? '✓ Unblock Patient' : '🚫 Block Patient'}
                </button>

                <button onClick={() => { setReportingPatient(true); setReportSent(false) }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100 transition">
                  ⚑ Report Patient to Admin
                </button>

                {reportingPatient && (
                  <div className="space-y-2">
                    {reportSent
                      ? <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-700 text-center">✓ Report submitted to admin</div>
                      : <>
                          <textarea value={reportReason} onChange={e => setReportReason(e.target.value)}
                            placeholder="Describe the reason..." rows={3}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
                          <div className="flex gap-2">
                            <button onClick={submitReport} disabled={!reportReason.trim()}
                              className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-40">Submit</button>
                            <button onClick={() => setReportingPatient(false)}
                              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                          </div>
                        </>
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
