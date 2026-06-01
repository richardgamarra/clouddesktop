process.env.JWT_SECRET             = 'test_secret_at_least_32_chars_long_abc'
process.env.JWT_EXPIRES_IN         = '15m'
process.env.REFRESH_TOKEN_EXPIRES_DAYS = '30'
process.env.APP_URL                = 'http://localhost'
process.env.SMTP_HOST              = 'localhost'
process.env.SMTP_PORT              = '25'

const request = require('supertest')
const express = require('express')
const cookieParser = require('cookie-parser')
const pool  = require('../db/pool')
const { hashPassword } = require('../lib/hash')

jest.mock('../lib/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}))

const authRouter = require('../routes/auth')
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', authRouter)

const EMAIL    = `test_login_${Date.now()}@example.com`
const PASSWORD = 'Password123!'

beforeAll(async () => {
  const hash = await hashPassword(PASSWORD)
  await pool.query(
    `INSERT INTO users (email, password_hash, email_verified)
     VALUES ($1, $2, true)`,
    [EMAIL, hash]
  )
})

afterAll(async () => {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [EMAIL])
  await pool.query('DELETE FROM users WHERE email = $1', [EMAIL])
  await pool.end()
})

test('POST /api/auth/login returns accessToken and sets cookie', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: EMAIL, password: PASSWORD })
  expect(res.status).toBe(200)
  expect(res.body.accessToken).toBeDefined()
  expect(res.body.user).toMatchObject({ email: EMAIL, role: 'free' })
  expect(res.headers['set-cookie']).toBeDefined()
})

test('POST /api/auth/login returns 401 for wrong password', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: EMAIL, password: 'wrongpassword' })
  expect(res.status).toBe(401)
})

test('POST /api/auth/login returns 401 for unknown email', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'nobody@example.com', password: PASSWORD })
  expect(res.status).toBe(401)
})

test('POST /api/auth/login returns 403 for unverified email', async () => {
  const unverifiedEmail = `test_unverified_${Date.now()}@example.com`
  const hash = await hashPassword(PASSWORD)
  await pool.query(
    'INSERT INTO users (email, password_hash, email_verified) VALUES ($1, $2, false)',
    [unverifiedEmail, hash]
  )
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: unverifiedEmail, password: PASSWORD })
  expect(res.status).toBe(403)
  await pool.query('DELETE FROM users WHERE email = $1', [unverifiedEmail])
})
