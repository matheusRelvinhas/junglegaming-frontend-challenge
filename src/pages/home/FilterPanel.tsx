import { Icon } from '@iconify/react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { useState } from 'react'
import { ModalDialog } from '@/components/ModalDialog'
import { COLLECTIONS, FILTER_DIALOG_ID, NETWORKS } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { useAppContext } from '@/context/AppContext'
import { useCatalogSearch } from '@/hooks/useCatalogSearch'
import type { CatalogFacets } from '@/types/api'

const PRICE_THUMB_LABELS = ['Preço mínimo em ETH', 'Preço máximo em ETH']

function formatEth(value: number) {
  return value.toFixed(2).replace('.', ',')
}

type FilterOptionListProps<Slug extends string> = {
  legend: string
  options: { slug: Slug; label: string }[]
  activeSlug?: Slug
  counts?: Record<Slug, number>
  countClassName?: string
  onToggle: (slug?: Slug) => void
}

function FilterOptionList<Slug extends string>({
  legend,
  options,
  activeSlug,
  counts,
  countClassName,
  onToggle,
}: FilterOptionListProps<Slug>) {
  return (
    <fieldset>
      <legend className="mb-4 text-h3">{legend}</legend>
      <ul className="grid gap-[18px] pl-3">
        {options.map((option) => {
          const isActive = option.slug === activeSlug
          return (
            <li key={option.slug}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onToggle(isActive ? undefined : option.slug)}
                className={`flex w-full justify-between text-[0.9375rem] ${isActive ? 'text-primary' : 'text-sand hover:text-foreground'}`}
              >
                <span>{option.label}</span>
                {counts && <span className={countClassName}>({counts[option.slug]})</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

type PriceRangeFilterProps = {
  bounds: CatalogFacets['price']
  minPrice?: number
  maxPrice?: number
  onApply: (minPrice?: number, maxPrice?: number) => void
}

function PriceRangeFilter({ bounds, minPrice, maxPrice, onApply }: PriceRangeFilterProps) {
  const lowestPrice = Number(bounds.min)
  const highestPrice = Number(bounds.max)
  const [range, setRange] = useState([minPrice ?? lowestPrice, maxPrice ?? highestPrice])

  function applyRange() {
    const [min, max] = range
    onApply(min > lowestPrice ? Number(min.toFixed(2)) : undefined, max < highestPrice ? Number(max.toFixed(2)) : undefined)
  }

  return (
    <fieldset>
      <legend className="mb-4 text-h3">Faixa de preço</legend>
      <div className="pl-3">
        <SliderPrimitive.Root
          min={lowestPrice}
          max={highestPrice}
          step={0.01}
          value={range}
          onValueChange={setRange}
          minStepsBetweenThumbs={1}
          className="relative flex h-[18px] w-full touch-none items-center select-none"
        >
          <SliderPrimitive.Track className="relative h-[3px] grow rounded-full bg-primary/30">
            <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
          </SliderPrimitive.Track>
          {PRICE_THUMB_LABELS.map((label) => (
            <SliderPrimitive.Thumb
              key={label}
              aria-label={label}
              className="block size-[18px] rounded-full border-2 border-surface-3 bg-primary"
            />
          ))}
        </SliderPrimitive.Root>
        <p className="mt-4">
          Preço: {formatEth(range[0])} - {formatEth(range[1])} ETH
        </p>
        <button
          type="button"
          onClick={applyRange}
          className="mt-2 h-[35px] rounded-sm bg-primary px-3 text-[0.9375rem] font-medium text-primary-foreground hover:brightness-110"
        >
          Aplicar
        </button>
      </div>
    </fieldset>
  )
}

type FilterPanelProps = {
  facets?: CatalogFacets
}

export function FilterPanel({ facets }: FilterPanelProps) {
  const { filters, updateCatalogSearch } = useCatalogSearch()
  const hasFilters = Boolean(filters.collection || filters.network || filters.min_price || filters.max_price)

  return (
    <div className="flex flex-col gap-7 bg-surface p-5">
      <FilterOptionList
        legend="Coleções"
        options={COLLECTIONS}
        activeSlug={filters.collection}
        counts={facets?.collections}
        countClassName="font-semibold"
        onToggle={(collection) => updateCatalogSearch({ collection })}
      />

      {facets && (
        <PriceRangeFilter
          key={`${filters.min_price}-${filters.max_price}`}
          bounds={facets.price}
          minPrice={filters.min_price}
          maxPrice={filters.max_price}
          onApply={(min_price, max_price) => updateCatalogSearch({ min_price, max_price })}
        />
      )}

      <FilterOptionList
        legend="Rede"
        options={NETWORKS}
        activeSlug={filters.network}
        counts={facets?.networks}
        onToggle={(network) => updateCatalogSearch({ network })}
      />

      {hasFilters && (
        <button
          type="button"
          onClick={() =>
            updateCatalogSearch({ collection: undefined, network: undefined, min_price: undefined, max_price: undefined })
          }
          className="self-start text-[0.9375rem] text-primary underline-offset-4 hover:underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}

type FilterDialogProps = FilterPanelProps & {
  total?: number
}

export function FilterDialog({ facets, total }: FilterDialogProps) {
  const { isFilterOpen, setIsFilterOpen } = useAppContext()

  function closeDialog() {
    setIsFilterOpen(false)
  }

  return (
    <ModalDialog
      isOpen={isFilterOpen}
      onClose={closeDialog}
      id={FILTER_DIALOG_ID}
      aria-labelledby="filter-dialog-title"
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-surface text-foreground backdrop:bg-background/70"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-5 pt-5 pb-2">
        <h2 id="filter-dialog-title" className="text-h3">
          Filtros
        </h2>
        <button
          type="button"
          onClick={closeDialog}
          aria-label="Fechar filtros"
          className="grid size-9 place-items-center rounded-full border text-primary"
        >
          <Icon icon={ICONS.close} className="size-5" aria-hidden />
        </button>
      </div>

      <FilterPanel facets={facets} />

      <div className="sticky bottom-0 bg-surface px-5 pt-2 pb-5">
        <button
          type="button"
          onClick={closeDialog}
          className="h-[52px] w-full rounded-full bg-linear-to-r from-primary to-primary-dark font-bold text-primary-foreground"
        >
          {total === undefined ? 'Ver resultados' : `Ver ${total} resultados`}
        </button>
      </div>
    </ModalDialog>
  )
}
