import { ICONS } from './icons'

export type AccountTab = 'profile' | 'wallets' | 'activity' | 'favorites'

export const ACCOUNT_MENU: { tab?: AccountTab; label: string; icon: string }[] = [
  { tab: 'profile', label: 'Dados do perfil', icon: ICONS.userOutline },
  { tab: 'wallets', label: 'Carteiras', icon: ICONS.location },
  { tab: 'activity', label: 'Atividade', icon: ICONS.cart },
  { tab: 'favorites', label: 'Lista de interesse', icon: ICONS.heartOutline },
  { label: 'Ofertas', icon: ICONS.market },
  { label: 'Arquivos baixados', icon: ICONS.download },
  { label: 'Suporte', icon: ICONS.support },
]
