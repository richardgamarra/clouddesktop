const { hashPassword, verifyPassword } = require('../lib/hash')

test('hashPassword returns a bcrypt hash', async () => {
  const hash = await hashPassword('mypassword')
  expect(hash).toMatch(/^\$2[aby]\$/)
})

test('verifyPassword returns true for correct password', async () => {
  const hash = await hashPassword('mypassword')
  expect(await verifyPassword('mypassword', hash)).toBe(true)
})

test('verifyPassword returns false for wrong password', async () => {
  const hash = await hashPassword('mypassword')
  expect(await verifyPassword('wrong', hash)).toBe(false)
})
