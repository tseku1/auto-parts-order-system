import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../models/userModel.js')
vi.mock('../config/nodeMailer.js', () => ({ default: { sendMail: vi.fn() } }))

import { verifyEmail, sendVerifyOtp } from '../controllers/authController.js'
import userModel from '../models/userModel.js'
import transporter from '../config/nodeMailer.js'

const mockRes = () => {
  const res = {}
  res.json = vi.fn().mockReturnValue(res)
  return res
}

// ───────────────────────────────────────────
describe('verifyEmail', () => {
  it('userId эсвэл otp байхгүй → алдаа', async () => {
    const req = { userId: '', body: { otp: '' } }
    const res = mockRes()
    await verifyEmail(req, res)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Missing Details' })
  })

  it('user олдоогүй → алдаа', async () => {
    userModel.findById = vi.fn().mockResolvedValue(null)
    const req = { userId: 'abc', body: { otp: '123456' } }
    const res = mockRes()
    await verifyEmail(req, res)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' })
  })

  it('OTP хугацаа дууссан → алдаа', async () => {
    userModel.findById = vi.fn().mockResolvedValue({
      verifyOtp: '123456',
      verifyOtpExpireAt: Date.now() - 1000,
    })
    const req = { userId: 'abc', body: { otp: '123456' } }
    const res = mockRes()
    await verifyEmail(req, res)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'OTP Expired' })
  })

  it('OTP буруу → алдаа', async () => {
    userModel.findById = vi.fn().mockResolvedValue({
      verifyOtp: '999999',
      verifyOtpExpireAt: Date.now() + 10000,
    })
    const req = { userId: 'abc', body: { otp: '123456' } }
    const res = mockRes()
    await verifyEmail(req, res)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid OTP' })
  })

  it('OTP зөв → баталгаажсан', async () => {
    const user = {
      verifyOtp: '123456',
      verifyOtpExpireAt: Date.now() + 10000,
      isAccountVerified: false,
      save: vi.fn().mockResolvedValue(true),
    }
    userModel.findById = vi.fn().mockResolvedValue(user)
    const req = { userId: 'abc', body: { otp: '123456' } }
    const res = mockRes()
    await verifyEmail(req, res)
    expect(user.isAccountVerified).toBe(true)
    expect(user.verifyOtp).toBe('')
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Email verified successfully' })
  })
})

// ───────────────────────────────────────────
describe('sendVerifyOtp', () => {
  it('user олдоогүй → алдаа', async () => {
    userModel.findById = vi.fn().mockResolvedValue(null)
    const req = { userId: 'abc' }
    const res = mockRes()
    await sendVerifyOtp(req, res)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' })
  })

  it('аль хэдийн баталгаажсан → алдаа', async () => {
    userModel.findById = vi.fn().mockResolvedValue({ isAccountVerified: true })
    const req = { userId: 'abc' }
    const res = mockRes()
    await sendVerifyOtp(req, res)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Account Already verified' })
  })

  it('OTP илгээнэ → амжилт', async () => {
    const user = {
      isAccountVerified: false,
      email: 'test@test.com',
      verifyOtp: '',
      verifyOtpExpireAt: 0,
      save: vi.fn().mockResolvedValue(true),
    }
    userModel.findById = vi.fn().mockResolvedValue(user)
    transporter.sendMail = vi.fn().mockResolvedValue({})
    const req = { userId: 'abc' }
    const res = mockRes()
    await sendVerifyOtp(req, res)
    expect(user.verifyOtp).toMatch(/^\d{6}$/)
    expect(transporter.sendMail).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Verification OTP Sent on Email' })
  })
})