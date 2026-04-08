import { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import Navbar from '../../components/Navbar'
import { AppContext } from '../../context/AppContext'

const ROLES = [
  { value: 'customer', label: 'Customer' },
  { value: 'us_staff', label: 'АНУ ажилтан' },
  { value: 'mn_staff', label: 'МН ажилтан' },
  { value: 'admin',    label: 'Админ' },
]

const ROLE_COLORS = {
  customer: 'bg-gray-100 text-gray-600',
  us_staff: 'bg-blue-100 text-blue-700',
  mn_staff: 'bg-green-100 text-green-700',
  admin:    'bg-red-100 text-red-700',
}

const UserManagement = () => {
  const { backendUrl, userData } = useContext(AppContext)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pendingRoles, setPendingRoles] = useState({}) // { [userId]: newRole }

  // Шинэ ажилтан нэмэх форм
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'us_staff' })
  const [submitting, setSubmitting] = useState(false)

  // Edit
  const [editUser, setEditUser] = useState(null) // { _id, name, email }
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [editSaving, setEditSaving] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null)

  const fetchUsers = () => {
    setLoading(true)
    axios.get(backendUrl + '/api/user/all')
      .then(({ data }) => { if (data.success) setUsers(data.users) })
      .catch(() => toast.error('Хэрэглэгчид авахад алдаа гарлаа'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const hasChanges = Object.keys(pendingRoles).length > 0

  const handleRoleChange = (userId, role) => {
    setPendingRoles(prev => ({ ...prev, [userId]: role }))
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await Promise.all(
        Object.entries(pendingRoles).map(([id, role]) =>
          axios.patch(backendUrl + `/api/user/${id}/role`, { role })
        )
      )
      toast.success('Өөрчлөлтүүд хадгалагдлаа')
      setUsers(prev => prev.map(u => pendingRoles[u._id] ? { ...u, role: pendingRoles[u._id] } : u))
      setPendingRoles({})
    } catch {
      toast.error('Хадгалахад алдаа гарлаа')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (u) => {
    setEditUser(u)
    setEditForm({ name: u.name, email: u.email })
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    setEditSaving(true)
    try {
      const { data } = await axios.patch(backendUrl + `/api/user/staff/${editUser._id}`, editForm)
      if (data.success) {
        toast.success(data.message)
        setUsers(prev => prev.map(u => u._id === editUser._id ? { ...u, ...editForm } : u))
        setEditUser(null)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Алдаа гарлаа')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const { data } = await axios.delete(backendUrl + `/api/user/staff/${id}`)
      if (data.success) {
        toast.success(data.message)
        setUsers(prev => prev.filter(u => u._id !== id))
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Устгахад алдаа гарлаа')
    } finally {
      setDeleteId(null)
    }
  }

  const handleAddStaff = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/user/staff', form)
      if (data.success) {
        toast.success(data.message)
        setForm({ name: '', email: '', password: '', role: 'us_staff' })
        setShowForm(false)
        fetchUsers()
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Алдаа гарлаа')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 px-4 sm:px-8 max-w-4xl mx-auto pb-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Хэрэглэгч удирдах</h1>
            <p className="text-gray-500 text-sm mt-1">Шинэ ажилтан нэмэх, role өөрчлөх</p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="bg-black text-white px-5 py-2.5 rounded-full text-sm hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {saving ? 'Хадгалж байна...' : `Хадгалах (${Object.keys(pendingRoles).length})`}
              </button>
            )}
            <button
              onClick={() => setShowForm(v => !v)}
              className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-full text-sm hover:bg-gray-100 transition-all"
            >
              {showForm ? 'Хаах' : '+ Ажилтан нэмэх'}
            </button>
          </div>
        </div>

        {/* Шинэ ажилтан нэмэх форм */}
        {showForm && (
          <form onSubmit={handleAddStaff} className="bg-white rounded-2xl shadow p-6 mb-6 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-gray-800">Шинэ ажилтан үүсгэх</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Нэр</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="Бат-Эрдэнэ"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Имэйл</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="bat@autoparts.mn"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Нууц үг</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Үүрэг</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="us_staff">АНУ ажилтан</option>
                  <option value="mn_staff">МН ажилтан</option>
                  <option value="admin">Админ</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="self-end bg-black text-white px-8 py-2.5 rounded-full text-sm hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              {submitting ? 'Нэмж байна...' : 'Нэмэх'}
            </button>
          </form>
        )}

        {/* Хэрэглэгчдийн жагсаалт */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Уншиж байна...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Хэрэглэгч байхгүй байна.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Хэрэглэгч</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Одоогийн Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Role өөрчлөх</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => {
                  const isMe = u._id === userData?._id
                  const displayRole = pendingRoles[u._id] ?? u.role
                  const changed = pendingRoles[u._id] && pendingRoles[u._id] !== u.role

                  return (
                    <tr key={u._id} className={`transition-colors ${changed ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center font-semibold text-sm shrink-0">
                            {u.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {u.name}
                              {isMe && <span className="ml-2 text-xs text-gray-400">(та)</span>}
                            </p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>
                          {ROLES.find(r => r.value === u.role)?.label || u.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {isMe ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          <select
                            value={displayRole}
                            onChange={e => handleRoleChange(u._id, e.target.value)}
                            className={`border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10 ${changed ? 'border-yellow-400' : 'border-gray-200'}`}
                          >
                            {ROLES.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {isMe ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(u)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Засах
                            </button>
                            {deleteId === u._id ? (
                              <span className="flex items-center gap-1">
                                <button onClick={() => handleDelete(u._id)} className="text-xs text-red-600 font-medium hover:underline">Тийм</button>
                                <span className="text-gray-300">|</span>
                                <button onClick={() => setDeleteId(null)} className="text-xs text-gray-400 hover:underline">Үгүй</button>
                              </span>
                            ) : (
                              <button onClick={() => setDeleteId(u._id)} className="text-xs text-red-400 hover:text-red-600 hover:underline">
                                Устгах
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleEditSave} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4">
            <h2 className="text-base font-semibold text-gray-800">Ажилтан засах</h2>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Нэр</label>
              <input
                required
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Имэйл</label>
              <input
                required
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                Цуцлах
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="bg-black text-white px-6 py-2 rounded-full text-sm hover:bg-gray-800 disabled:opacity-50"
              >
                {editSaving ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default UserManagement
