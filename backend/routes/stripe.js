const express  = require('express')
const Stripe   = require('stripe')
const pool     = require('../db/pool')
const requireAuth = require('../middleware/auth')

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
const router = express.Router()

const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly:  process.env.STRIPE_PRICE_YEARLY,
}
const APP_URL = process.env.APP_URL_FRONTEND || 'https://clouddesktop.infoplay.com'

// ── GET /api/stripe/status — current subscription info for logged-in user ────
router.get('/status', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.role, u.stripe_customer_id,
              s.plan, s.status, s.current_period_end, s.stripe_subscription_id
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
       WHERE u.id = $1`,
      [req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/stripe/checkout — create a Stripe Checkout session ─────────────
router.post('/checkout', requireAuth, async (req, res) => {
  const { plan } = req.body
  if (!PRICES[plan]) return res.status(400).json({ error: 'Invalid plan' })

  try {
    const { rows } = await pool.query('SELECT email, stripe_customer_id FROM users WHERE id = $1', [req.user.id])
    if (!rows.length) return res.status(404).json({ error: 'User not found' })

    const { email, stripe_customer_id } = rows[0]

    let customerId = stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { user_id: req.user.id } })
      customerId = customer.id
      await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, req.user.id])
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      mode: 'subscription',
      success_url: `${APP_URL}/dashboard?upgrade=success`,
      cancel_url:  `${APP_URL}/dashboard?upgrade=cancelled`,
      metadata: { user_id: req.user.id, plan },
    })

    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/stripe/portal — Stripe billing portal (manage/cancel) ──────────
router.post('/portal', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT stripe_customer_id FROM users WHERE id = $1', [req.user.id])
    if (!rows.length || !rows[0].stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: rows[0].stripe_customer_id,
      return_url: `${APP_URL}/dashboard`,
    })

    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/stripe/webhook — Stripe events (raw body required) ─────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig    = req.headers['stripe-signature']
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  let event
  try {
    event = secret
      ? stripe.webhooks.constructEvent(req.body, sig, secret)
      : JSON.parse(req.body)
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId  = session.metadata?.user_id
        if (!userId) break
        const sub = await stripe.subscriptions.retrieve(session.subscription)
        const plan = session.metadata?.plan || 'monthly'
        await pool.query(
          `INSERT INTO subscriptions (user_id, plan, stripe_subscription_id, status, current_period_end)
           VALUES ($1, $2, $3, 'active', to_timestamp($4))
           ON CONFLICT (user_id) DO UPDATE
             SET plan = $2, stripe_subscription_id = $3, status = 'active',
                 current_period_end = to_timestamp($4), cancelled_at = NULL`,
          [userId, plan, sub.id, sub.current_period_end]
        )
        await pool.query(`UPDATE users SET role = 'premium' WHERE id = $1`, [userId])
        break
      }

      case 'invoice.payment_succeeded': {
        const inv = event.data.object
        const sub = await stripe.subscriptions.retrieve(inv.subscription)
        const { rows } = await pool.query(
          'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1', [sub.id]
        )
        if (rows.length) {
          await pool.query(
            `UPDATE subscriptions SET status = 'active', current_period_end = to_timestamp($1) WHERE stripe_subscription_id = $2`,
            [sub.current_period_end, sub.id]
          )
          await pool.query(`UPDATE users SET role = 'premium' WHERE id = $1`, [rows[0].user_id])
        }
        break
      }

      case 'invoice.payment_failed':
      case 'customer.subscription.deleted': {
        const subId = event.data.object.id || event.data.object.subscription
        const { rows } = await pool.query(
          'UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2 RETURNING user_id',
          [event.type === 'customer.subscription.deleted' ? 'cancelled' : 'past_due', subId]
        )
        if (rows.length) {
          await pool.query(`UPDATE users SET role = 'free' WHERE id = $1`, [rows[0].user_id])
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const { rows } = await pool.query(
          'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1', [sub.id]
        )
        if (rows.length) {
          await pool.query(
            `UPDATE subscriptions SET status = $1, current_period_end = to_timestamp($2) WHERE stripe_subscription_id = $3`,
            [sub.status, sub.current_period_end, sub.id]
          )
          const role = sub.status === 'active' || sub.status === 'trialing' ? 'premium' : 'free'
          await pool.query(`UPDATE users SET role = $1 WHERE id = $2`, [role, rows[0].user_id])
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
  }

  res.json({ received: true })
})

module.exports = router
