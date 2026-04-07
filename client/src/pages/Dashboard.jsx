import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { AppContext } from '../context/AppContext'

const StatCard = ({ label, value, color }) => (
  <div className={`bg-white rounded-2xl shadow p-6 flex flex-col gap-2 border-l-4 ${color}`}>
    <span className="text-gray-500 text-sm">{label}</span>
    <span className="text-3xl font-bold text-gray-800">{value}</span>
  </div>
)

const CustomerDashboard = ({ userData }) => {
  const navigate = useNavigate()

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
        <StatCard label="Нийт захиалга" value="0" color="border-blue-500" />
        <StatCard label="Хүлээгдэж байгаа" value="0" color="border-yellow-500" />
        <StatCard label="Дууссан" value="0" color="border-green-500" />
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Сүүлийн захиалгууд</h2>
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

const AdminDashboard = ({ userData }) => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">{userData.name} · {userData.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Нийт захиалга" value="0" color="border-blue-500" />
        <StatCard label="Шинэ" value="0" color="border-purple-500" />
        <StatCard label="Явцтай" value="0" color="border-yellow-500" />
        <StatCard label="Дууссан" value="0" color="border-green-500" />
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Бүх захиалгууд</h2>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-sm text-blue-600 hover:underline"
          >
            Бүгдийг харах
          </button>
        </div>
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p>Захиалга байхгүй байна.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/admin/orders')}
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
            <p className="text-sm text-gray-500">Бүртгэлтэй хэрэглэгчид</p>
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
  const { userData, isLoggedIn } = useContext(AppContext)
  const navigate = useNavigate()

  if (!isLoggedIn || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Уншиж байна...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 px-4 sm:px-8 max-w-5xl mx-auto pb-10">
        {userData.role === 'admin'
          ? <AdminDashboard userData={userData} />
          : <CustomerDashboard userData={userData} />
        }
      </div>
    </div>
  )
}

export default Dashboard