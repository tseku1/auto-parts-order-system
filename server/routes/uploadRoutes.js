import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import userAuth from '../middleware/userAuth.js'

const router = express.Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '..', 'uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Зөвхөн зураг оруулна уу'))
  },
})

router.post('/', userAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.json({ success: false, message: 'Зураг олдсонгүй' })
  const base = process.env.BACKEND_URL || 'http://localhost:4000'
  res.json({ success: true, url: `${base}/uploads/${req.file.filename}` })
})

export default router
