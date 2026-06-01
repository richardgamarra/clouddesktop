const nodemailer = require('nodemailer')

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'localhost',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
    tls: { rejectUnauthorized: false },
  })
}

async function sendVerificationEmail(to, token) {
  const url = `${process.env.APP_URL}/verify-email/${token}`
  await createTransport().sendMail({
    from:    process.env.SMTP_FROM || 'noreply@clouddesktop.infoplay.com',
    to,
    subject: 'Verify your CloudDesktop Workspace email',
    html: `
      <h2>Welcome to CloudDesktop Workspace</h2>
      <p>Click the link below to verify your email address. This link expires in 1 hour.</p>
      <p><a href="${url}" style="background:#5b7fff;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Verify Email</a></p>
      <p>Or copy this URL: ${url}</p>
    `,
  })
}

async function sendPasswordResetEmail(to, token) {
  const url = `${process.env.APP_URL}/reset-password/${token}`
  await createTransport().sendMail({
    from:    process.env.SMTP_FROM || 'noreply@clouddesktop.infoplay.com',
    to,
    subject: 'Reset your CloudDesktop Workspace password',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${url}" style="background:#5b7fff;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Reset Password</a></p>
      <p>Or copy this URL: ${url}</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  })
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail }
