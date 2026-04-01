const MONCASH_BASE = process.env.MONCASH_BASE_URL || 'https://sandbox.moncashbutton.digicelgroup.com'

export async function createMonCashPayment(amount: number, orderId: string) {
  const clientId = process.env.MONCASH_CLIENT_ID
  const clientSecret = process.env.MONCASH_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('MonCash credentials not configured')
  }

  // 1. Get access token
  const tokenRes = await fetch(`${MONCASH_BASE}/Api/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'scope=read,write&grant_type=client_credentials',
  })

  if (!tokenRes.ok) {
    throw new Error(`MonCash token error: ${tokenRes.status}`)
  }

  const { access_token } = await tokenRes.json()

  // 2. Create payment
  const paymentRes = await fetch(`${MONCASH_BASE}/Api/v1/CreatePayment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, orderId }),
  })

  if (!paymentRes.ok) {
    throw new Error(`MonCash payment error: ${paymentRes.status}`)
  }

  return paymentRes.json()
}

export async function getMonCashPaymentStatus(transactionId: string) {
  const clientId = process.env.MONCASH_CLIENT_ID
  const clientSecret = process.env.MONCASH_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('MonCash credentials not configured')
  }

  const tokenRes = await fetch(`${MONCASH_BASE}/Api/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'scope=read,write&grant_type=client_credentials',
  })

  if (!tokenRes.ok) {
    throw new Error(`MonCash token error: ${tokenRes.status}`)
  }

  const { access_token } = await tokenRes.json()

  const statusRes = await fetch(`${MONCASH_BASE}/Api/v1/RetrieveTransactionPayment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactionId }),
  })

  return statusRes.json()
}
