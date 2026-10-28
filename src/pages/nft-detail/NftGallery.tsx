import { Icon } from '@iconify/react'
import { useState } from 'react'
import { ModalDialog } from '@/components/ModalDialog'
import { ICONS } from '@/constants/icons'
import type { NftInfo } from '@/types/api'

type NftGalleryProps = {
  nft: NftInfo
}

export function NftGallery({ nft }: NftGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const selectedImage = nft.gallery[selectedIndex]

  return (
    <div className="flex flex-col gap-3 desktop:flex-row-reverse desktop:items-start desktop:gap-5">
      <div className="relative flex-1 rounded-2xl bg-surface p-3 desktop:rounded-none desktop:p-5">
        <img
          src={selectedImage}
          alt={nft.name}
          width={404}
          height={404}
          fetchPriority="high"
          className="aspect-square w-full rounded-xl object-cover desktop:rounded-2xl"
        />
        <button
          type="button"
          onClick={() => setIsZoomOpen(true)}
          aria-label="Ampliar imagem"
          className="absolute top-5 right-5 grid size-8 place-items-center rounded-full bg-background text-foreground hover:text-primary"
        >
          <Icon icon={ICONS.zoom} className="size-5" aria-hidden />
        </button>
      </div>

      <ul aria-label="Imagens do NFT" className="flex gap-3 desktop:flex-col desktop:gap-4">
        {nft.gallery.map((image, index) => (
          <li key={index}>
            <button
              type="button"
              aria-label={`Ver imagem ${index + 1} de ${nft.gallery.length}`}
              aria-pressed={index === selectedIndex}
              onClick={() => setSelectedIndex(index)}
              className="block overflow-hidden rounded-md outline-primary aria-pressed:outline-1"
            >
              <img src={image} alt="" width={80} height={80} className="size-16 object-cover desktop:size-20" />
            </button>
          </li>
        ))}
      </ul>

      <ModalDialog
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        aria-label={`Imagem ampliada: ${nft.name}`}
        className="m-auto w-[min(90vw,720px)] overflow-visible bg-transparent backdrop:bg-background/85"
      >
        <img src={selectedImage} alt={nft.name} className="max-h-[85dvh] w-full rounded-2xl object-contain" />
        <button
          type="button"
          autoFocus
          onClick={() => setIsZoomOpen(false)}
          aria-label="Fechar imagem ampliada"
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-background text-primary"
        >
          <Icon icon={ICONS.close} className="size-5" aria-hidden />
        </button>
      </ModalDialog>
    </div>
  )
}
