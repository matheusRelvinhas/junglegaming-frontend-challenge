import Big from 'big.js'

export const ESTIMATED_NETWORK_FEE = '0.016'

export function formatEth(value: Big) {
  const decimals = value.toString().split('.')[1]?.length ?? 0
  return value.toFixed(Math.max(2, decimals))
}
