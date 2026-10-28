import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { REALTIME_URL } from '@/constants/realtime'
import type { PriceChange } from '@/context/AppContext'
import type { ListNftsResponse, Nft, NftInfo, NftUpdatedEvent } from '@/types/api'

let activeSocket: Socket | null = null

export function emitToRealtime(eventName: string, ...args: unknown[]) {
  activeSocket?.emit(eventName, ...args)
}

function isNewerUpdate(nft: Nft, event: NftUpdatedEvent) {
  return nft.id === event.resource.id && event.version > nft.version
}

function updateNft<T extends Nft>(nft: T, event: NftUpdatedEvent): T {
  if (!isNewerUpdate(nft, event)) return nft
  return { ...nft, version: event.version, currency: { ...nft.currency, ethereum: event.data.price } }
}

function updateNftInfo(nftInfo: NftInfo, event: NftUpdatedEvent): NftInfo {
  if (!isNewerUpdate(nftInfo, event)) return nftInfo

  const editions = nftInfo.editions.map((edition) => {
    const editionUpdate = event.data.editions.find((item) => item.id === edition.id)
    return editionUpdate ? { ...edition, available: editionUpdate.available } : edition
  })
  return { ...updateNft(nftInfo, event), editions }
}

function findCachedNft(queryClient: QueryClient, nftId: number): Nft | undefined {
  const nftInfo = queryClient.getQueryData<NftInfo>(['nft_info', nftId])
  if (nftInfo) return nftInfo

  const lists = queryClient.getQueriesData<ListNftsResponse>({ queryKey: ['list_nfts'] })
  return lists.map(([, list]) => list?.items.find((item) => item.id === nftId)).find((item) => item !== undefined)
}

export function useNftUpdates() {
  const queryClient = useQueryClient()
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([])
  const [realtimeMessage, setRealtimeMessage] = useState('')

  useEffect(() => {
    let isMounted = true
    let socket: Socket | null = null
    const seenEventIds: string[] = []

    function handleNftUpdated(event: NftUpdatedEvent) {
      if (seenEventIds.includes(event.eventId)) return
      seenEventIds.push(event.eventId)

      const cachedNft = findCachedNft(queryClient, event.resource.id)
      if (!cachedNft || event.version <= cachedNft.version) return

      queryClient.setQueryData<NftInfo>(['nft_info', cachedNft.id], (nftInfo) => nftInfo && updateNftInfo(nftInfo, event))
      queryClient.setQueriesData<ListNftsResponse>({ queryKey: ['list_nfts'] }, (list) =>
        list ? { ...list, items: list.items.map((item) => updateNft(item, event)) } : list,
      )
      queryClient.invalidateQueries({ queryKey: ['list_nfts'], refetchType: 'none' })

      const previousPrice = cachedNft.currency.ethereum
      const newPrice = event.data.price
      if (previousPrice === newPrice) {
        setRealtimeMessage(`Disponibilidade de ${cachedNft.name} atualizada.`)
        return
      }

      setRealtimeMessage(`Preço de ${cachedNft.name} mudou de ${previousPrice} para ${newPrice} ETH.`)
      setPriceChanges((changes) => {
        const earlierChange = changes.find((change) => change.nft_id === cachedNft.id)
        const otherChanges = changes.filter((change) => change.nft_id !== cachedNft.id)
        const priceChange = {
          nft_id: cachedNft.id,
          name: cachedNft.name,
          previous_price: earlierChange?.previous_price ?? previousPrice,
          price: newPrice,
        }
        return [...otherChanges, priceChange]
      })
    }

    import('socket.io-client').then(({ io }) => {
      if (!isMounted) return

      socket = io(REALTIME_URL, { transports: ['websocket'] })
      activeSocket = socket
      socket.on('nft.updated', handleNftUpdated)
      socket.io.on('reconnect', () => {
        queryClient.invalidateQueries({ queryKey: ['list_nfts'] })
        queryClient.invalidateQueries({ queryKey: ['nft_info'] })
      })
    })

    return () => {
      isMounted = false
      socket?.disconnect()
      activeSocket = null
    }
  }, [queryClient])

  function dismissPriceChanges(nftIds: number[]) {
    setPriceChanges((changes) => changes.filter((change) => !nftIds.includes(change.nft_id)))
  }

  return { priceChanges, dismissPriceChanges, realtimeMessage }
}
