const jwt    = require('jsonwebtoken')
const crypto = require('crypto')

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    algorithm: 'HS256',
  })
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
  } catch {
    return null
  }
}

function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex')
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function refreshTokenExpiresAt() {
  const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30')
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

module.exports = { signAccessToken, verifyAccessToken, generateRefreshToken, hashToken, refreshTokenExpiresAt }
