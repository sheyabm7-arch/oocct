const BASE = ''

// ─── Token helpers ────────────────────────────────────────
export const getToken = () => localStorage.getItem('token')
export const saveToken = (t) => localStorage.setItem('token', t)
export const clearToken = () => localStorage.removeItem('token')

function authHeaders(extra = {}) {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

// ─── Auth (public — no token needed) ─────────────────────
export async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (data.token) saveToken(data.token)
  return data
}

export async function register(name, email, password, role, docs = {}, extra = {}) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name, email, password, role,
      idDocument: docs.idDocument || null,
      specialtyCertificate: docs.specialtyCertificate || null,
      practiceLicense: docs.practiceLicense || null,
      country: extra.country || null,
      city: extra.city || null,
      clinicName: extra.clinicName || null,
      clinicAddress: extra.clinicAddress || null,
    }),
  })
  return res.json()
}

// ─── Users ────────────────────────────────────────────────
export async function getDoctors() {
  const res = await fetch(`${BASE}/api/users/doctors`, { headers: authHeaders() })
  return res.json()
}

export async function getPatients() {
  const res = await fetch(`${BASE}/api/users/patients`, { headers: authHeaders() })
  return res.json()
}

export async function setOnlineStatus(userId, online) {
  await fetch(`${BASE}/api/users/${userId}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ online }),
  })
}

// ─── Reports ─────────────────────────────────────────────
export async function saveReport(report) {
  const res = await fetch(`${BASE}/api/reports`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(report),
  })
  return res.json()
}

export async function getPatientReports(patientId) {
  const res = await fetch(`${BASE}/api/reports/patient/${patientId}`, { headers: authHeaders() })
  return res.json()
}

export async function getDoctorReports(doctorId) {
  const res = await fetch(`${BASE}/api/reports/doctor/${doctorId}`, { headers: authHeaders() })
  return res.json()
}

export async function deleteReport(id) {
  const res = await fetch(`${BASE}/api/reports/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.json()
}

export async function updateReportStatus(id, status) {
  const res = await fetch(`${BASE}/api/reports/${id}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  })
  return res.json()
}

// ─── Messages ────────────────────────────────────────────
export async function sendMessage(senderId, receiverId, content) {
  const res = await fetch(`${BASE}/api/messages`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ senderId, receiverId, content }),
  })
  return res.json()
}

export async function getMessages(userId) {
  const res = await fetch(`${BASE}/api/messages/${userId}`, { headers: authHeaders() })
  return res.json()
}

// ─── Doctors by location ─────────────────────────────────
export async function getDoctorsByLocation(country = '', city = '') {
  const params = new URLSearchParams()
  if (country) params.set('country', country)
  if (city) params.set('city', city)
  const res = await fetch(`${BASE}/api/doctors/by-location?${params}`, { headers: authHeaders() })
  return res.json()
}

// ─── Patient Private Image Gallery ───────────────────────
export async function savePatientImage(patientId, source, imageData) {
  const res = await fetch(`${BASE}/api/patient-images`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ patientId, source, imageData }),
  })
  return res.json()
}

export async function getPatientImages(patientId) {
  const res = await fetch(`${BASE}/api/patient-images/${patientId}`, { headers: authHeaders() })
  return res.json()
}

export async function deletePatientImage(id) {
  const res = await fetch(`${BASE}/api/patient-images/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.json()
}

// ─── Admin ───────────────────────────────────────────────
export async function getAllUsers() {
  const res = await fetch(`${BASE}/api/admin/users`, { headers: authHeaders() })
  return res.json()
}

export async function getAdminStats() {
  const res = await fetch(`${BASE}/api/admin/stats`, { headers: authHeaders() })
  return res.json()
}

export async function approveUser(id) {
  const res = await fetch(`${BASE}/api/admin/users/${id}/approve`, {
    method: 'PUT',
    headers: authHeaders(),
  })
  return res.json()
}

export async function rejectUser(id) {
  const res = await fetch(`${BASE}/api/admin/users/${id}/reject`, {
    method: 'PUT',
    headers: authHeaders(),
  })
  return res.json()
}

export async function deleteUser(id) {
  const res = await fetch(`${BASE}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.json()
}

export async function banUser(id) {
  const res = await fetch(`${BASE}/api/admin/users/${id}/ban`, {
    method: 'PUT',
    headers: authHeaders(),
  })
  return res.json()
}

export async function unbanUser(id) {
  const res = await fetch(`${BASE}/api/admin/users/${id}/unban`, {
    method: 'PUT',
    headers: authHeaders(),
  })
  return res.json()
}

export async function getUserDocuments(id) {
  const res = await fetch(`${BASE}/api/admin/users/${id}/documents`, { headers: authHeaders() })
  return res.json()
}

export async function getAllReports() {
  const res = await fetch(`${BASE}/api/admin/reports`, { headers: authHeaders() })
  return res.json()
}

export async function deleteReportAdmin(id) {
  const res = await fetch(`${BASE}/api/admin/reports/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.json()
}

export async function getComplaints() {
  const res = await fetch(`${BASE}/api/admin/complaints`, { headers: authHeaders() })
  return res.json()
}

export async function resolveComplaint(id) {
  const res = await fetch(`${BASE}/api/admin/complaints/${id}/resolve`, {
    method: 'PUT',
    headers: authHeaders(),
  })
  return res.json()
}

export async function deleteComplaint(id) {
  const res = await fetch(`${BASE}/api/admin/complaints/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.json()
}

// ─── Complaints (doctor → admin) ─────────────────────────
export async function fileComplaint(reporterId, targetUserId, reason) {
  const res = await fetch(`${BASE}/api/complaints`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reporterId, targetUserId, reason }),
  })
  return res.json()
}
//123332131232312312312123123sdasd
