import { useState, useRef } from 'react'
import { Upload, FileImage, Send, Check } from 'lucide-react'
import SendToDoctorModal from '../../components/SendToDoctorModal'
import { savePatientImage } from '../../api'
import { useLang } from '../../context/LanguageContext'

const CONFIDENCE_COLORS = {
  CNV: 'text-red-500',
  DME: 'text-blue-500',
  DRUSEN: 'text-yellow-500',
  NORMAL: 'text-green-600',
}

const CONDITION_INFO = {
  CNV: 'Choroidal Neovascularization detected. Abnormal blood vessel growth beneath the retina.',
  DME: 'Diabetic Macular Edema detected. Fluid accumulation in the macula.',
  DRUSEN: 'Drusen detected. Yellow deposits beneath the retina associated with AMD.',
  NORMAL: 'No abnormalities detected. Retinal structure appears healthy.',
}

export default function AIDiagnosis({ user }) {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [imageData, setImageData] = useState(null)
  const [savedToProfile, setSavedToProfile] = useState(false)
  const inputRef = useRef()
  const { t } = useLang()

  const handleFile = (file) => {
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError('')
    setSavedToProfile(false)
    const reader = new FileReader()
    reader.onload = () => {
      setImageData(reader.result)
      // Auto-save uploaded image to the patient's private gallery
      if (user?.id) {
        savePatientImage(user.id, 'AI Diagnosis', reader.result)
          .then(() => setSavedToProfile(true))
          .catch(() => {})
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleAnalyze = async () => {
    if (!image) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', image)
      const res = await fetch('/ai/classify', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError('Failed to connect to AI service. Make sure the AI server is running on port 8001.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('diagnosisTitle')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('diagnosisSub')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-1">{t('uploadOct')}</h3>
          <p className="text-gray-400 text-sm mb-4">{t('selectScan')}</p>

          <div
            onClick={() => inputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {preview ? (
              <img src={preview} alt="preview" className="max-h-48 rounded-lg object-contain" />
            ) : (
              <>
                <Upload className="text-gray-400 mb-3" size={36} />
                <p className="text-sm text-gray-500 font-medium">{t('clickUpload')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('pngUpTo')}</p>
              </>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

          {savedToProfile && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600">
              <Check size={14} />
              {t('savedPrivately')}
            </div>
          )}

          {image && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-4 w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-60"
            >
              {loading ? t('analyzing') : t('analyzeImage')}
            </button>
          )}
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900">{t('analysisResults')}</h3>
            {result && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
              >
                <Send size={12} />
                {t('sendToDoctor')}
              </button>
            )}
          </div>
          <p className="text-gray-400 text-sm mb-4">{t('analysisResults')}</p>

          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-300">
              <FileImage size={48} className="mb-3" />
              <p className="text-sm text-gray-400">{t('uploadAnalyzeResults')}</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-500">{t('analyzing')}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('diagnosis')}</p>
                <p className={`text-3xl font-bold ${CONFIDENCE_COLORS[result.disease] || 'text-gray-900'}`}>
                  {result.disease}
                </p>
                <p className="text-sm text-gray-500 mt-2">{CONDITION_INFO[result.disease]}</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{t('confidence')}</span>
                  <span className="font-semibold">{result.confidence}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>

              {result.all_predictions && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t('allScores')}</p>
                  {Object.entries(result.all_predictions).map(([label, score]) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className={CONFIDENCE_COLORS[label] || 'text-gray-600'}>{label}</span>
                        <span>{score}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-400 h-1.5 rounded-full"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <SendToDoctorModal
          onClose={() => setShowModal(false)}
          reportType="AI Diagnosis"
          summary={result ? `${result.disease} — ${result.confidence}% confidence` : ''}
          diagnosis={result?.disease}
          confidence={result?.confidence}
          imageData={imageData}
        />
      )}
    </div>
  )
}
