import Big from 'big.js'
import { delay, http, HttpResponse } from 'msw'
import { NETWORKS } from '@/constants/catalog'
import { STORAGE_KEYS } from '@/constants/storage'
import type {
  CheckoutProfile,
  Coupon,
  CreateOrderBody,
  Order,
  OrderUpdatedEvent,
  Quote,
  QuoteBody,
  QuoteLine,
  WalletConnection,
  WalletProvider,
} from '@/types/api'
import { ESTIMATED_NETWORK_FEE } from '@/utils/eth'
import { readStoredJson, saveStoredJson } from '@/utils/storage'
import { WALLET_ADDRESS_PATTERN } from '@/utils/validation'
import { findRequestUserId, unauthorizedResponse } from './auth'
import coupons from './data/coupons.json'
import wallets from './data/wallets.json'
import { getNftEditions, getNfts, getTokenId, sellEditions } from './market'
import { publish } from './realtime'
import { getScenario, networkDelay } from './scenario'

const SETTLE_DELAY_MS = 3000
const LOST_RESPONSE_DELAY_MS = 8000

type StoredOrder = {
  order: Order
  user_id: string
  idempotency_key: string
  request_body: string
  outcome: 'confirm' | 'decline'
  settle_at: number
}

function getOrders() {
  return readStoredJson<StoredOrder[]>(STORAGE_KEYS.mockOrders, [])
}

function saveOrders(orders: StoredOrder[]) {
  saveStoredJson(STORAGE_KEYS.mockOrders, orders)
}

function getPaymentAddress(profile: CheckoutProfile) {
  return profile.use_secondary_wallet ? profile.secondary_wallet : profile.wallet_address
}

function findCoupon(code: string): { coupon?: Coupon; error?: string; status?: number } {
  const coupon = coupons.find((item) => item.code === code.trim().toUpperCase())
  if (!coupon) return { error: 'Cupom inválido.', status: 404 }
  if (coupon.expired) return { error: 'Este cupom expirou.', status: 410 }
  return { coupon: { code: coupon.code, discount_percent: coupon.discount_percent } }
}

function hashText(text: string) {
  let hash = 5381
  text.split('').forEach((char) => {
    hash = (hash * 33 + char.charCodeAt(0)) >>> 0
  })
  return hash.toString(36)
}

function buildQuote({ items, coupon_code }: QuoteBody): Quote {
  const nfts = getNfts()
  const lines: QuoteLine[] = []
  const warnings: string[] = []

  items.forEach((item) => {
    const nft = nfts.find((catalogNft) => catalogNft.id === item.nft_id)
    const edition = getNftEditions(item.nft_id).find((nftEdition) => nftEdition.id === item.edition)
    if (!nft || !edition) {
      warnings.push('Um NFT do carrinho não está mais à venda.')
      return
    }

    const quantity = Math.min(item.quantity, edition.available)
    if (quantity === 0) {
      warnings.push(`${nft.name} (${edition.label}) esgotou.`)
      return
    }
    if (quantity < item.quantity) {
      warnings.push(`Só ${quantity} de ${nft.name} (${edition.label}) disponíveis.`)
    }

    lines.push({
      nft_id: nft.id,
      edition: edition.id,
      quantity,
      requested_quantity: item.quantity,
      name: nft.name,
      token_id: getTokenId(nft),
      url_img: nft.url_img,
      edition_label: edition.label,
      price: nft.currency.ethereum,
      line_total: new Big(nft.currency.ethereum).times(quantity).toString(),
    })
  })

  let subtotal = new Big(0)
  lines.forEach((line) => {
    subtotal = subtotal.plus(line.line_total)
  })

  const couponResult = coupon_code ? findCoupon(coupon_code) : {}
  const coupon = couponResult.coupon ?? null
  const discount = coupon ? subtotal.times(coupon.discount_percent).div(100) : new Big(0)
  const networkFee = new Big(lines.length > 0 ? ESTIMATED_NETWORK_FEE : 0)

  const values = {
    lines,
    warnings,
    coupon,
    coupon_error: couponResult.error ?? null,
    subtotal: subtotal.toString(),
    discount: discount.toString(),
    network_fee: networkFee.toString(),
    total: subtotal.minus(discount).plus(networkFee).toString(),
  }
  return { quote_id: `q-${hashText(JSON.stringify(values))}`, ...values }
}

function validateOrder(body: CreateOrderBody) {
  if (!WALLET_ADDRESS_PATTERN.test(getPaymentAddress(body.profile))) {
    const field = body.profile.use_secondary_wallet ? 'secondary_wallet' : 'wallet_address'
    return { message: 'O endereço da carteira precisa ser 0x seguido de 40 caracteres hexadecimais.', field }
  }

  const network = NETWORKS.find((item) => item.slug === body.network)
  if (!network) return { message: 'Selecione uma rede.', field: 'network' }

  const nftOutOfNetwork = getNfts().find(
    (nft) => body.items.some((item) => item.nft_id === nft.id) && nft.currency[network.slug] === null,
  )
  if (nftOutOfNetwork) {
    return { message: `${nftOutOfNetwork.name} não está disponível na rede ${network.label}.`, field: 'network' }
  }

  return null
}

function toOrderUpdatedEvent(order: Order): OrderUpdatedEvent {
  return {
    eventId: crypto.randomUUID(),
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: new Date().toISOString(),
    data: { status: order.status, tx_hash: order.tx_hash, decline_reason: order.decline_reason },
  }
}

function settleOrder(orderId: string) {
  const orders = getOrders()
  const stored = orders.find((item) => item.order.id === orderId)
  if (!stored || stored.order.status !== 'pending') return

  const isConfirmed = stored.outcome === 'confirm'
  const order: Order = {
    ...stored.order,
    status: isConfirmed ? 'confirmed' : 'declined',
    version: stored.order.version + 1,
    tx_hash: isConfirmed ? `0x${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}` : null,
    decline_reason: isConfirmed ? null : 'A carteira recusou o pagamento. Nenhum valor foi cobrado.',
  }
  saveOrders(orders.map((item) => (item.order.id === orderId ? { ...item, order } : item)))

  publish([toOrderUpdatedEvent(order)], stored.user_id)
  if (isConfirmed) publish(sellEditions(order.lines))
}

function scheduleSettlement(stored: StoredOrder) {
  window.setTimeout(() => settleOrder(stored.order.id), Math.max(0, stored.settle_at - Date.now()))
}

// Pedidos que ficaram pendentes antes de um F5 continuam sendo liquidados.
getOrders()
  .filter((stored) => stored.order.status === 'pending')
  .forEach(scheduleSettlement)

export const checkoutHandlers = [
  http.get('/api/coupon/:code', async ({ params }) => {
    await networkDelay()

    const { coupon, error, status } = findCoupon(String(params.code))
    if (!coupon) return HttpResponse.json({ message: error }, { status })
    return HttpResponse.json(coupon)
  }),

  http.post('/api/quote', async ({ request }) => {
    await networkDelay()
    const body = (await request.json()) as QuoteBody
    return HttpResponse.json(buildQuote(body))
  }),

  http.post('/api/wallet/connect', async ({ request }) => {
    await networkDelay()

    if (!findRequestUserId(request)) return unauthorizedResponse()
    const body = (await request.json()) as Pick<WalletConnection, 'provider' | 'network'>
    if (getScenario().wallet === 'reject') {
      return HttpResponse.json({ message: 'A conexão foi recusada na carteira.', code: 'WALLET_REJECTED' }, { status: 403 })
    }

    const wallet = wallets.find((item) => item.provider === body.provider)
    if (!wallet) return HttpResponse.json({ message: 'Carteira não suportada.' }, { status: 422 })
    const connection: WalletConnection = { provider: body.provider as WalletProvider, network: body.network, address: wallet.address }
    return HttpResponse.json(connection)
  }),

  http.post('/api/orders', async ({ request }) => {
    await networkDelay()

    const userId = findRequestUserId(request)
    if (!userId) return unauthorizedResponse()

    const idempotencyKey = request.headers.get('Idempotency-Key')
    if (!idempotencyKey) return HttpResponse.json({ message: 'Envie o header Idempotency-Key.' }, { status: 422 })

    const requestBody = await request.text()
    const existingOrder = getOrders().find((item) => item.user_id === userId && item.idempotency_key === idempotencyKey)
    if (existingOrder) {
      if (existingOrder.request_body !== requestBody) {
        return HttpResponse.json(
          { message: 'Esta tentativa de compra já foi enviada com outros dados.', code: 'IDEMPOTENCY_CONFLICT' },
          { status: 409 },
        )
      }
      return HttpResponse.json(existingOrder.order)
    }

    const body = JSON.parse(requestBody) as CreateOrderBody
    const validationError = validateOrder(body)
    if (validationError) return HttpResponse.json(validationError, { status: 422 })

    const quote = buildQuote(body)
    if (quote.quote_id !== body.quote_id) {
      return HttpResponse.json(
        { message: 'Preço, estoque ou cupom mudaram. Revise os novos valores e confirme de novo.', code: 'QUOTE_CHANGED' },
        { status: 409 },
      )
    }
    if (quote.lines.length === 0) {
      return HttpResponse.json({ message: 'Nenhum item do carrinho está disponível.', code: 'AVAILABILITY_CONFLICT' }, { status: 409 })
    }

    const paymentScenario = getScenario().payment
    const order: Order = {
      id: `KUR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      status: 'pending',
      version: 1,
      created_at: new Date().toISOString(),
      lines: quote.lines,
      subtotal: quote.subtotal,
      discount: quote.discount,
      network_fee: quote.network_fee,
      total: quote.total,
      network: body.network,
      wallet_provider: body.wallet_provider,
      wallet_address: getPaymentAddress(body.profile),
      tx_hash: null,
      decline_reason: null,
    }
    const storedOrder: StoredOrder = {
      order,
      user_id: userId,
      idempotency_key: idempotencyKey,
      request_body: requestBody,
      outcome: paymentScenario === 'decline' ? 'decline' : 'confirm',
      settle_at: Date.now() + SETTLE_DELAY_MS,
    }
    saveOrders([...getOrders(), storedOrder])
    scheduleSettlement(storedOrder)

    if (paymentScenario === 'timeout') await delay(LOST_RESPONSE_DELAY_MS)
    return HttpResponse.json(order, { status: 201 })
  }),

  http.get('/api/orders', async ({ request }) => {
    await networkDelay()

    const userId = findRequestUserId(request)
    if (!userId) return unauthorizedResponse()

    const userOrders = getOrders()
      .filter((item) => item.user_id === userId)
      .map((item) => item.order)
      .reverse()
    return HttpResponse.json(userOrders)
  }),

  http.get('/api/orders/:id', async ({ request, params }) => {
    await networkDelay()

    const userId = findRequestUserId(request)
    if (!userId) return unauthorizedResponse()

    const storedOrder = getOrders().find((item) => item.order.id === params.id && item.user_id === userId)
    if (!storedOrder) return HttpResponse.json({ message: 'Pedido não encontrado.' }, { status: 404 })
    return HttpResponse.json(storedOrder.order)
  }),
]
