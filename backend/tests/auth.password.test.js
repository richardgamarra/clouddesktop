process.env.JWT_SECRET             = 'test_secret_at_least_32_chars_long_abc'
process.env.JWT_EXPIRES_IN         = '15m'
process.env.REFRESH_TOKEN_EXPIRES_DAYS = '30'
process.env.APP_URL                = 'http://localhost'

const request = require('supertest')
const express = require('express')
const cookieParser = require('cookie-parser')
const crypto = require('crypto')
const pool   = require('../db/pool')
const { hashPassword } = require('../lib/hash')

jest.mock('../lib/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}))
const { sendPasswordResetEmail } = require('../lib/email')

const authRouter = require('../routes/auth')
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', authRouter)

const EMAIL = `test_pw_${Date.now()}@example.com`
let userId, verifyToken, resetToken

beforeAll(async () => {
  verifyToken = crypto.randomBytes(32).toString('hex')
  const hash  = await hashPassword('OldPassword1!')
  const r = await pool.query(
    `INSERT INTO users (email, password_hash, email_verified, email_verify_token, email_verify_expires)
     VALUES ($1, $2, false, $3, $4) RETURNING id`,
    [EMAIL, hash, verifyToken, new Date(Date.now() + 3600000)]
  )
  userId = r.rows[0].id
})

afterAll(async () => {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId])
  await pool.query('DELETE FROM users WHERE id = $1', [userId])
  await pool.end()
})

test('GET /api/auth/verify-email/:token verifies email', async () => {
  const res = await request(app).get(`/api/auth/verify-email/${verifyToken}`)
  expect(res.status).toBe(200)
  expect(res.body.message).toBeDefined()
  const row = await pool.query('SELECT email_verified FROM users WHERE id = $1', [userId])
  expect(row.rows[0].email_verified).toBe(true)
})

test('GET /api/auth/verify-email/:token returns 400 for invalid token', async () => {
  const res = await request(app).get('/api/auth/verify-email/badtoken')
  expect(res.status).toBe(400)
})

test('POST /api/auth/forgot-password sends reset email', async () => {
  const res = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: EMAIL })
  expect(res.status).toBe(200)
  expect(sendPasswordResetEmail).toHaveBeenCalled()
  const row = await pool.query('SELECT reset_token FROM users WHERE id = $1', [userId])
  resetToken = row.rows[0].reset_token
  expect(resetToken).toBeTruthy()
})

test('POST /api/auth/forgot-password returns 200 for unknown email (no enumeration)', async () => {
  const res = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'nobody@example.com' })
  expect(res.status).toBe(200)
})

test('POST /api/auth/reset-password resets password with valid token', async () => {
  const res = await request(app)
    .post('/api/auth/reset-password')
    .send({ token: resetToken, password: 'NewPassword1!' })
  expect(res.status).toBe(200)
})

test('POST /api/auth/reset-password returns 400 for invalid token', async () => {
  const res = await request(app)
    .post('/api/auth/reset-password')
    .send({ token: 'badtoken', password: 'NewPassword1!' })
  expect(res.status).toBe(400)
})
