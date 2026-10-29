import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { REALTIME_COMMANDS, REALTIME_URL } from '@/constants/realtime'
import type { PriceChange } from '@/context/AppContext'
import type { ListNftsResponse, Nft, NftInfo, NftUpdatedEvent, Order, OrderUpdatedEvent } from '@/types/api'

let activeSocket: Socket | null = null

const ORDER_STATUS_MESSAGES = {
  pending: 'Pedido aguardando confirmação.',
  confirmed: 'Compra confirmada! Seus NFTs estão na sua carteira.',
  declined: 'Pagamento recusado. Seus itens continuam no carrinho.',
}

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

function updateOrder(order: Order | undefined, event: OrderUpdatedEvent) {
  if (!order || order.id !== event.resource.id || event.version <= order.version) return order
  return { ...order, ...event.data, version: event.version }
}

export function useRealtimeUpdates(sessionToken: string | null) {
  const queryClient = useQueryClient()
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([])
  const [realtimeMessage, setRealtimeMessage] = useState('')
  const sessionTokenRef = useRef(sessionToken)

  useEffect(() => {
    sessionTokenRef.current = sessionToken
    if (activeSocket?.connected) activeSocket.emit(REALTIME_COMMANDS.joinSession, sessionToken)
  }, [sessionToken])

  useEffect(() => {
    let isMounted = true
    let socket: Socket | null = null
    const seenEventIds: string[] = []

    function isRepeatedEvent(eventId: string) {
      if (seenEventIds.includes(eventId)) return true
      seenEventIds.push(eventId)
      return false
    }

    function handleOrderUpdated(event: OrderUpdatedEvent) {
      if (isRepeatedEvent(event.eventId)) return
      queryClient.setQueriesData<Order>({ queryKey: ['order'] }, (order) => updateOrder(order, event))
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setRealtimeMessage(ORDER_STATUS_MESSAGES[event.data.status])
    }

    function handleNftUpdated(event: NftUpdatedEvent) {
      if (isRepeatedEvent(event.eventId)) return

      const cachedNft = findCachedNft(queryClient, event.resource.id)
      if (!cachedNft || event.version <= cachedNft.version) return

      queryClient.setQueryData<NftInfo>(['nft_info', cachedNft.id], (nftInfo) => nftInfo && updateNftInfo(nftInfo, event))
      queryClient.setQueriesData<ListNftsResponse>({ queryKey: ['list_nfts'] }, (list) =>
        list ? { ...list, items: list.items.map((item) => updateNft(item, event)) } : list,
      )
      queryClient.invalidateQueries({ queryKey: ['list_nfts'], refetchType: 'none' })
      queryClient.invalidateQueries({ queryKey: ['quote'] })

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
      const connectedSocket = socket
      connectedSocket.on('connect', () => connectedSocket.emit(REALTIME_COMMANDS.joinSession, sessionTokenRef.current))
      connectedSocket.on('nft.updated', handleNftUpdated)
      connectedSocket.on('order.updated', handleOrderUpdated)
      connectedSocket.io.on('reconnect', () => {
        queryClient.invalidateQueries({ queryKey: ['list_nfts'] })
        queryClient.invalidateQueries({ queryKey: ['nft_info'] })
        queryClient.invalidateQueries({ queryKey: ['quote'] })
        queryClient.invalidateQueries({ queryKey: ['order'] })
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
