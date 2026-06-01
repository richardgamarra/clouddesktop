const express  = require('express')
const crypto   = require('crypto')
const pool     = require('../db/pool')
const { hashPassword, verifyPassword } = require('../lib/hash')
const { signAccessToken, generateRefreshToken, hashToken, refreshTokenExpiresAt } = require('../lib/tokens')
const { sendVerificationEmail, sendPasswordResetEmail } = require('../lib/email')

const router = express.Router()

// ── helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isStrongPassword(pw) {
  return typeof pw === 'string' && pw.length >= 8
}

function setCookies(res, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: 'strict',
    maxAge:   parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30') * 24 * 60 * 60 * 1000,
    path:     '/api/auth',
  })
}

// ── POST /api/auth/signup ────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { email, password } = req.body || {}

  if (!isValidEmail(email))      return res.status(400).json({ error: 'Valid email required' })
  if (!isStrongPassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters' })

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' })

    const passwordHash        = await hashPassword(password)
    const emailVerifyToken    = crypto.randomBytes(32).toString('hex')
    const emailVerifyExpires  = new Date(Date.now() + 60 * 60 * 1000)

    await pool.query(
      `INSERT INTO users (email, password_hash, email_verify_token, email_verify_expires)
       VALUES ($1, $2, $3, $4)`,
      [email.toLowerCase(), passwordHash, emailVerifyToken, emailVerifyExpires]
    )

    await sendVerificationEmail(email, emailVerifyToken)

    return res.status(201).json({ message: 'Account created. Check your email to verify your account.' })
  } catch (err) {
    console.error('signup error:', err.message)
    return res.status(500).json({ error: 'Server error' })
  }
})

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}

  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, role, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    )
    const user = result.rows[0]

    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' })
    }

    const accessToken  = signAccessToken({ id: user.id, role: user.role })
    const refreshToken = generateRefreshToken()
    const tokenHash    = hashToken(refreshToken)
    const expiresAt    = refreshTokenExpiresAt()

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, tokenHash, expiresAt,
       req.headers['user-agent'] || '', req.ip || '']
    )

    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id])

    setCookies(res, accessToken, refreshToken)

    return res.json({
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    })
  } catch (err) {
    console.error('login error:', err.message)
    return res.status(500).json({ error: 'Server error' })
  }
})

// ── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const rawToken = req.cookies?.refresh_token
  if (!rawToken) return res.status(401).json({ error: 'No refresh token' })

  try {
    const tokenHash = hashToken(rawToken)
    const result = await pool.query(
      `SELECT rt.id, rt.user_id, rt.revoked, rt.expires_at, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    )
    const row = result.rows[0]

    if (!row || row.revoked || new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE id = $1', [row.id])

    const newRefreshToken = generateRefreshToken()
    const newTokenHash    = hashToken(newRefreshToken)
    const expiresAt       = refreshTokenExpiresAt()

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [row.user_id, newTokenHash, expiresAt]
    )

    const accessToken = signAccessToken({ id: row.user_id, role: row.role })
    setCookies(res, accessToken, newRefreshToken)

    return res.json({ accessToken })
  } catch (err) {
    console.error('refresh error:', err.message)
    return res.status(500).json({ error: 'Server error' })
  }
})

// ── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  const rawToken = req.cookies?.refresh_token
  if (rawToken) {
    try {
      const tokenHash = hashToken(rawToken)
      await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [tokenHash])
    } catch { /* ignore */ }
  }
  res.clearCookie('refresh_token', { path: '/api/auth' })
  return res.json({ message: 'Logged out' })
})

// ── GET /api/auth/verify-email/:token ───────────────────────────────────────
router.get('/verify-email/:token', async (req, res) => {
  const { token } = req.params
  try {
    const result = await pool.query(
      `SELECT id FROM users
       WHERE email_verify_token = $1 AND email_verify_expires > NOW() AND email_verified = false`,
      [token]
    )
    if (!result.rows.length) {
      return res.status(400).json({ error: 'Invalid or expired verification link' })
    }
    await pool.query(
      `UPDATE users SET email_verified = true, email_verify_token = NULL, email_verify_expires = NULL
       WHERE id = $1`,
      [result.rows[0].id]
    )
    return res.json({ message: 'Email verified. You can now log in.' })
  } catch (err) {
    console.error('verify-email error:', err.message)
    return res.status(500).json({ error: 'Server error' })
  }
})

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {}
  if (!isValidEmail(email)) return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' })

  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (result.rows.length) {
      const resetToken   = crypto.randomBytes(32).toString('hex')
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000)
      await pool.query(
        'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3',
        [resetToken, resetExpires, result.rows[0].id]
      )
      await sendPasswordResetEmail(email, resetToken)
    }
  } catch (err) {
    console.error('forgot-password error:', err.message)
  }
  return res.json({ message: 'If that email exists, a reset link has been sent.' })
})

// ── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {}
  if (!token || !isStrongPassword(password)) {
    return res.status(400).json({ error: 'Valid token and password (min 8 chars) required' })
  }
  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_expires > NOW()',
      [token]
    )
    if (!result.rows.length) {
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }
    const passwordHash = await hashPassword(password)
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2',
      [passwordHash, result.rows[0].id]
    )
    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [result.rows[0].id])
    return res.json({ message: 'Password reset successful. Please log in.' })
  } catch (err) {
    console.error('reset-password error:', err.message)
    return res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
