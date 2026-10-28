import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ApiError, ListNftsParams, ListNftsResponse, NftInfo } from '@/types/api'
import { axiosGet } from './api'

export function useListNfts(params: ListNftsParams = {}) {
  return useQuery<ListNftsResponse, ApiError>({
    queryKey: ['list_nfts', params],
    queryFn: ({ signal }) => axiosGet<ListNftsResponse>('list_nfts', { params, signal }),
    placeholderData: keepPreviousData,
  })
}

export function useNftInfo(nftId: number) {
  return useQuery<NftInfo, ApiError>({
    queryKey: ['nft_info', nftId],
    queryFn: ({ signal }) => axiosGet<NftInfo>(`nft_info/${nftId}`, { signal }),
    retry: (failureCount, error) => error.status !== 404 && failureCount < 1,
  })
}
