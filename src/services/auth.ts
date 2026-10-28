import { useMutation, useQuery } from '@tanstack/react-query'
import type { ApiError, AuthResponse, LoginBody, RegisterBody, UserResponse } from '@/types/api'
import { axiosGet, axiosPost } from './api'

export function useSession(token: string | null) {
  return useQuery<UserResponse, ApiError>({
    queryKey: ['session', token],
    queryFn: ({ signal }) => axiosGet<UserResponse>('auth/session', { signal, token: token ?? undefined }),
    enabled: token !== null,
    retry: false,
    staleTime: Infinity,
  })
}

export function useLogin() {
  return useMutation<AuthResponse, ApiError, LoginBody>({
    mutationFn: (body) => axiosPost<AuthResponse>('auth/login', body),
  })
}

export function useRegister() {
  return useMutation<UserResponse, ApiError, RegisterBody>({
    mutationFn: (body) => axiosPost<UserResponse>('auth/register', body),
  })
}

export function useLogout() {
  return useMutation<unknown, ApiError, string>({
    mutationFn: (token) => axiosPost('auth/logout', {}, { token }),
  })
}
