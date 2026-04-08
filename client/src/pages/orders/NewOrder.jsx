import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import Navbar from '../../components/Navbar'
import { AppContext } from '../../context/AppContext'

const emptyPart = () => ({ partNumber: '', description: '', quantity: 1, imageUrl: '', imageMode: 'url', notes: '' })

const NewOrder = () => {
  const navigate = useNavigate()
  const { backendUrl } = useContext(AppContext)

  const [vehicle, setVehicle] = useState({ make: '', model: '', year: '', engine: '' })
  const [parts, setParts] = useState([emptyPart()])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState(null)

  const updatePart = (index, field, value) => {
    setParts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const handleImageFile = async (index, file) => {
    if (!file) return
    const formData = new FormData()
    formData.append('image', file)
    setUploadingIndex(index)
    try {
      const { data } = await axios.post(backendUrl + '/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      })
      if (data.success) {
        updatePart(index, 'imageUrl', data.url)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Зураг upload хийхэд алдаа гарлаа')
    } finally {
      setUploadingIndex(null)
    }
  }

  const addPart = () => setParts(prev => [...prev, emptyPart()])

  const removePart = (index) => {
    if (parts.length === 1) return
    setParts(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validParts = parts.filter(p => p.partNumber.trim())
    if (validParts.length === 0) {
      toast.error('Дор хаяж нэг Part Number оруулна уу')
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/orders', {
        parts: validParts,
        vehicle,
        notes,
      })
      if (data.success) {
        toast.success('Захиалга амжилттай илгээгдлээ!')
        navigate('/orders')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 px-4 sm:px-8 max-w-3xl mx-auto pb-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/orders')} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Буцах
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Шинэ захиалга</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Автомашины мэдээлэл */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🚗 Автомашины мэдээлэл</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Марк</label>
                <input
                  type="text"
                  placeholder="Toyota, Ford, BMW..."
                  value={vehicle.make}
                  onChange={e => setVehicle(v => ({ ...v, make: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Загвар</label>
                <input
                  type="text"
                  placeholder="Camry, F-150, X5..."
                  value={vehicle.model}
                  onChange={e => setVehicle(v => ({ ...v, model: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Он</label>
                <input
                  type="number"
                  placeholder="2020"
                  min="1990"
                  max="2026"
                  value={vehicle.year}
                  onChange={e => setVehicle(v => ({ ...v, year: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Хөдөлгүүр</label>
                <input
                  type="text"
                  placeholder="2.5L, V6, 1GRFE..."
                  value={vehicle.engine}
                  onChange={e => setVehicle(v => ({ ...v, engine: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Эд ангиуд */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">🔧 Эд ангиуд</h2>
              <button
                type="button"
                onClick={addPart}
                className="text-sm text-blue-600 hover:underline"
              >
                + Нэмэх
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {parts.map((part, index) => (
                <div key={index} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Эд анги #{index + 1}</span>
                    {parts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePart(index)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        Устгах
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Part Number *</label>
                      <input
                        type="text"
                        placeholder="48210-60030"
                        required
                        value={part.partNumber}
                        onChange={e => updatePart(index, 'partNumber', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Тоо ширхэг</label>
                      <input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={e => updatePart(index, 'quantity', parseInt(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Тайлбар</label>
                      <input
                        type="text"
                        placeholder="Front control arm bush..."
                        value={part.description}
                        onChange={e => updatePart(index, 'description', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Зураг</label>
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => updatePart(index, 'imageMode', 'url')}
                          className={`text-xs px-3 py-1 rounded-full border transition-all ${part.imageMode !== 'file' ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}
                        >
                          URL
                        </button>
                        <button
                          type="button"
                          onClick={() => updatePart(index, 'imageMode', 'file')}
                          className={`text-xs px-3 py-1 rounded-full border transition-all ${part.imageMode === 'file' ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}
                        >
                          Файл / Галерей
                        </button>
                      </div>
                      {part.imageMode !== 'file' ? (
                        <input
                          type="url"
                          placeholder="https://..."
                          value={part.imageUrl}
                          onChange={e => updatePart(index, 'imageUrl', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                        />
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-200 rounded-lg py-4 cursor-pointer bg-white hover:border-gray-400 transition-all">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handleImageFile(index, e.target.files[0])}
                          />
                          {uploadingIndex === index ? (
                            <span className="text-xs text-gray-400">Upload хийж байна...</span>
                          ) : part.imageUrl ? (
                            <img src={part.imageUrl} alt="preview" className="max-h-32 rounded-lg object-contain" />
                          ) : (
                            <span className="text-xs text-gray-400">Зургаа сонгоно уу</span>
                          )}
                        </label>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Нэмэлт тэмдэглэл</label>
                      <input
                        type="text"
                        placeholder="OEM эсвэл aftermarket гэх мэт..."
                        value={part.notes}
                        onChange={e => updatePart(index, 'notes', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Нэмэлт тайлбар */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">💬 Нэмэлт тайлбар</h2>
            <textarea
              rows={3}
              placeholder="Нэмэлт мэдээлэл, онцгой хүсэлт..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none"
            />
          </div>

          {/* Илгээх товч */}
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white py-3 rounded-2xl font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? 'Илгээж байна...' : 'Захиалга илгээх'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default NewOrder
