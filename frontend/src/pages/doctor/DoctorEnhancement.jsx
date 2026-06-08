import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

export default function DoctorEnhancement() {
  const { t } = useLang()
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [enhanced, setEnhanced] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setEnhanced(null)
    setError('')
  }

  const handleEnhance = async () => {
    if (!image) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', image)
      const res = await fetch('/ai/enhance', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      setEnhanced(URL.createObjectURL(blob))
    } catch {
      setError('Enhancement service not available.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('enhancementTitle')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('docEnhanceSub')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">{t('uploadLowQuality')}</h3>
        <p className="text-gray-400 text-sm mb-4">{t('selectBlurry')}</p>

        <div
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
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

        {image && (
          <button onClick={handleEnhance} disabled={loading}
            className="mt-4 w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-60">
            {loading ? t('enhancing') : t('enhanceImage')}
          </button>
        )}
        {error && <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">{error}</div>}
      </div>

      {(preview || enhanced) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Original Image</p>
            {preview && <img src={preview} alt="original" className="w-full rounded-lg object-contain max-h-64" />}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Enhanced Image</p>
            {enhanced ? (
              <img src={enhanced} alt="enhanced" className="w-full rounded-lg object-contain max-h-64" />
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
                {loading ? 'Processing...' : 'Enhanced image will appear here'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
