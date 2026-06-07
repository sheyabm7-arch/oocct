import { useState, useEffect } from 'react'
import { Users, Stethoscope, UserRound, Clock, FileText, AlertTriangle } from 'lucide-react'
import { getAdminStats } from '../../api'

const cards = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'patients', label: 'Patients', icon: UserRound, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { key: 'doctors', label: 'Doctors', icon: Stethoscope, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { key: 'pendingDoctors', label: 'Pending Doctors', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'reports', label: 'Reports', icon: FileText, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { key: 'openComplaints', label: 'Open Complaints', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getAdminStats().then((data) => {
      if (data && typeof data === 'object') setStats(data)
    })
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">System overview and monitoring</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className="bg-white rounded-xl shadow-sm p-5">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats ? (stats[key] ?? 0) : '—'}
            </p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
        <Clock className="text-blue-500" size={24} />
        <div>
          <p className="font-semibold text-gray-900">
            {stats ? stats.pendingDoctors ?? 0 : '—'} doctor account(s) awaiting approval
          </p>
          <p className="text-sm text-gray-500">Review them in the Manage Users tab</p>
        </div>
      </div>
    </div>
  )
}
