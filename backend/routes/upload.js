const express = require('express')
const multer  = require('multer')
const path    = require('path')
const fs      = require('fs')
const requireAuth = require('../middleware/auth')

const router = express.Router()

// Store uploads in /var/www/clouddesktop/uploads/backgrounds/ on server
// Locally store next to backend for dev
const UPLOAD_DIR = path.join(__dirname, '../../uploads/backgrounds')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg'
    const name = `bg_${req.user.id}_${Date.now()}${ext}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimetype)
    cb(null, ok)
    if (!ok) cb(new Error('Only image files allowed'))
  },
})

// POST /api/upload/background
router.post('/background', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  // Delete old background for this user (keep storage clean)
  try {
    fs.readdirSync(UPLOAD_DIR)
      .filter(f => f.startsWith(`bg_${req.user.id}_`) && f !== req.file.filename)
      .forEach(f => fs.unlinkSync(path.join(UPLOAD_DIR, f)))
  } catch {}
  const url = `/uploads/backgrounds/${req.file.filename}`
  res.json({ url })
})

module.exports = router
