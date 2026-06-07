import { useState } from 'react'
import { LayoutDashboard, Users, FileText, AlertTriangle, LogOut, Shield } from 'lucide-react'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminReports from '../pages/admin/AdminReports'
import AdminComplaints from '../pages/admin/AdminComplaints'

export default function AdminLayout({ user, onLogout }) {
  const [page, setPage] = useState('dashboard')

  const renderPage = () => {
    if (page === 'dashboard') return <AdminDashboard />
    if (page === 'users') return <AdminUsers />
    if (page === 'reports') return <AdminReports />
    if (page === 'complaints') return <AdminComplaints />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">OCT Analysis Platform</h1>
          <p className="text-sm text-gray-500">Welcome, {user.name}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </header>

      <div className="flex p-4 gap-4">
        <aside className="w-64 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Admin Portal</p>
            <nav className="space-y-1">
              {[
                { label: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
                { label: 'Manage Users', icon: Users, key: 'users' },
                { label: 'All Reports', icon: FileText, key: 'reports' },
                { label: 'Complaints', icon: AlertTriangle, key: 'complaints' },
              ].map(({ label, icon: Icon, key }) => (
                <button
                  key={key}
                  onClick={() => setPage(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    page === key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Admin Info</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-blue-500 font-medium">Administrator</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Email</p>
              <p className="text-sm text-gray-800">{user.email}</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">{renderPage()}</main>
      </div>
    </div>
  )
}
