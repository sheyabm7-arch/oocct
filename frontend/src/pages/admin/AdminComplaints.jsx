import { useState, useEffect } from 'react'
import { AlertTriangle, Ban, CheckCircle, Trash2, UserX } from 'lucide-react'
import { getComplaints, banUser, resolveComplaint, deleteComplaint } from '../../api'

export default function AdminComplaints() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getComplaints().then((data) => {
      if (Array.isArray(data)) setItems(data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const handleBan = async (c) => {
    if (!window.confirm(`Ban ${c.targetName}? They will no longer be able to log in.`)) return
    await banUser(c.targetUserId)
    await resolveComplaint(c.id)
    setItems((prev) => prev.map((x) =>
      x.targetUserId === c.targetUserId ? { ...x, targetBanned: true } : x
    ).map((x) => x.id === c.id ? { ...x, status: 'RESOLVED' } : x))
  }

  const handleResolve = async (id) => {
    await resolveComplaint(id)
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, status: 'RESOLVED' } : x))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint?')) return
    await deleteComplaint(id)
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Complaints</h2>
        <p className="text-gray-500 text-sm mt-1">Patients reported by doctors — ban or dismiss</p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
        <AlertTriangle className="text-amber-500" size={24} />
        <div>
          <p className="font-semibold text-gray-900">
            {items.filter((c) => c.status === 'OPEN').length} open complaint(s)
          </p>
          <p className="text-sm text-gray-500">Banned users cannot log in to the platform</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <p className="text-gray-400 text-sm py-10 text-center">Loading complaints...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <UserX size={56} className="mb-4" />
            <p className="text-gray-500 font-medium">No complaints filed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <div key={c.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserX size={18} className="text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {c.targetName} <span className="text-xs text-gray-400">#{c.targetUserId} · {c.targetEmail}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        Reported by Dr {c.reporterName} · {fmt(c.createdAt)}
                      </p>
                      <p className="text-sm text-gray-700 mt-2 bg-gray-50 rounded-lg p-3">{c.reason}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex gap-1.5">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        c.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {(c.status || 'OPEN').toLowerCase()}
                      </span>
                      {c.targetBanned && (
                        <span className="text-xs px-3 py-1 rounded-full font-medium bg-red-100 text-red-700">banned</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
                  {!c.targetBanned && (
                    <button
                      onClick={() => handleBan(c)}
                      className="flex items-center gap-1.5 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition"
                    >
                      <Ban size={13} /> Ban User
                    </button>
                  )}
                  {c.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolve(c.id)}
                      className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                    >
                      <CheckCircle size={13} /> Dismiss
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(c.id)}
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
