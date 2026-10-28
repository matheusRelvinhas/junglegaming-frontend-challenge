import { keepPreviousData, queryOptions, useMutation, useQueries, useQuery } from '@tanstack/react-query'
import type { ApiError, Coupon, ListNftsParams, ListNftsResponse, NftInfo } from '@/types/api'
import { axiosGet } from './api'

export function listNftsQueryOptions(params: ListNftsParams = {}) {
  return queryOptions<ListNftsResponse, ApiError>({
    queryKey: ['list_nfts', params],
    queryFn: ({ signal }) => axiosGet<ListNftsResponse>('list_nfts', { params, signal }),
    placeholderData: keepPreviousData,
  })
}

export function useListNfts(params: ListNftsParams = {}) {
  return useQuery(listNftsQueryOptions(params))
}

export function nftInfoQueryOptions(nftId: number) {
  return queryOptions<NftInfo, ApiError>({
    queryKey: ['nft_info', nftId],
    queryFn: ({ signal }) => axiosGet<NftInfo>(`nft_info/${nftId}`, { signal }),
    retry: (failureCount, error) => error.status !== 404 && failureCount < 1,
  })
}

export function useNftInfo(nftId: number) {
  return useQuery(nftInfoQueryOptions(nftId))
}

export function useNftInfos(nftIds: number[]) {
  return useQueries({ queries: nftIds.map((nftId) => nftInfoQueryOptions(nftId)) })
}

export function useApplyCoupon() {
  return useMutation<Coupon, ApiError, string>({
    mutationFn: (code) => axiosGet<Coupon>(`coupon/${encodeURIComponent(code)}`),
  })
}
