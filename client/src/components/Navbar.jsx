import { useContext } from 'react'
import assets from '../assets/assets.js'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext.jsx'
import axios from 'axios'
import { toast } from 'react-toastify'

const Navbar = () => {
  const navigate = useNavigate()
  const { userData, backendUrl, setUserData, setIsLoggedIn } = useContext(AppContext) || {}

  const sendVerificationOtp = async () => {
    try {
      axios.defaults.withCredentials = true
      const { data } = await axios.post(backendUrl + '/api/auth/send-verify-otp')
      if (data.success) {
        navigate('/email-verify')
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true
      const { data } = await axios.post(backendUrl + '/api/auth/logout')
      if (data.success) {
        setIsLoggedIn(false)
        setUserData(false)
        navigate('/')
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const navLinks = userData?.role === 'admin'
    ? [
        { label: 'Бүх захиалга', path: '/admin/orders' },
        { label: 'Хэрэглэгчид', path: '/admin/users' },
      ]
    : [
        { label: 'Захиалгууд', path: '/orders' },
        { label: 'Шинэ захиалга', path: '/orders/new' },
      ]

  return (
    <div className='w-full flex justify-between items-center p-4 sm:p-6 sm:px-24 absolute top-0'>
      <div className='flex items-center gap-8'>
        <img
          src={assets.logo}
          alt="Logo"
          className='w-28 sm:w-32 cursor-pointer'
          onClick={() => navigate(userData ? '/dashboard' : '/')}
        />
        {userData && (
          <nav className='hidden sm:flex gap-6'>
            {navLinks.map(link => (
              <span
                key={link.path}
                onClick={() => navigate(link.path)}
                className='text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors'
              >
                {link.label}
              </span>
            ))}
          </nav>
        )}
      </div>

      {userData ? (
        <div className='w-8 h-8 flex justify-center items-center rounded-full bg-black text-white relative group cursor-pointer'>
          {userData.name[0].toUpperCase()}
          <div className='absolute hidden group-hover:block top-0 right-0 z-10 text-black rounded pt-10'>
            <ul className='list-none m-0 p-2 bg-white shadow-lg rounded-lg text-sm min-w-35'>
              <li
                onClick={() => navigate('/dashboard')}
                className='py-1.5 px-3 hover:bg-gray-100 cursor-pointer rounded'
              >
                Dashboard
              </li>
              {!userData.isAccountVerified && (
                <li
                  onClick={sendVerificationOtp}
                  className='py-1.5 px-3 hover:bg-gray-100 cursor-pointer rounded text-yellow-600'
                >
                  Имэйл баталгаажуулах
                </li>
              )}
              <li
                onClick={logout}
                className='py-1.5 px-3 hover:bg-gray-100 cursor-pointer rounded text-red-500'
              >
                Гарах
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <button
          onClick={() => navigate('/login')}
          className='flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all'
        >
          Нэвтрэх
          <img src={assets.arrow_icon} alt='arrow' />
        </button>
      )}
    </div>
  )
}

export default Navbar