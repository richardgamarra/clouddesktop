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

jest.mock('../lib/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}))

const authRouter = require('../routes/auth')

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', authRouter)

const TEST_EMAIL = `test_signup_${Date.now()}@example.com`

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email LIKE $1', ['test_signup_%@example.com'])
  await pool.end()
})

test('POST /api/auth/signup creates user and returns 201', async () => {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: TEST_EMAIL, password: 'Password123!' })
  expect(res.status).toBe(201)
  expect(res.body).toMatchObject({ message: expect.any(String) })
})

test('POST /api/auth/signup rejects duplicate email with 409', async () => {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: TEST_EMAIL, password: 'Password123!' })
  expect(res.status).toBe(409)
  expect(res.body).toMatchObject({ error: expect.any(String) })
})

test('POST /api/auth/signup rejects missing email with 400', async () => {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ password: 'Password123!' })
  expect(res.status).toBe(400)
})

test('POST /api/auth/signup rejects short password with 400', async () => {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: 'other@example.com', password: '123' })
  expect(res.status).toBe(400)
})
