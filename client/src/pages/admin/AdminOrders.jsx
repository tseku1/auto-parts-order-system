import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import Navbar from '../../components/Navbar'
import { AppContext } from '../../context/AppContext'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  submitted:           { text: 'Илгээсэн',               color: 'bg-blue-100 text-blue-700' },
  assigned:            { text: 'Боловсруулж байна',       color: 'bg-purple-100 text-purple-700' },
  quote_sent:          { text: 'Үнийн санал ирсэн',       color: 'bg-yellow-100 text-yellow-700' },
  quote_approved:      { text: 'Үнийн санал зөвшөөрсөн',  color: 'bg-green-100 text-green-700' },
  quote_rejected:      { text: 'Үнийн санал татгалзсан',  color: 'bg-red-100 text-red-700' },
  prepayment_uploaded: { text: 'Урьдчилгаа хүлээгдэж байна', color: 'bg-orange-100 text-orange-700' },
  prepayment_verified: { text: 'Урьдчилгаа баталгаажсан', color: 'bg-teal-100 text-teal-700' },
  parts_ordered:       { text: 'Эд анги захиалагдсан',    color: 'bg-indigo-100 text-indigo-700' },
  shipped:             { text: 'Тээвэрлэгдэж байна',      color: 'bg-sky-100 text-sky-700' },
  arrived:             { text: 'Монголд ирсэн',            color: 'bg-cyan-100 text-cyan-700' },
  out_for_delivery:    { text: 'Хүргэлтэнд гарсан',       color: 'bg-lime-100 text-lime-700' },
  delivered:           { text: 'Хүргэгдсэн',              color: 'bg-emerald-100 text-emerald-700' },
  completed:           { text: 'Дууссан',                  color: 'bg-gray-100 text-gray-600' },
  cancelled:           { text: 'Цуцлагдсан',              color: 'bg-red-100 text-red-500' },
}

const FILTER_TABS = [
  { key: 'all',         label: 'Бүгд',          statuses: null },
  { key: 'new',         label: 'Шинэ',          statuses: ['submitted'] },
  { key: 'processing',  label: 'Боловсруулалт', statuses: ['assigned', 'quote_sent', 'quote_approved', 'quote_rejected'] },
  { key: 'payment',     label: 'Төлбөр',        statuses: ['prepayment_uploaded', 'prepayment_verified'] },
  { key: 'shipping',    label: 'Тээвэр',        statuses: ['parts_ordered', 'shipped', 'arrived', 'out_for_delivery', 'delivered'] },
  { key: 'completed',   label: 'Дууссан',       statuses: ['completed'] },
  { key: 'cancelled',   label: 'Цуцлагдсан',    statuses: ['cancelled'] },
]

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color }) => (
  <div className={`bg-white rounded-2xl shadow p-4 border-l-4 ${color}`}>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
  </div>
)

// ── Main Component ─────────────────────────────────────────────────────────────

const AdminOrders = () => {
  const navigate = useNavigate()
  const { backendUrl } = useContext(AppContext)

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [acting, setActing] = useState(null) // orderId

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(backendUrl + '/api/orders')
      if (data.success) setOrders(data.orders)
      else toast.error(data.message)
    } catch {
      toast.error('Захиалга ачаалахад алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [backendUrl])

  const handleAction = async (orderId, endpoint) => {
    setActing(orderId)
    try {
      const { data } = await axios.post(backendUrl + `/api/orders/${orderId}/${endpoint}`)
      if (data.success) {
        toast.success(data.message)
        setOrders(prev => prev.map(o => o._id === orderId ? data.order : o))
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Үйлдэл хийхэд алдаа гарлаа')
    } finally {
      setActing(null)
    }
  }

  const handleDelete = async (id) => {
    try {
      const { data } = await axios.delete(backendUrl + `/api/orders/${id}`)
      if (data.success) {
        toast.success(data.message)
        setOrders(prev => prev.filter(o => o._id !== id))
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Устгахад алдаа гарлаа')
    } finally {
      setDeleteConfirm(null)
    }
  }

  // ── Filter + Search ───────────────────────────────────────────────────────

  const tabStatuses = FILTER_TABS.find(t => t.key === activeTab)?.statuses

  const filtered = orders.filter(o => {
    const matchTab = !tabStatuses || tabStatuses.includes(o.status)
    const q = search.toLowerCase()
    const matchSearch = !q ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.customer?.email?.toLowerCase().includes(q) ||
      o.vehicle?.make?.toLowerCase().includes(q) ||
      o.vehicle?.model?.toLowerCase().includes(q)
    return matchTab && matchSearch
  })

  // ── Stats ─────────────────────────────────────────────────────────────────

  const total     = orders.length
  const newCount  = orders.filter(o => o.status === 'submitted').length
  const inProg    = orders.filter(o => !['submitted', 'completed', 'cancelled'].includes(o.status)).length
  const completed = orders.filter(o => o.status === 'completed').length
  const cancelled = orders.filter(o => o.status === 'cancelled').length

  // ── Tab counts ────────────────────────────────────────────────────────────

  const tabCount = (tab) => {
    if (!tab.statuses) return orders.length
    return orders.filter(o => tab.statuses.includes(o.status)).length
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 px-4 sm:px-8 max-w-7xl mx-auto pb-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Захиалга удирдах</h1>
            <p className="text-sm text-gray-500 mt-1">Бүх захиалгыг харах, засах, устгах</p>
          </div>
          <button
            onClick={fetchOrders}
            className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-100 transition-all"
          >
            Шинэчлэх
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <StatCard label="Нийт" value={total} color="border-blue-500" />
          <StatCard label="Шинэ" value={newCount} color="border-purple-500" />
          <StatCard label="Явцтай" value={inProg} color="border-yellow-500" />
          <StatCard label="Дууссан" value={completed} color="border-green-500" />
          <StatCard label="Цуцлагдсан" value={cancelled} color="border-red-400" />
        </div>

        {/* Filter tabs + Search */}
        <div className="bg-white rounded-2xl shadow mb-4">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100 px-4 gap-1 pt-3">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2 ${
                  activeTab === tab.key
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tabCount(tab)}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-4 py-3">
            <input
              type="text"
              placeholder="Захиалгын дугаар, захиалагч, машин хайх..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Уншиж байна...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📦</p>
              <p>Захиалга олдсонгүй</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Дугаар</th>
                    <th className="text-left px-5 py-3">Захиалагч</th>
                    <th className="text-left px-5 py-3">Машин</th>
                    <th className="text-left px-5 py-3">Эд анги</th>
                    <th className="text-left px-5 py-3">Статус</th>
                    <th className="text-left px-5 py-3">Ажилтан</th>
                    <th className="text-left px-5 py-3">Дүн</th>
                    <th className="text-left px-5 py-3">Огноо</th>
                    <th className="text-left px-5 py-3">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(order => {
                    const st = STATUS_LABEL[order.status] || { text: order.status, color: 'bg-gray-100 text-gray-600' }
                    return (
                      <tr
                        key={order._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Дугаар */}
                        <td className="px-5 py-4">
                          <button
                            onClick={() => navigate(`/orders/${order._id}`)}
                            className="font-mono text-sm font-semibold text-blue-600 hover:underline text-left"
                          >
                            {order.orderNumber}
                          </button>
                        </td>

                        {/* Захиалагч */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-800">{order.customer?.name || '—'}</p>
                          <p className="text-xs text-gray-400">{order.customer?.email}</p>
                        </td>

                        {/* Машин */}
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-700">
                            {[order.vehicle?.make, order.vehicle?.model, order.vehicle?.year].filter(Boolean).join(' ') || '—'}
                          </p>
                          {order.vehicle?.engine && (
                            <p className="text-xs text-gray-400">{order.vehicle.engine}</p>
                          )}
                        </td>

                        {/* Эд анги тоо */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-700">{order.parts?.length ?? 0} ш</span>
                          <p className="text-xs text-gray-400 truncate max-w-28">
                            {order.parts?.map(p => p.partNumber).join(', ')}
                          </p>
                        </td>

                        {/* Статус */}
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${st.color}`}>
                            {st.text}
                          </span>
                        </td>

                        {/* Ажилтан */}
                        <td className="px-5 py-4">
                          {order.assignedTo ? (
                            <p className="text-sm text-gray-700">{order.assignedTo.name}</p>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        {/* Дүн */}
                        <td className="px-5 py-4">
                          {order.quote?.totalAmount ? (
                            <p className="text-sm font-semibold text-gray-800">
                              ${order.quote.totalAmount.toFixed(2)}
                            </p>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        {/* Огноо */}
                        <td className="px-5 py-4">
                          <p className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString('mn-MN')}
                          </p>
                        </td>

                        {/* Үйлдэл */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/orders/${order._id}`)}
                              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-all"
                            >
                              Харах
                            </button>
                            <button
                              onClick={() => navigate(`/orders/${order._id}/edit`)}
                              className="text-xs text-blue-600 hover:underline border border-blue-100 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-all"
                            >
                              Засах
                            </button>
                            {deleteConfirm === order._id ? (
                              <span className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(order._id)}
                                  className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-all"
                                >
                                  Тийм
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg"
                                >
                                  Үгүй
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(order._id)}
                                className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-all"
                              >
                                Устгах
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer: count */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} захиалга харагдаж байна {filtered.length !== orders.length && `(нийт ${orders.length}-аас)`}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default AdminOrders
