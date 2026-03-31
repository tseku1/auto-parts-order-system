import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('../models/userModel.js')
vi.mock('../config/nodeMailer.js', () => ({ default: { sendMail: vi.fn() } }))
vi.mock('bcryptjs')
vi.mock('jsonwebtoken')

import { register, login, logout } from '../controllers/authController.js'
import userModel from '../models/userModel.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const mockRes = () => {
  const res = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.cookie = vi.fn().mockReturnValue(res)
  res.clearCookie = vi.fn().mockReturnValue(res)
  return res
}

describe('register', () => {
  it('missing details → 400', async () => {
    const req = { body: { name: '', email: '', password: '' } }
    const res = mockRes()
    await register(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'missing details' })
  })

  it('existing email → 400', async () => {
    userModel.findOne = vi.fn().mockResolvedValue({ email: 'test@test.com' })
    const req = { body: { name: 'Test', email: 'test@test.com', password: '123' } }
    const res = mockRes()
    await register(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('login', () => {
  it('missing fields → 400', async () => {
    const req = { body: { email: '', password: '' } }
    const res = mockRes()
    await login(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('invalid email → 400', async () => {
    userModel.findOne = vi.fn().mockResolvedValue(null)
    const req = { body: { email: 'no@no.com', password: '123' } }
    const res = mockRes()
    await login(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('wrong password → 400', async () => {
    userModel.findOne = vi.fn().mockResolvedValue({ password: 'hashed' })
    bcrypt.compare = vi.fn().mockResolvedValue(false)
    const req = { body: { email: 'a@a.com', password: 'wrong' } }
    const res = mockRes()
    await login(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('logout', () => {
  it('cookie арилгаад success буцаана', () => {
    const req = {}
    const res = mockRes()
    logout(req, res)
    expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object))
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'user logged out successfully' })
  })
})
