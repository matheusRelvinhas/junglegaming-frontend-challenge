import Big from 'big.js'

export const ESTIMATED_NETWORK_FEE = '0.016'

export function formatEth(value: Big | string) {
  const amount = new Big(value)
  const decimals = amount.toString().split('.')[1]?.length ?? 0
  return amount.toFixed(Math.max(2, decimals))
}

export function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
