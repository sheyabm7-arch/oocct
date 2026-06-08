import { useState, useRef } from 'react'
import { Upload, Droplets, Send, Check } from 'lucide-react'
import SendToDoctorModal from '../../components/SendToDoctorModal'
import { savePatientImage } from '../../api'
import { useLang } from '../../context/LanguageContext'

export default function FluidQuantification({ user }) {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [showModal, setShowModal] = useState(false)
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
    if (user?.id) {
      const reader = new FileReader()
      reader.onload = () => {
        savePatientImage(user.id, 'Fluid Quantification', reader.result)
          .then(() => setSavedToProfile(true))
          .catch(() => {})
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleMeasure = async () => {
    if (!image) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', image)
      const res = await fetch('/ai/measure-fluid', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError('Fluid quantification service not available yet. This feature will be available after model training.')
    } finally {
      setLoading(false)
    }
  }

  const getFluidLevel = (percentage) => {
    if (percentage < 10) return { label: 'Mild', color: 'text-yellow-500', bg: 'bg-yellow-500' }
    if (percentage < 30) return { label: 'Moderate', color: 'text-orange-500', bg: 'bg-orange-500' }
    return { label: 'Severe', color: 'text-red-500', bg: 'bg-red-500' }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('fluidTitle')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('fluidSub')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-1">{t('uploadDme')}</h3>
          <p className="text-gray-400 text-sm mb-4">{t('uploadDmeSub')}</p>

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
              <img src={preview} alt="preview" className="max-h-40 rounded-lg object-contain" />
            ) : (
              <>
                <Upload className="text-gray-400 mb-3" size={36} />
                <p className="text-sm text-gray-500 font-medium">{t('clickUpload')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('pngUpTo')}</p>
              </>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

          {image && (
            <button
              onClick={handleMeasure}
              disabled={loading}
              className="mt-4 w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-60"
            >
              {loading ? t('measuring') : t('measureFluid')}
            </button>
          )}

          {savedToProfile && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600">
              <Check size={14} />
              {t('savedPrivately')}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
              {error}
            </div>
          )}
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900">{t('fluidResults')}</h3>
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
          <p className="text-gray-400 text-sm mb-4">{t('fluidResultsSub')}</p>

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-300">
              <Droplets size={48} className="mb-3" />
              <p className="text-sm text-gray-400">{t('uploadToMeasure')}</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-500">Measuring fluid...</p>
            </div>
          )}

          {result && (() => {
            const level = getFluidLevel(result.fluid_percentage)
            return (
              <div className="space-y-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fluid Percentage</p>
                  <p className={`text-4xl font-bold ${level.color}`}>
                    {result.fluid_percentage.toFixed(2)}%
                  </p>
                  <span className={`inline-block mt-2 text-sm font-semibold px-3 py-1 rounded-full ${level.color} bg-opacity-10`}>
                    {level.label}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Fluid Level</span>
                    <span className="font-semibold">{result.fluid_percentage.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`${level.bg} h-3 rounded-full transition-all`}
                      style={{ width: `${Math.min(result.fluid_percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {result.mask_image && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Fluid Segmentation Mask</p>
                    <img
                      src={`data:image/png;base64,${result.mask_image}`}
                      alt="fluid mask"
                      className="w-full rounded-lg object-contain max-h-40 bg-black"
                    />
                  </div>
                )}

                {result.recommendation && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                    <span className="font-semibold">Recommendation: </span>
                    {result.recommendation}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
      {showModal && (
        <SendToDoctorModal
          onClose={() => setShowModal(false)}
          reportType="Fluid Quantification"
          summary={result ? `Fluid: ${result.fluid_percentage}% — ${result.fluid_percentage < 5 ? 'No significant fluid' : result.fluid_percentage < 10 ? 'Mild' : result.fluid_percentage < 30 ? 'Moderate' : 'Severe'}` : ''}
          diagnosis={result ? `${result.fluid_percentage.toFixed(2)}% fluid detected` : ''}
          imageData={result?.mask_image ? `data:image/png;base64,${result.mask_image}` : null}
        />
      )}
    </div>
  )
}
