import { useState, type FormEvent } from 'react'
import { useAppContext } from '@/context/AppContext'
import { useApplyCoupon } from '@/services/nfts'

export function CouponForm() {
  const { coupon, setCoupon } = useAppContext()
  const [couponCode, setCouponCode] = useState('')
  const applyCoupon = useApplyCoupon()

  function submitCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    applyCoupon.mutate(couponCode.trim(), {
      onSuccess: (validCoupon) => {
        setCoupon(validCoupon)
        setCouponCode('')
      },
    })
  }

  function removeCoupon() {
    setCoupon(null)
    applyCoupon.reset()
  }

  return (
    <>
      {coupon ? (
        <div className="flex items-center justify-between gap-3 rounded-full border border-primary px-4 py-2 text-sm desktop:rounded-sm">
          <span>
            Cupom <b className="text-primary">{coupon.code}</b> (-{coupon.discount_percent}%)
          </span>
          <button type="button" onClick={removeCoupon} className="text-primary underline-offset-4 hover:underline">
            Remover
          </button>
        </div>
      ) : (
        <form onSubmit={submitCoupon}>
          <label htmlFor="coupon-code" className="sr-only desktop:not-sr-only desktop:mb-1.5 desktop:block desktop:text-[0.8125rem] desktop:font-bold">
            Código promocional
          </label>
          <div className="flex h-12 overflow-hidden rounded-full border desktop:h-10 desktop:rounded-none desktop:border-primary">
            <input
              id="coupon-code"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Digite o código promocional..."
              autoComplete="off"
              aria-invalid={applyCoupon.isError}
              aria-describedby="coupon-feedback"
              className="min-w-0 flex-1 bg-transparent px-4 text-xs outline-none desktop:px-2"
            />
            <button
              type="submit"
              disabled={!couponCode.trim() || applyCoupon.isPending}
              className="rounded-full bg-linear-to-r from-primary to-primary-dark px-4 font-bold text-primary-foreground disabled:opacity-60 desktop:rounded-none desktop:bg-none desktop:bg-primary"
            >
              {applyCoupon.isPending ? 'Aplicando…' : 'Aplicar'}
            </button>
          </div>
        </form>
      )}
      <p id="coupon-feedback" role="alert" className="mt-1.5 mb-3 min-h-5 text-xs text-destructive">
        {applyCoupon.error?.message}
      </p>
    </>
  )
}
