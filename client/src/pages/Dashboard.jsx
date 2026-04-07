import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { AppContext } from '../context/AppContext'

const StatCard = ({ label, value, color }) => (
  <div className={`bg-white rounded-2xl shadow p-6 flex flex-col gap-2 border-l-4 ${color}`}>
    <span className="text-gray-500 text-sm">{label}</span>
    <span className="text-3xl font-bold text-gray-800">{value ?? '...'}</span>
  </div>
)

const CustomerDashboard = ({ userData, orders }) => {
  const navigate = useNavigate()

  const total = orders.length
  const pending = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length
  const completed = orders.filter(o => o.status === 'completed').length

  const recent = orders.slice(0, 5)

  const statusLabel = {
    submitted: 'Илгээсэн',
    assigned: 'Хуваарилагдсан',
    quote_sent: 'Үнийн санал ирсэн',
    quote_approved: 'Зөвшөөрсөн',
    quote_rejected: 'Татгалзсан',
    prepayment_uploaded: 'Урьдчилгаа хавсаргасан',
    prepayment_verified: 'Урьдчилгаа баталгаажсан',
    parts_ordered: 'Эд анги захиалагдсан',
    shipped: 'Тээвэрлэгдэж байна',
    arrived: 'Монголд ирсэн',
    out_for_delivery: 'Хүргэлтэнд гарсан',
    delivered: 'Хүргэгдсэн',
    completed: 'Дууссан',
    cancelled: 'Цуцлагдсан',
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Сайн байна уу, {userData.name}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">{userData.email}</p>
        </div>
        <button
          onClick={() => navigate('/orders/new')}
          className="bg-black text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-all text-sm font-medium"
        >
          + Шинэ захиалга
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Нийт захиалга" value={total} color="border-blue-500" />
        <StatCard label="Хүлээгдэж байгаа" value={pending} color="border-yellow-500" />
        <StatCard label="Дууссан" value={completed} color="border-green-500" />
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Сүүлийн захиалгууд</h2>
        {recent.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p>Одоогоор захиалга байхгүй байна.</p>
            <button
              onClick={() => navigate('/orders/new')}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Эхний захиалгаа үүсгэх
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map(o => (
              <div
                key={o._id}
                onClick={() => navigate(`/orders/${o._id}`)}
                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">{o.orderNumber}</p>
                  <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('mn-MN')}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {statusLabel[o.status] || o.status}
                </span>
              </div>
            ))}
            <button
              onClick={() => navigate('/orders')}
              className="mt-2 text-sm text-blue-600 hover:underline text-center"
            >
              Бүгдийг харах
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => navigate('/orders/new')}
          className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">🔧</div>
          <div>
            <p className="font-semibold text-gray-800">Захиалга үүсгэх</p>
            <p className="text-sm text-gray-500">Part Number-ээр эд анги захиалах</p>
          </div>
        </div>
        <div
          onClick={() => navigate('/orders')}
          className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">📋</div>
          <div>
            <p className="font-semibold text-gray-800">Захиалгын жагсаалт</p>
            <p className="text-sm text-gray-500">Бүх захиалгаа харах</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const StaffDashboard = ({ userData, orders }) => {
  const navigate = useNavigate()

  const assigned = orders.filter(o => o.assignedTo?._id === userData._id || o.assignedTo === userData._id).length
  const submitted = orders.filter(o => o.status === 'submitted').length
  const inProgress = orders.filter(o => !['submitted', 'completed', 'cancelled'].includes(o.status)).length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Ажилтны самбар</h1>
        <p className="text-gray-500 text-sm mt-1">{userData.name} · {userData.role}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Шинэ захиалга" value={submitted} color="border-purple-500" />
        <StatCard label="Явцтай" value={inProgress} color="border-yellow-500" />
        <StatCard label="Миний захиалга" value={assigned} color="border-blue-500" />
      </div>
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Захиалгууд</h2>
          <button onClick={() => navigate('/orders')} className="text-sm text-blue-600 hover:underline">
            Бүгдийг харах
          </button>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p>Захиалга байхгүй байна.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.slice(0, 5).map(o => (
              <div
                key={o._id}
                onClick={() => navigate(`/orders/${o._id}`)}
                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">{o.orderNumber}</p>
                  <p className="text-xs text-gray-400">{o.customer?.name}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{o.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const AdminDashboard = ({ userData, orders }) => {
  const navigate = useNavigate()

  const total = orders.length
  const newOrders = orders.filter(o => o.status === 'submitted').length
  const inProgress = orders.filter(o => !['submitted', 'completed', 'cancelled'].includes(o.status)).length
  const completed = orders.filter(o => o.status === 'completed').length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{userData.name} · {userData.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Нийт захиалга" value={total} color="border-blue-500" />
        <StatCard label="Шинэ" value={newOrders} color="border-purple-500" />
        <StatCard label="Явцтай" value={inProgress} color="border-yellow-500" />
        <StatCard label="Дууссан" value={completed} color="border-green-500" />
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Бүх захиалгууд</h2>
          <button onClick={() => navigate('/orders')} className="text-sm text-blue-600 hover:underline">
            Бүгдийг харах
          </button>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p>Захиалга байхгүй байна.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.slice(0, 5).map(o => (
              <div
                key={o._id}
                onClick={() => navigate(`/orders/${o._id}`)}
                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">{o.orderNumber}</p>
                  <p className="text-xs text-gray-400">{o.customer?.name}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{o.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/orders')}
          className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📋</div>
          <div>
            <p className="font-semibold text-gray-800">Захиалга удирдах</p>
            <p className="text-sm text-gray-500">Бүх захиалгыг харах, засах</p>
          </div>
        </div>
        <div
          onClick={() => navigate('/admin/users')}
          className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">👥</div>
          <div>
            <p className="font-semibold text-gray-800">Хэрэглэгч удирдах</p>
            <p className="text-sm text-gray-500">Ажилтан нэмэх, жагсаалт</p>
          </div>
        </div>
        <div
          onClick={() => navigate('/admin/parts')}
          className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">🔩</div>
          <div>
            <p className="font-semibold text-gray-800">Эд анги удирдах</p>
            <p className="text-sm text-gray-500">Part каталог</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const { userData, isLoggedIn, backendUrl } = useContext(AppContext)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    if (!isLoggedIn) return
    axios.get(backendUrl + '/api/orders')
      .then(({ data }) => { if (data.success) setOrders(data.orders) })
      .catch(() => {})
  }, [isLoggedIn])

  if (!isLoggedIn || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Уншиж байна...</p>
      </div>
    )
  }

  const renderDashboard = () => {
    if (userData.role === 'admin') return <AdminDashboard userData={userData} orders={orders} />
    if (userData.role === 'us_staff' || userData.role === 'mn_staff') return <StaffDashboard userData={userData} orders={orders} />
    return <CustomerDashboard userData={userData} orders={orders} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 px-4 sm:px-8 max-w-5xl mx-auto pb-10">
        {renderDashboard()}
      </div>
    </div>
  )
}

export default Dashboard
