process.env.JWT_SECRET             = 'test_secret_at_least_32_chars_long_abc'
process.env.JWT_EXPIRES_IN         = '15m'
process.env.REFRESH_TOKEN_EXPIRES_DAYS = '30'
process.env.APP_URL                = 'http://localhost'

const request = require('supertest')
const express = require('express')
const cookieParser = require('cookie-parser')
const pool  = require('../db/pool')
const { hashPassword } = require('../lib/hash')
const { generateRefreshToken, hashToken, refreshTokenExpiresAt } = require('../lib/tokens')

jest.mock('../lib/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}))

const authRouter = require('../routes/auth')
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', authRouter)

const EMAIL    = `test_refresh_${Date.now()}@example.com`
const PASSWORD = 'Password123!'
let userId, rawRefreshToken

beforeAll(async () => {
  const hash = await hashPassword(PASSWORD)
  const r = await pool.query(
    'INSERT INTO users (email, password_hash, email_verified) VALUES ($1, $2, true) RETURNING id',
    [EMAIL, hash]
  )
  userId = r.rows[0].id

  rawRefreshToken = generateRefreshToken()
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hashToken(rawRefreshToken), refreshTokenExpiresAt()]
  )
})

afterAll(async () => {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId])
  await pool.query('DELETE FROM users WHERE id = $1', [userId])
  await pool.end()
})

test('POST /api/auth/refresh issues new accessToken with valid cookie', async () => {
  const res = await request(app)
    .post('/api/auth/refresh')
    .set('Cookie', [`refresh_token=${rawRefreshToken}`])
  expect(res.status).toBe(200)
  expect(res.body.accessToken).toBeDefined()
})

test('POST /api/auth/refresh returns 401 with no cookie', async () => {
  const res = await request(app).post('/api/auth/refresh')
  expect(res.status).toBe(401)
})

test('POST /api/auth/refresh returns 401 with invalid token', async () => {
  const res = await request(app)
    .post('/api/auth/refresh')
    .set('Cookie', ['refresh_token=invalidtoken'])
  expect(res.status).toBe(401)
})

test('POST /api/auth/logout clears cookie', async () => {
  const res = await request(app)
    .post('/api/auth/logout')
    .set('Cookie', [`refresh_token=${rawRefreshToken}`])
  expect(res.status).toBe(200)
  const cookies = res.headers['set-cookie'] || []
  expect(cookies.some(c => c.includes('refresh_token=;') || c.includes('refresh_token=,') || c.includes('Max-Age=0'))).toBe(true)
})
