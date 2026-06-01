const { verifyAccessToken } = require('../lib/tokens')

function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.user = payload
  next()
}

module.exports = requireAuth
