import { useNavigate, useSearch } from '@tanstack/react-router'
import { STAY_IN_PLACE } from '@/constants/catalog'

export type AuthMode = 'login' | 'signup'

export function useAuthModal() {
  const authMode: AuthMode | undefined = useSearch({ strict: false, select: (search) => search.auth })
  const navigate = useNavigate()

  function changeAuthMode(mode?: AuthMode) {
    navigate({ to: '.', search: (previous) => ({ ...previous, auth: mode }), ...STAY_IN_PLACE })
  }

  return {
    authMode,
    openAuth: (mode: AuthMode) => changeAuthMode(mode),
    closeAuth: () => changeAuthMode(undefined),
  }
}
