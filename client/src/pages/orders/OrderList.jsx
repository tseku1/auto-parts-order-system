import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import Navbar from '../../components/Navbar'
import { AppContext } from '../../context/AppContext'

const STATUS_LABEL = {
  submitted: { text: 'Илгээсэн', color: 'bg-blue-100 text-blue-700' },
  assigned: { text: 'Боловсруулж байна', color: 'bg-purple-100 text-purple-700' },
  quote_sent: { text: 'Үнийн санал ирсэн', color: 'bg-yellow-100 text-yellow-700' },
  quote_approved: { text: 'Үнийн санал зөвшөөрсөн', color: 'bg-green-100 text-green-700' },
  quote_rejected: { text: 'Үнийн санал татгалзсан', color: 'bg-red-100 text-red-700' },
  prepayment_uploaded: { text: 'Урьдчилгаа хүлээгдэж байна', color: 'bg-orange-100 text-orange-700' },
  prepayment_verified: { text: 'Урьдчилгаа баталгаажсан', color: 'bg-teal-100 text-teal-700' },
  parts_ordered: { text: 'Эд анги захиалагдсан', color: 'bg-indigo-100 text-indigo-700' },
  shipped: { text: 'Тээвэрлэгдэж байна', color: 'bg-sky-100 text-sky-700' },
  arrived: { text: 'Монголд ирсэн', color: 'bg-cyan-100 text-cyan-700' },
  out_for_delivery: { text: 'Хүргэлтэнд гарсан', color: 'bg-lime-100 text-lime-700' },
  delivered: { text: 'Хүргэгдсэн', color: 'bg-emerald-100 text-emerald-700' },
  completed: { text: 'Дууссан', color: 'bg-gray-100 text-gray-600' },
  cancelled: { text: 'Цуцлагдсан', color: 'bg-red-100 text-red-500' },
}

const OrderList = () => {
  const navigate = useNavigate()
  const { backendUrl, userData } = useContext(AppContext)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get(backendUrl + '/api/orders')
        if (data.success) setOrders(data.orders)
        else toast.error(data.message)
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [backendUrl])

  const pageTitle = () => {
    if (userData?.role === 'us_staff') return 'Захиалгын жагсаалт (АНУ)'
    if (userData?.role === 'mn_staff') return 'Захиалгын жагсаалт (Монгол)'
    if (userData?.role === 'admin') return 'Бүх захиалгууд'
    return 'Миний захиалгууд'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 px-4 sm:px-8 max-w-5xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{pageTitle()}</h1>
          {userData?.role === 'customer' && (
            <button
              onClick={() => navigate('/orders/new')}
              className="bg-black text-white px-5 py-2.5 rounded-full text-sm hover:bg-gray-800 transition-all"
            >
              + Шинэ захиалга
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Уншиж байна...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p>Захиалга байхгүй байна</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map(order => {
              const st = STATUS_LABEL[order.status] || { text: order.status, color: 'bg-gray-100 text-gray-600' }
              return (
                <div
                  key={order._id}
                  onClick={() => navigate(`/orders/${order._id}`)}
                  className="bg-white rounded-2xl shadow p-5 cursor-pointer hover:shadow-md transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-gray-800">{order.orderNumber}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>{st.text}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {order.vehicle?.make} {order.vehicle?.model} {order.vehicle?.year}
                      {' · '}
                      {order.parts?.length} эд анги
                    </p>
                    {(userData?.role !== 'customer') && order.customer && (
                      <p className="text-xs text-gray-400">{order.customer.name} · {order.customer.email}</p>
                    )}
                    {order.assignedTo && userData?.role !== 'customer' && (
                      <p className="text-xs text-gray-400">Хариуцаж байна: {order.assignedTo.name}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('mn-MN')}
                    </p>
                    {order.quote?.totalAmount && (
                      <p className="text-sm font-semibold text-gray-700 mt-1">
                        ${order.quote.totalAmount.toFixed(2)}
                      </p>
                    )}
                    <span className="text-gray-300 text-lg">›</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderList
