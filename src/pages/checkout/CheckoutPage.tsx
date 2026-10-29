import { Icon } from '@iconify/react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { LoginRequired } from '@/components/LoginRequired'
import { Skeleton } from '@/components/Skeleton'
import { StateMessage } from '@/components/StateMessage'
import { CATALOG_SECTION_ID } from '@/constants/catalog'
import { CHECKOUT_FIELD_ORDER, checkoutFieldId, WALLET_SECTION_ID } from '@/constants/checkout'
import { ICONS } from '@/constants/icons'
import { STORAGE_KEYS } from '@/constants/storage'
import { useAppContext } from '@/context/AppContext'
import { useAuthModal } from '@/hooks/useAuthModal'
import { useWallets } from '@/services/account'
import { useConnectWallet, useCreateOrder, useOrder, useQuote, type OrderAttempt } from '@/services/checkout'
import type {
  ApiError,
  CheckoutProfile,
  Order,
  Quote,
  QuoteBody,
  User,
  WalletConnection,
  WalletProvider,
  Wallets,
} from '@/types/api'
import { readStoredJson, saveStoredJson } from '@/utils/storage'
import { validateCheckoutForm, type CheckoutErrors, type CheckoutValues } from '@/utils/validation'
import { CheckoutSummary, QuoteChangedBanner } from './CheckoutSummary'
import { CollectorProfileForm } from './CollectorProfileForm'
import { OrderReceiptDialog } from './OrderReceiptDialog'
import { WalletPicker } from './WalletPicker'

const CHECKOUT_FORM_ID = 'checkout-form'

function getInitialValues(user: User): CheckoutValues {
  return {
    display_name: user.name,
    username: '',
    network: '',
    profile_name: '',
    wallet_address: '',
    secondary_wallet: '',
    wallet_type: '',
    referral_code: '',
    email: user.email,
    ens_name: '',
    use_secondary_wallet: false,
    note: '',
  }
}

function toProfile(values: CheckoutValues, connectedAddress: string): CheckoutProfile {
  return {
    display_name: values.display_name.trim(),
    username: values.username.trim(),
    profile_name: values.profile_name.trim(),
    wallet_address: values.wallet_address.trim() || connectedAddress,
    secondary_wallet: values.secondary_wallet.trim(),
    wallet_type: values.wallet_type,
    referral_code: values.referral_code.trim().toUpperCase(),
    email: values.email.trim().toLowerCase(),
    ens_name: values.ens_name.trim().toLowerCase(),
    use_secondary_wallet: values.use_secondary_wallet,
    note: values.note.trim(),
  }
}

function readUnansweredAttempt(userId: string) {
  const attempt = readStoredJson<OrderAttempt | null>(STORAGE_KEYS.checkoutAttempt, null)
  return attempt?.user_id === userId ? attempt : null
}

function focusElement(elementId: string) {
  document.getElementById(elementId)?.focus()
}

function OrderStatusNotice({ order }: { order: Order }) {
  if (order.status === 'pending') {
    return (
      <div role="status" className="mb-4 flex items-start gap-3 rounded-sm border border-warning/40 bg-warning/10 p-3 text-sm">
        <Icon icon={ICONS.pending} className="mt-0.5 size-5 shrink-0 animate-pulse text-warning" aria-hidden />
        <p>
          <b className="text-warning">Pagamento pendente.</b>{' '}
          <span className="text-sand">
            Aguardando a confirmação da rede para o pedido {order.id}. Pode recarregar a página: o pedido continua sendo
            acompanhado.
          </span>
        </p>
      </div>
    )
  }

  if (order.status === 'declined') {
    return (
      <div role="alert" className="mb-4 flex items-start gap-3 rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm">
        <Icon icon={ICONS.declined} className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
        <p>
          <b className="text-destructive">Pagamento recusado.</b>{' '}
          <span className="text-sand">{order.decline_reason} Seus itens continuam no carrinho.</span>
        </p>
      </div>
    )
  }

  return (
    <p role="status" className="mb-4 flex items-center gap-2 text-sm text-success">
      <Icon icon={ICONS.check} className="size-5" aria-hidden />
      Compra confirmada.
    </p>
  )
}

function fillWithSavedWallets(values: CheckoutValues, savedWallets: Wallets): CheckoutValues {
  const { primary, secondary, secondary_same_as_primary } = savedWallets
  const secondaryAddress = secondary_same_as_primary ? primary?.address : secondary?.address
  return {
    ...values,
    network: values.network || primary?.network || '',
    wallet_address: values.wallet_address || primary?.address || '',
    secondary_wallet: values.secondary_wallet || secondaryAddress || '',
    wallet_type: values.wallet_type || primary?.wallet_type || '',
  }
}

type CheckoutContentProps = {
  user: User
  orderId?: string
}

function CheckoutContent({ user, orderId }: CheckoutContentProps) {
  const { cartItems, coupon, sessionToken, removePurchasedItems } = useAppContext()
  const { openAuth } = useAuthModal()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentHref = useLocation({ select: (location) => location.href })

  const [values, setValues] = useState(() => getInitialValues(user))
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [formError, setFormError] = useState('')
  const [walletProvider, setWalletProvider] = useState<WalletProvider>('metamask')
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [unansweredAttempt, setUnansweredAttempt] = useState(() => readUnansweredAttempt(user.id))

  const savedWallets = useWallets(sessionToken)
  const [hasUsedSavedWallets, setHasUsedSavedWallets] = useState(false)
  if (savedWallets.data && !hasUsedSavedWallets) {
    setHasUsedSavedWallets(true)
    setValues(fillWithSavedWallets(values, savedWallets.data))
  }

  const connectWallet = useConnectWallet(sessionToken)
  const createOrder = useCreateOrder(sessionToken)
  const orderQuery = useOrder(sessionToken, orderId)
  const order = orderQuery.data
  const isOrderPending = order?.status === 'pending'
  const isOrderConfirmed = order?.status === 'confirmed'
  const isOrderDeclined = order?.status === 'declined'

  const quoteBody: QuoteBody = {
    items: cartItems.map((item) => ({ nft_id: item.nft_id, edition: item.edition, quantity: item.quantity })),
    coupon_code: coupon?.code ?? null,
  }
  const quoteBodyKey = JSON.stringify(quoteBody)
  const quote = useQuote(quoteBody, !order || isOrderDeclined)
  const freshQuote = quote.isPlaceholderData ? undefined : quote.data

  const [review, setReview] = useState<{ bodyKey: string; quote: Quote } | null>(null)
  if (freshQuote && review?.bodyKey !== quoteBodyKey) setReview({ bodyKey: quoteBodyKey, quote: freshQuote })
  const changedQuote = freshQuote && review && freshQuote.quote_id !== review.quote.quote_id ? freshQuote : null

  const isBusy = createOrder.isPending || isOrderPending || isOrderConfirmed
  const summary = order && !isOrderDeclined ? order : quote.data

  useEffect(() => {
    if (order?.status === 'confirmed') removePurchasedItems(order)
  }, [order, removePurchasedItems])

  function updateValue(fieldName: keyof CheckoutValues, value: string | boolean) {
    setValues((previous) => ({ ...previous, [fieldName]: value }))
    setErrors((previous) => ({ ...previous, [fieldName]: undefined }))
    if (fieldName === 'network') disconnectWallet()
  }

  function disconnectWallet() {
    setConnection(null)
    connectWallet.reset()
  }

  function changeWalletProvider(provider: WalletProvider) {
    setWalletProvider(provider)
    disconnectWallet()
  }

  function askToLogInAgain() {
    setFormError('Sua sessão expirou. Entre de novo para concluir a compra; seus dados foram mantidos.')
    openAuth('login', currentHref)
  }

  function connectSelectedWallet() {
    if (!values.network) {
      setErrors((previous) => ({ ...previous, network: 'Selecione a rede antes de conectar a carteira.' }))
      focusElement(checkoutFieldId('network'))
      return
    }

    connectWallet.mutate(
      { provider: walletProvider, network: values.network },
      {
        onSuccess: (newConnection) => {
          setConnection(newConnection)
          setFormError('')
        },
        onError: (error) => {
          if (error.status === 401) askToLogInAgain()
        },
      },
    )
  }

  function showOrderError(error: ApiError) {
    if (error.status === 401) {
      askToLogInAgain()
      return
    }
    if (error.code === 'QUOTE_CHANGED') {
      quote.refetch()
      return
    }
    if (error.field) {
      const fieldName = error.field as keyof CheckoutValues
      setErrors({ [fieldName]: error.message })
      focusElement(checkoutFieldId(fieldName))
      return
    }
    setFormError(error.message)
  }

  function sendAttempt(attempt: OrderAttempt) {
    saveStoredJson(STORAGE_KEYS.checkoutAttempt, attempt)
    setUnansweredAttempt(null)

    createOrder.mutate(attempt, {
      onSuccess: (createdOrder) => {
        saveStoredJson(STORAGE_KEYS.checkoutAttempt, null)
        queryClient.setQueryData(['order', sessionToken, createdOrder.id], createdOrder)
        navigate({ to: '/checkout', search: { order: createdOrder.id }, replace: true })
      },
      onError: (error) => {
        if (error.status === null) {
          setUnansweredAttempt(attempt)
          return
        }
        saveStoredJson(STORAGE_KEYS.checkoutAttempt, null)
        showOrderError(error)
      },
    })
  }

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isBusy) return
    setFormError('')

    const validationErrors = validateCheckoutForm(values)
    setErrors(validationErrors)
    const firstInvalidField = CHECKOUT_FIELD_ORDER.find((fieldName) => validationErrors[fieldName])
    if (firstInvalidField) {
      focusElement(checkoutFieldId(firstInvalidField))
      return
    }
    if (!connection || !values.network) {
      setFormError('Conecte uma carteira para continuar.')
      focusElement(WALLET_SECTION_ID)
      return
    }
    if (!review) {
      setFormError('Aguarde o cálculo do pedido e tente de novo.')
      return
    }

    const quoteToConfirm = changedQuote ?? review.quote
    setReview({ bodyKey: quoteBodyKey, quote: quoteToConfirm })
    if (quoteToConfirm.lines.length === 0) {
      setFormError('Nenhum item do carrinho está disponível.')
      return
    }

    sendAttempt({
      user_id: user.id,
      idempotency_key: crypto.randomUUID(),
      body: {
        ...quoteBody,
        quote_id: quoteToConfirm.quote_id,
        network: values.network,
        wallet_provider: connection.provider,
        profile: toProfile(values, connection.address),
      },
    })
  }

  let submitLabel = 'Confirmar compra'
  if (createOrder.isPending) submitLabel = createOrder.failureCount > 0 ? 'Sem resposta, tentando de novo…' : 'Enviando pedido…'
  else if (isOrderPending) submitLabel = 'Aguardando confirmação…'
  else if (changedQuote) submitLabel = 'Confirmar com novos valores'
  else if (isOrderDeclined) submitLabel = 'Tentar novamente'

  return (
    <div className="grid gap-10 desktop:grid-cols-[1fr_360px] desktop:items-start desktop:gap-8">
      <CollectorProfileForm
        id={CHECKOUT_FORM_ID}
        values={values}
        errors={errors}
        isDisabled={isBusy}
        onChange={updateValue}
        onSubmit={submitOrder}
      />

      <aside aria-label="Resumo e pagamento">
        {quote.isError && !summary ? (
          <StateMessage
            icon={ICONS.offline}
            title="Não foi possível calcular o pedido"
            description={quote.error.message}
            onRetry={() => quote.refetch()}
          />
        ) : (
          <CheckoutSummary
            summary={summary}
            isLoading={quote.isPending && !order}
            warnings={order ? [] : (quote.data?.warnings ?? [])}
            couponError={order ? null : (quote.data?.coupon_error ?? null)}
            canEditCoupon={!isBusy}
          />
        )}

        <WalletPicker
          provider={walletProvider}
          connection={connection}
          isConnecting={connectWallet.isPending}
          connectError={connectWallet.error?.message}
          isDisabled={isBusy}
          onProviderChange={changeWalletProvider}
          onConnect={connectSelectedWallet}
          onDisconnect={disconnectWallet}
        />

        <div className="mt-6">
          {changedQuote && review && <QuoteChangedBanner previous={review.quote} current={changedQuote} />}
          {order && <OrderStatusNotice order={order} />}
          {orderQuery.isError && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {orderQuery.error.message}
            </p>
          )}

          {unansweredAttempt && !createOrder.isPending ? (
            <div role="alert" className="rounded-sm border border-warning/40 bg-warning/10 p-4 text-sm">
              <p className="font-bold text-warning">Não recebemos a resposta da sua compra</p>
              <p className="mt-1 text-sand">
                Recupere o pedido: a mesma tentativa é reenviada, então a compra não é duplicada.
              </p>
              <button
                type="button"
                onClick={() => sendAttempt(unansweredAttempt)}
                className="mt-3 h-11 w-full rounded-full bg-primary font-bold text-primary-foreground hover:brightness-110 desktop:h-10 desktop:rounded-sm"
              >
                Recuperar compra
              </button>
            </div>
          ) : (
            <>
              {formError && (
                <p role="alert" className="mb-3 flex items-center gap-1.5 text-sm text-destructive">
                  <Icon icon={ICONS.declined} className="size-4 shrink-0" aria-hidden />
                  {formError}
                </p>
              )}
              <button
                type="submit"
                form={CHECKOUT_FORM_ID}
                disabled={isBusy}
                className="h-[60px] w-full rounded-full bg-linear-to-r from-primary to-primary-dark text-base font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60 desktop:h-[45px] desktop:rounded-md desktop:bg-none desktop:bg-primary"
              >
                {submitLabel}
              </button>
            </>
          )}
        </div>
      </aside>

      {isOrderConfirmed && <OrderReceiptDialog order={order} onClose={() => navigate({ to: '/' })} />}
    </div>
  )
}

export function CheckoutPage() {
  const { user, isCheckingSession, cartItems } = useAppContext()
  const orderId = useSearch({ strict: false, select: (search) => search.order })

  let content
  if (isCheckingSession) {
    content = <Skeleton className="h-[600px]" />
  } else if (!user) {
    content = <LoginRequired title="Entre para finalizar a compra" />
  } else if (cartItems.length === 0 && !orderId) {
    content = (
      <StateMessage
        icon={ICONS.cart}
        title="Seu carrinho está vazio"
        description="Adicione NFTs ao carrinho para finalizar uma compra."
        action={
          <Link to="/" hash={CATALOG_SECTION_ID}>
            Explorar NFTs
          </Link>
        }
      />
    )
  } else {
    content = <CheckoutContent key={user.id} user={user} orderId={orderId} />
  }

  return (
    <>
      <title>Pagamento | Kurio</title>
      <h1 className="sr-only">Pagamento</h1>
      <Breadcrumb current="Pagamento" />
      <div className="pt-2 desktop:pt-5">{content}</div>
    </>
  )
}
