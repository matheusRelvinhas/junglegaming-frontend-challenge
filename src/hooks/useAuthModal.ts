import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { STAY_IN_PLACE } from '@/constants/catalog'

export type AuthMode = 'login' | 'signup'

export function useAuthModal() {
  const authMode: AuthMode | undefined = useSearch({ strict: false, select: (search) => search.auth })
  const redirect: string | undefined = useSearch({ strict: false, select: (search) => search.redirect })
  const navigate = useNavigate()
  const router = useRouter()

  function changeAuthMode(mode?: AuthMode, redirectTo?: string) {
    navigate({ to: '.', search: (previous) => ({ ...previous, auth: mode, redirect: redirectTo }), ...STAY_IN_PLACE })
  }

  function finishLogin() {
    if (redirect) router.history.replace(redirect)
    else changeAuthMode(undefined)
  }

  return {
    authMode,
    // redirect: para onde ir depois do login (ex.: "/checkout"); sem ele, o usuário fica na página atual.
    openAuth: (mode: AuthMode, redirectTo?: string) => changeAuthMode(mode, redirectTo),
    switchAuthMode: (mode: AuthMode) => changeAuthMode(mode, redirect),
    closeAuth: () => changeAuthMode(undefined),
    finishLogin,
  }
}
