import { useState, useRef, useEffect } from 'react'
import { Eye, X, Send, Loader2 } from 'lucide-react'
import { getToken } from '../api'
import { useLang } from '../context/LanguageContext'

export default function FloatingChatbot({ user }) {
  const { t } = useLang()
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([{ role: 'bot', content: t('chatbotGreeting') }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')

    // Build history from all messages after the initial local greeting
    const history = messages.slice(1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      content: m.content,
    }))

    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('http://localhost:9000/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken() ?? ''}`,
        },
        body: JSON.stringify({
          patientId: user.id,
          message: userMsg,
          conversationHistory: history,
        }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'bot', content: data.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', content: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button — hidden when chat is open */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="OCT Assistant"
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all z-50"
        >
          <Eye size={24} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: 400, height: 500 }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Eye size={18} />
              <span className="font-semibold text-sm">OCT Assistant</span>
            </div>
            <button onClick={() => setOpen(false)}
              className="hover:bg-blue-700 p-1 rounded-lg transition">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed text-left ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
                  dir="ltr">
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-gray-100 flex-shrink-0" dir="ltr">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={t('typeYourMessage')}
              className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm text-left outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
