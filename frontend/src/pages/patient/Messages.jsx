import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Send, User, Brain, Droplets, ImageIcon, FileText, ExternalLink } from 'lucide-react'
import { getDoctors, getMessages, getPatientReports } from '../../api'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useLang } from '../../context/LanguageContext'

export default function Messages({ user }) {
  const [doctors, setDoctors]           = useState([])
  const [allMessages, setAllMessages]   = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [input, setInput]               = useState('')
  const [reports, setReports]           = useState([])
  const [unreadIds, setUnreadIds]       = useState(new Set())
  const bottomRef                       = useRef()
  const selectedDoctorRef               = useRef(null)
  const location                        = useLocation()
  const navigate                        = useNavigate()
  const { t }                           = useLang()

  // Keep ref in sync with state
  useEffect(() => { selectedDoctorRef.current = selectedDoctor }, [selectedDoctor])

  // ── Initial data load (history via HTTP) ──────────────────
  useEffect(() => {
    Promise.all([
      getDoctors(),
      getMessages(user.id),
      getPatientReports(user.id),
    ]).then(([docData, msgData, repData]) => {
      if (Array.isArray(docData)) {
        setDoctors(docData)
        if (location.state?.doctorId) {
          const doc = docData.find((d) => d.id === location.state.doctorId)
          if (doc) {
            setSelectedDoctor(doc)
            window.dispatchEvent(new CustomEvent('conv-read', { detail: { id: doc.id } }))
          }
        }
      }
      if (Array.isArray(msgData)) {
        setAllMessages(msgData)
        const ids = new Set()
        msgData.filter((m) => m.receiverId === user.id).forEach((m) => {
          const myLastReply = msgData
            .filter((x) => x.senderId === user.id && x.receiverId === m.senderId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
          if (!myLastReply || new Date(myLastReply.createdAt) < new Date(m.createdAt)) {
            ids.add(m.senderId)
          }
        })
        setUnreadIds(ids)
      }
      if (Array.isArray(repData)) setReports(repData)
    })
  }, [user.id, location.state?.doctorId])

  // ── Real-time WebSocket ────────────────────────────────────
  const { sendWsMessage } = useWebSocket(user.id, (msg) => {
    // Deduplicate (history load may have already added this id)
    setAllMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev]
    )
    // Mark sender as unread if their conversation isn't currently open
    if (msg.senderId !== user.id && selectedDoctorRef.current?.id !== msg.senderId) {
      setUnreadIds((prev) => { const s = new Set(prev); s.add(msg.senderId); return s })
      window.dispatchEvent(new CustomEvent('new-message', { detail: { from: msg.senderId } }))
    }
  })

  // ── Helpers ───────────────────────────────────────────────
  const selectDoctor = (doc) => {
    setSelectedDoctor(doc)
    setUnreadIds((prev) => { const s = new Set(prev); s.delete(doc.id); return s })
    window.dispatchEvent(new CustomEvent('conv-read', { detail: { id: doc.id } }))
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages, selectedDoctor])

  // Send via WebSocket — the backend echoes it back to our subscription
  // so state is updated in the onMessage callback (no double-add)
  const handleSend = () => {
    if (!input.trim() || !selectedDoctor) return
    sendWsMessage(user.id, selectedDoctor.id, input.trim())
    setInput('')
  }

  const conversation = selectedDoctor
    ? allMessages
        .filter((m) =>
          (m.senderId === user.id && m.receiverId === selectedDoctor.id) ||
          (m.senderId === selectedDoctor.id && m.receiverId === user.id)
        )
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : []

  const initials   = (name) => name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  const formatTime = (d)    => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const typeIcons = {
    'AI Diagnosis Report':        <Brain size={16} className="text-blue-500" />,
    'Fluid Quantification Report': <Droplets size={16} className="text-cyan-500" />,
    'Image Enhancement Report':   <ImageIcon size={16} className="text-green-500" />,
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('messaging')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('messagingSub')}</p>
      </div>

      <div className="grid grid-cols-3 gap-4" style={{ height: '520px' }}>
        {/* Contacts sidebar */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col">
          <p className="font-semibold text-gray-900 mb-1">{t('contacts')}</p>
          <p className="text-xs text-gray-400 mb-4">{t('yourDoctors')}</p>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {doctors.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <User size={32} className="mb-2" />
                <p className="text-sm text-gray-400">{t('noContacts')}</p>
              </div>
            )}
            {doctors.map((doc) => (
              <div key={doc.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${selectedDoctor?.id === doc.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                <button onClick={() => navigate(`/doctor/${doc.id}`)} className="relative flex-shrink-0 group">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 group-hover:ring-2 group-hover:ring-blue-400 transition">
                    {initials(doc.name)}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${doc.online ? 'bg-green-400' : 'bg-gray-300'}`} />
                  {unreadIds.has(doc.id) && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>
                <button onClick={() => selectDoctor(doc)} className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">Dr. {doc.name}</p>
                  <p className="text-xs text-gray-400">{doc.online ? t('online') : t('offline')}</p>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation panel */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
          {!selectedDoctor ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <User size={48} className="mb-3" />
              <p className="text-gray-400 text-sm">{t('selectContact')}</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => navigate(`/doctor/${selectedDoctor.id}`)} className="relative group">
                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                      {initials(selectedDoctor.name)}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${selectedDoctor.online ? 'bg-green-400' : 'bg-gray-300'}`} />
                  </button>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Dr. {selectedDoctor.name}</p>
                    <p className="text-xs text-gray-400">{selectedDoctor.online ? t('online') : t('offline')}</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/doctor/${selectedDoctor.id}`)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition">
                  <ExternalLink size={12} /> {t('viewProfile')}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {conversation.length === 0 && (
                  <p className="text-center text-sm text-gray-300 mt-8">No messages yet. Say hello!</p>
                )}
                {conversation.map((msg) => {
                  const reportMatch  = msg.content.match(/^\[Re: (.+?) #\d+\](.*)/)
                  const isDoctor     = msg.senderId !== user.id
                  const reportType   = reportMatch?.[1]
                  const text         = reportMatch ? reportMatch[2].trim() : msg.content
                  const relatedReport = reportType
                    ? reports.find((r) => `${r.type} Report` === reportType && r.doctorId === msg.senderId)
                    : null
                  return (
                    <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs rounded-2xl text-sm overflow-hidden ${
                        msg.senderId === user.id ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}>
                        {isDoctor && reportType && (
                          <div className="border-b border-gray-200 bg-white overflow-hidden rounded-t-2xl">
                            {relatedReport?.imageData && (
                              <img src={relatedReport.imageData} alt="OCT" className="w-full max-h-36 object-contain bg-black" />
                            )}
                            <div className="flex items-center gap-2 px-3 py-2">
                              {typeIcons[reportType] || <FileText size={16} className="text-gray-400" />}
                              <span className="text-xs font-semibold text-gray-700">{reportType}</span>
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

              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('typeMessage')}
                  className="flex-1 bg-gray-100 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={handleSend}
                  className="bg-gray-900 text-white p-2.5 rounded-lg hover:bg-gray-800 transition">
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
