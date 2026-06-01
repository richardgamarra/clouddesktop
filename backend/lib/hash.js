const bcrypt = require('bcrypt')

const COST = 12

async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, COST)
}

async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash)
}

module.exports = { hashPassword, verifyPassword }
