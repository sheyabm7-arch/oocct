import { createContext, useContext, useState, useEffect } from 'react'
import { saveReport, getPatientReports } from '../api'

const ReportsContext = createContext(null)

export function ReportsProvider({ userId, children }) {
  const [reports, setReports] = useState([])

  useEffect(() => {
    if (!userId) return
    getPatientReports(userId).then((data) => {
      if (Array.isArray(data)) setReports(data)
    })
  }, [userId])

  const addReport = async ({ type, doctor, summary, diagnosis, confidence, imageData }) => {
    const report = {
      patientId: userId,
      doctorId: doctor.id,
      type,
      diagnosis: diagnosis || summary,
      confidence: confidence || null,
      recommendation: summary,
      imageData: imageData || null,
      status: 'PENDING',
    }
    const saved = await saveReport(report)
    if (saved.id) {
      setReports((prev) => [saved, ...prev])
    }
  }

  const removeReport = (id) => setReports((prev) => prev.filter((r) => r.id !== id))

  return (
    <ReportsContext.Provider value={{ reports, addReport, removeReport }}>
      {children}
    </ReportsContext.Provider>
  )
}

export function useReports() {
  return useContext(ReportsContext)
}
