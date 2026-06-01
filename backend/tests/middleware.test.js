process.env.JWT_SECRET = 'test_secret_at_least_32_chars_long_abc'
process.env.JWT_EXPIRES_IN = '15m'

const { signAccessToken } = require('../lib/tokens')
const requireAuth = require('../middleware/auth')

function mockRes() {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json   = jest.fn().mockReturnValue(res)
  return res
}

test('requireAuth calls next() with valid Bearer token', () => {
  const token = signAccessToken({ id: 'user-1', role: 'free' })
  const req = { headers: { authorization: `Bearer ${token}` } }
  const res = mockRes()
  const next = jest.fn()
  requireAuth(req, res, next)
  expect(next).toHaveBeenCalledTimes(1)
  expect(req.user).toMatchObject({ id: 'user-1', role: 'free' })
})

test('requireAuth returns 401 with no token', () => {
  const req = { headers: {} }
  const res = mockRes()
  requireAuth(req, res, jest.fn())
  expect(res.status).toHaveBeenCalledWith(401)
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }))
})

test('requireAuth returns 401 with invalid token', () => {
  const req = { headers: { authorization: 'Bearer bad.token.here' } }
  const res = mockRes()
  requireAuth(req, res, jest.fn())
  expect(res.status).toHaveBeenCalledWith(401)
})
