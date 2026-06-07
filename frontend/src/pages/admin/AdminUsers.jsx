import { useState, useEffect } from 'react'
import { Users, Stethoscope, UserRound, CheckCircle, XCircle, Trash2, Ban, RotateCcw, FileImage, X } from 'lucide-react'
import { getAllUsers, approveUser, rejectUser, deleteUser, banUser, unbanUser, getUserDocuments } from '../../api'

const statusBadge = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
  BANNED: 'bg-red-100 text-red-700',
}

function DocumentsModal({ user, onClose, onApprove, onReject }) {
  const [docs, setDocs] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserDocuments(user.id).then((d) => { setDocs(d); setLoading(false) })
  }, [user.id])

  const sections = [
    { key: 'idDocument', label: 'National ID / Passport' },
    { key: 'specialtyCertificate', label: 'Ophthalmology Specialty Certificate' },
    { key: 'practiceLicense', label: 'Current Practice License' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileImage size={20} className="text-blue-500" />
            <p className="font-bold text-gray-900">Verification Documents — {user.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm py-10 text-center">Loading documents...</p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">{user.email}</p>
            {sections.map(({ key, label }) => (
              <div key={key}>
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">{label}</p>
                {docs && docs[key] ? (
                  <img src={docs[key]} alt={label} className="w-full rounded-xl border border-gray-200 object-contain max-h-72 bg-gray-50" />
                ) : (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">Not provided</p>
                )}
              </div>
            ))}
            {user.status === 'PENDING' && (
              <div className="flex gap-2 border-t border-gray-100 pt-4">
                <button
                  onClick={() => { onApprove(user.id); onClose() }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition"
                >
                  <CheckCircle size={15} /> Approve Doctor
                </button>
                <button
                  onClick={() => { onReject(user.id); onClose() }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition"
                >
                  <XCircle size={15} /> Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [viewingDocs, setViewingDocs] = useState(null)

  const load = () => {
    setLoading(true)
    getAllUsers().then((data) => {
      if (Array.isArray(data)) setUsers(data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id) => {
    await approveUser(id)
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: 'ACTIVE' } : u))
  }

  const handleReject = async (id) => {
    await rejectUser(id)
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: 'REJECTED' } : u))
  }

  const handleBan = async (id) => {
    if (!window.confirm('Ban this user? They will no longer be able to log in.')) return
    await banUser(id)
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, banned: true } : u))
  }

  const handleUnban = async (id) => {
    await unbanUser(id)
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, banned: false } : u))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return
    await deleteUser(id)
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  const filtered = users.filter((u) => {
    if (filter === 'ALL') return true
    if (filter === 'PENDING') return u.role === 'DOCTOR' && u.status === 'PENDING'
    return u.role === filter
  })

  const tabs = [
    { key: 'ALL', label: 'All' },
    { key: 'PATIENT', label: 'Patients' },
    { key: 'DOCTOR', label: 'Doctors' },
    { key: 'PENDING', label: 'Pending Doctors' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
        <p className="text-gray-500 text-sm mt-1">Approve doctors and manage all accounts</p>
      </div>

      <div className="flex bg-gray-100 rounded-full p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              filter === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <p className="text-gray-400 text-sm py-10 text-center">Loading users...</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <Users size={56} className="mb-4" />
            <p className="text-gray-500 font-medium">No users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => (
              <div key={u.id} className="border border-gray-100 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 hover:shadow-sm transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {u.role === 'DOCTOR'
                      ? <Stethoscope size={18} className="text-indigo-500" />
                      : <UserRound size={18} className="text-emerald-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email} · {u.role}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusBadge[u.status] || 'bg-gray-100 text-gray-600'}`}>
                    {(u.status || 'ACTIVE').toLowerCase()}
                  </span>
                  {u.banned && (
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-red-100 text-red-700">
                      banned
                    </span>
                  )}
                  {u.role === 'DOCTOR' && u.hasDocuments && (
                    <button
                      onClick={() => setViewingDocs(u)}
                      className="flex items-center gap-1.5 text-xs border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                    >
                      <FileImage size={13} /> Documents
                    </button>
                  )}
                  {u.role === 'DOCTOR' && u.status !== 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => handleApprove(u.id)}
                        className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
                      >
                        <CheckCircle size={13} /> {u.status === 'PENDING' ? 'Approve' : 'Re-approve'}
                      </button>
                      <button
                        onClick={() => handleReject(u.id)}
                        className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </>
                  )}
                  {u.banned ? (
                    <button
                      onClick={() => handleUnban(u.id)}
                      className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
                    >
                      <RotateCcw size={13} /> Unban
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBan(u.id)}
                      className="flex items-center gap-1.5 text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                    >
                      <Ban size={13} /> Ban
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(u.id)}
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

      {viewingDocs && (
        <DocumentsModal
          user={viewingDocs}
          onClose={() => setViewingDocs(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  )
}
