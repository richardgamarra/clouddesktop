process.env.JWT_SECRET = 'test_secret_at_least_32_chars_long_abc'
process.env.JWT_EXPIRES_IN = '15m'
process.env.REFRESH_TOKEN_EXPIRES_DAYS = '30'

const { signAccessToken, verifyAccessToken, generateRefreshToken, hashToken } = require('../lib/tokens')

test('signAccessToken returns a JWT string', () => {
  const token = signAccessToken({ id: 'uuid-123', role: 'free' })
  expect(typeof token).toBe('string')
  expect(token.split('.')).toHaveLength(3)
})

test('verifyAccessToken decodes a valid token', () => {
  const token = signAccessToken({ id: 'uuid-123', role: 'free' })
  const payload = verifyAccessToken(token)
  expect(payload.id).toBe('uuid-123')
  expect(payload.role).toBe('free')
})

test('verifyAccessToken returns null for invalid token', () => {
  expect(verifyAccessToken('bad.token.here')).toBeNull()
})

test('generateRefreshToken returns 64-char hex string', () => {
  const token = generateRefreshToken()
  expect(token).toMatch(/^[0-9a-f]{64}$/)
})

test('hashToken returns SHA-256 hex string', () => {
  const hash = hashToken('sometoken')
  expect(hash).toMatch(/^[0-9a-f]{64}$/)
})

test('two calls to generateRefreshToken return different values', () => {
  expect(generateRefreshToken()).not.toBe(generateRefreshToken())
})
