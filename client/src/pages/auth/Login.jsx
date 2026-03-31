import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import assets from '../../assets/assets.js'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AppContext } from '../../context/AppContext.jsx'
import { toast } from 'react-toastify'

const Login = () => {
  
  const navigate = useNavigate()

  const appContext = useContext(AppContext)
  if (!appContext) console.warn('AppContext is null or undefined')
  const { backendUrl, setIsLoggedIn, getUserData } = appContext || {}

  const [state, setState] = useState('Sign Up')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();

      axios.defaults.withCredentials = true

      if (state === 'Sign Up') {
        const { data } = await axios.post(backendUrl + '/api/auth/register', { name, email, password })
        if (data.success) {
          setIsLoggedIn(true)
          getUserData()
          navigate('/')
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await axios.post(backendUrl + '/api/auth/login', { email, password })
        if (data.success) {
          setIsLoggedIn(true)
          getUserData()
          navigate('/')
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'An error occurred'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-200 to-purple-400">
      <img src={assets.logo} alt="Logo"
        className="absolute left-4 top-4 w-20 sm:w-24 cursor-pointer"
        onClick={() => navigate('/')} />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-6 sm:p-8 text-white">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold">{state === 'Sign Up' ? 'Create account' : 'Welcome back'}</h2>
          <p className="text-sm text-white/80 mt-1">{state === 'Sign Up' ? 'Create your account' : 'Login to your account'}</p>
        </div>

        <form onSubmit={onSubmitHandler} className="space-y-4">
          {state === 'Sign Up' && (
            <div className="flex items-center gap-3 w-full px-4 py-2 rounded-full bg-[#333A5C]">
              <img src={assets.person_icon} alt="user" className="w-5 h-5" />
              <input className="bg-transparent outline-none text-white placeholder-white/70 flex-1"
                onChange={e => setName(e.target.value)}
                value={name}
                type="text" placeholder="Full Name" required />
            </div>
          )}

          <div className="flex items-center gap-3 w-full px-4 py-2 rounded-full bg-[#333A5C]">
            <img src={assets.mail_icon} alt="email" className="w-5 h-5" />
            <input className="bg-transparent outline-none text-white placeholder-white/70 flex-1"
              onChange={e => setEmail(e.target.value)}
              value={email}
              type="email" placeholder="Email" required />
          </div>

          <div className="flex items-center gap-3 w-full px-4 py-2 rounded-full bg-[#333A5C]">
            <img src={assets.lock_icon} alt="lock" className="w-5 h-5" />
            <input className="bg-transparent outline-none text-white placeholder-white/70 flex-1"
              onChange={e => setPassword(e.target.value)}
              value={password}
              type="password" placeholder="Password" required />
          </div>

          {state !== 'Sign Up' && (
            <div className="w-full flex justify-end mt-2">
              <Link to="/reset-password" className="text-sm text-white/80 underline">Forgot password?</Link>
            </div>
          )}

          <button type="submit" className="w-full py-2.5 rounded-full bg-white text-[#111827] font-medium">{state === 'Sign Up' ? 'Create account' : 'Login'}</button>
        </form>

        <div className="text-center mt-4 text-sm text-white/80">
          <button onClick={() => setState(state === 'Sign Up' ? 'Login' : 'Sign Up')} className="underline">
            {state === 'Sign Up' ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login