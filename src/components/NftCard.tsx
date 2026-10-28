import { Link } from '@tanstack/react-router'
import type { Nft } from '@/types/api'
import { Skeleton } from './Skeleton'

type NftCardProps = {
  nft: Nft
}

export function NftCard({ nft }: NftCardProps) {
  return (
    <article className="relative rounded-xl bg-surface-2 desktop:rounded-none desktop:bg-transparent">
      <Link
        to="/nft/$nftId"
        params={{ nftId: String(nft.id) }}
        className="group block rounded-xl px-1 pt-2 desktop:rounded-none desktop:p-0"
      >
        {nft.rare_nft && (
          <span className="absolute top-4 left-0 z-10 bg-primary px-2 py-1 text-xs text-primary-foreground desktop:left-1 desktop:px-3.5 desktop:text-[0.9375rem]">
            RARO
          </span>
        )}
        <div className="desktop:grid desktop:aspect-[258/300] desktop:place-items-center desktop:bg-surface">
          <img
            src={nft.url_img}
            alt={nft.name}
            width={250}
            height={250}
            loading="lazy"
            className="aspect-square w-full rounded-xl object-cover transition-transform group-hover:scale-[1.02] desktop:w-[97%] desktop:rounded-lg"
          />
        </div>
        <h3 className="mx-1.5 mt-3 text-sm font-normal group-hover:text-primary desktop:mx-0 desktop:mt-4 desktop:text-base">
          {nft.name}
        </h3>
        <p className="mx-1.5 pb-1 text-sm font-bold text-primary desktop:mx-0 desktop:text-[1.0625rem]">
          {nft.currency.ethereum} ETH
        </p>
      </Link>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <>
      <Skeleton className="aspect-square rounded-xl desktop:aspect-[258/300] desktop:rounded-none" />
      <Skeleton className="mt-4 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
    </>
  )
}
